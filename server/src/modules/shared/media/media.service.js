import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import cloudinary from '../../../configs/cloudinaryConfig.js';
import logger from '../../../configs/logger.js';
import { getChannel, rabbit } from '../../../configs/rabbitmq.config.js';
import ApiError from '../../../helpers/ApiError.js';
import MediaJob from '../../../models/MediaJob.js';
import Message from '../../../models/Message.js';
import Post from '../../../models/Post.js';
import User from '../../../models/User.js';

const JOB = 'media';
const EVENT = 'media.upload';
const RETRY_LIMIT = 3;
const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../tmp/media'
);

class MediaService {
  static getRetryLimit() {
    return RETRY_LIMIT;
  }

  static async makePost(files, userId, postId) {
    return this._make('post', files, userId, postId);
  }

  static async makeMessage(files, userId, messageId) {
    return this._make('message', files, userId, messageId);
  }

  static async makeAvatar(file, userId) {
    return this._make('avatar', [file], userId, userId, 'avatar');
  }

  static async makeCover(file, userId) {
    return this._make('cover', [file], userId, userId, 'cover');
  }

  static async send(jobId, meta = {}) {
    const queue = rabbit.media;
    const id = randomUUID();
    const channel = await getChannel(JOB);
    const message = {
      type: EVENT,
      jobId,
      meta: {
        source: meta.source || 'media.service',
        traceId: meta.traceId || id,
        time: meta.time || new Date().toISOString(),
      },
      tries: 0,
    };

    await channel.publish(queue.exchange, queue.key, message, {
      persistent: true,
      messageId: id,
      timestamp: Date.now(),
      contentType: 'application/json',
      type: message.type,
      headers: {
        traceId: message.meta.traceId,
        source: message.meta.source,
        tries: message.tries,
      },
    });

    return { queued: true, id };
  }

  static async drop(jobId) {
    const job = await MediaJob.findById(jobId).lean();
    if (!job) {
      return;
    }

    await this._clearFiles(job.files);
    await MediaJob.findByIdAndDelete(jobId);
  }

  static async fail(jobId, error) {
    const job = await MediaJob.findById(jobId).lean();
    if (!job) {
      return;
    }

    await MediaJob.findByIdAndUpdate(jobId, {
      status: 'failed',
      error: error?.message || 'Queue publish failed',
    });

    await this._markFailed(job, error?.message || 'Queue publish failed');
    await this._clearFiles(job.files);
  }

  static async handleMessage(msg, options = {}) {
    const logModule = options.logModule || 'media-worker';
    const data = this._read(msg, logModule);

    if (!data) {
      return { shouldAck: true };
    }

    if (data.type !== EVENT || !data.jobId) {
      logger.warn('Unsupported media event skipped', {
        module: logModule,
        type: data.type,
        jobId: data.jobId,
      });
      return { shouldAck: true };
    }

    try {
      await this.run(data.jobId);
      logger.info('Media processed successfully', {
        module: logModule,
        jobId: data.jobId,
        tries: data.tries ?? 0,
      });
      return { shouldAck: true };
    } catch (error) {
      await this._retryOrDead(data, error, logModule);
      return { shouldAck: true };
    }
  }

  static async run(jobId) {
    const job = await MediaJob.findById(jobId).lean();

    if (!job) {
      return null;
    }

    if (job.status === 'done') {
      return job;
    }

    await MediaJob.findByIdAndUpdate(jobId, {
      status: 'working',
      error: '',
    });

    const results = [];

    for (const file of job.files) {
      const result = await this._upload(job, file);
      results.push(result);
    }

    await this._saveResult(job, results);

    await MediaJob.findByIdAndUpdate(jobId, {
      status: 'done',
      results,
      error: '',
    });

    await this._clearFiles(job.files);
    return results;
  }

  static async _make(kind, files, userId, targetId, field = '') {
    const list = (Array.isArray(files) ? files : [files]).filter(Boolean);

    if (list.length === 0) {
      return null;
    }

    if ((kind === 'avatar' || kind === 'cover') && list.some(file => !file.mimetype?.startsWith('image/'))) {
      throw ApiError.badRequest('Avatar và cover chỉ hỗ trợ file ảnh');
    }

    const jobId = new mongoose.Types.ObjectId();
    const staged = [];

    try {
      for (let index = 0; index < list.length; index += 1) {
        staged.push(await this._saveFile(jobId, list[index], index));
      }

      await MediaJob.create({
        _id: jobId,
        owner: userId,
        kind,
        targetId: String(targetId),
        field,
        files: staged,
      });

      return {
        jobId: jobId.toString(),
        items: staged.map(item => this._toPending(jobId, item)),
      };
    } catch (error) {
      await this._clearFiles(staged);
      throw error;
    }
  }

  static async _saveFile(jobId, file, index) {
    const folder = path.join(ROOT, jobId.toString());
    const tempId = randomUUID();
    const ext = path.extname(file.originalname || '') || this._ext(file.mimetype);
    const filePath = path.join(folder, `${String(index).padStart(2, '0')}-${tempId}${ext}`);

    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(filePath, file.buffer);

    return {
      tempId,
      path: filePath,
      name: file.originalname || '',
      mimeType: file.mimetype || '',
      size: file.size || 0,
      type: this._fileType(file.mimetype),
    };
  }

  static _toPending(jobId, file) {
    return {
      jobId: jobId.toString(),
      tempId: file.tempId,
      status: 'pending',
      type: file.type,
      filename: file.name,
      mimeType: file.mimeType,
      size: file.size,
    };
  }

  static _fileType(mimeType = '') {
    return mimeType.startsWith('video/') ? 'video' : 'image';
  }

  static _ext(mimeType = '') {
    const map = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
    };

    return map[mimeType] || '';
  }

  static async _upload(job, file) {
    const resourceType = file.type === 'video' ? 'video' : 'image';
    const folder = this._folder(job);
    const publicId = this._publicId(job, file);
    const options = {
      folder,
      public_id: publicId,
      resource_type: resourceType,
      transformation: this._transform(job, file),
    };

    const result = await cloudinary.uploader.upload(file.path, options);

    return {
      tempId: file.tempId,
      url: result.secure_url,
      type: file.type,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      duration: result.duration,
      thumbnail:
        file.type === 'video'
          ? this._videoThumb(result.public_id)
          : '',
      filename: file.name,
      mimeType: file.mimeType,
      size: file.size,
      status: 'ready',
    };
  }

  static _folder(job) {
    if (job.kind === 'post') return 'posts';
    if (job.kind === 'message') return 'messages';
    if (job.kind === 'avatar') return 'avatars';
    return 'covers';
  }

  static _publicId(job, file) {
    const head = job.kind === 'message' ? 'msg' : job.kind;
    return `${head}_${job.owner}_${Date.now()}_${file.tempId}`;
  }

  static _transform(job, file) {
    if (job.kind === 'avatar') {
      return [
        { width: 400, height: 400, crop: 'fill', gravity: 'auto' },
        { quality: 'auto:good', fetch_format: 'auto' },
      ];
    }

    if (job.kind === 'cover') {
      return [
        { width: 1500, height: 500, crop: 'fill', gravity: 'auto' },
        { quality: 'auto:good', fetch_format: 'auto' },
      ];
    }

    if (file.type === 'video') {
      return [
        { width: 1280, crop: 'limit' },
        { quality: 'auto:good' },
      ];
    }

    return [
      { width: job.kind === 'message' ? 1200 : 1600, crop: 'limit' },
      { quality: 'auto:good', fetch_format: 'auto', flags: 'progressive' },
    ];
  }

  static _videoThumb(publicId) {
    return cloudinary.url(publicId, {
      secure: true,
      resource_type: 'video',
      format: 'jpg',
      transformation: [{ width: 960, crop: 'limit' }],
    });
  }

  static async _saveResult(job, results) {
    const map = new Map(results.map(item => [item.tempId, item]));

    if (job.kind === 'post') {
      const post = await Post.findById(job.targetId);
      if (!post) {
        throw new Error('Post not found for media job');
      }

      post.media = post.media.map(item => {
        const current = item?.toObject ? item.toObject() : item;
        return map.get(current.tempId) || current;
      });
      await post.save();
      return;
    }

    if (job.kind === 'message') {
      const message = await Message.findById(job.targetId);
      if (!message) {
        throw new Error('Message not found for media job');
      }

      message.media = message.media.map(item => {
        const current = item?.toObject ? item.toObject() : item;
        return map.get(current.tempId) || current;
      });
      await message.save();
      return;
    }

    const result = results[0];
    const field = job.field;
    await User.findByIdAndUpdate(job.targetId, {
      [field]: result?.url || '',
      [`${field}Status`]: 'ready',
    });
  }

  static async _markFailed(job, reason) {
    if (job.kind === 'post') {
      const post = await Post.findById(job.targetId);
      if (!post) {
        return;
      }

      const failed = new Set(job.files.map(item => item.tempId));
      post.media = post.media.map(item => {
        const current = item?.toObject ? item.toObject() : item;
        if (!failed.has(current.tempId)) {
          return current;
        }

        return {
          ...current,
          status: 'failed',
        };
      });
      await post.save();
      return;
    }

    if (job.kind === 'message') {
      const message = await Message.findById(job.targetId);
      if (!message) {
        return;
      }

      const failed = new Set(job.files.map(item => item.tempId));
      message.media = message.media.map(item => {
        const current = item?.toObject ? item.toObject() : item;
        if (!failed.has(current.tempId)) {
          return current;
        }

        return {
          ...current,
          status: 'failed',
        };
      });
      await message.save();
      return;
    }

    await User.findByIdAndUpdate(job.targetId, {
      [`${job.field}Status`]: 'failed',
    });

    logger.warn('Media job failed', {
      module: 'media',
      jobId: job._id?.toString(),
      kind: job.kind,
      reason,
    });
  }

  static _read(message, logModule) {
    try {
      return JSON.parse(message.content.toString('utf8'));
    } catch (error) {
      logger.error('Failed to parse media message', {
        module: logModule,
        messageId: message.properties?.messageId,
        content: message.content?.toString('utf8'),
        parseError: error.message,
      });
      return null;
    }
  }

  static _options(message) {
    return {
      persistent: true,
      contentType: 'application/json',
      type: message.type,
      messageId: randomUUID(),
      timestamp: Date.now(),
      headers: {
        traceId: message.meta?.traceId,
        source: message.meta?.source,
        tries: message.tries ?? 0,
      },
    };
  }

  static async _publish(exchange, key, message) {
    const channel = await getChannel(JOB);
    await channel.publish(exchange, key, message, this._options(message));
  }

  static async _publishDead(message, error, reason) {
    const queue = rabbit.media;
    const dead = {
      ...message,
      meta: {
        ...message.meta,
        failedAt: new Date().toISOString(),
        failureReason: reason,
        lastError: error?.message,
      },
    };

    await this._publish(queue.deadExchange, queue.deadKey, dead);
  }

  static async _publishRetry(message, error) {
    const queue = rabbit.media;
    const retry = {
      ...message,
      tries: (Number(message.tries) || 0) + 1,
      meta: {
        ...message.meta,
        lastRetryAt: new Date().toISOString(),
        lastError: error?.message,
      },
    };

    await MediaJob.findByIdAndUpdate(message.jobId, {
      tries: retry.tries,
      error: error?.message || '',
      status: 'pending',
    });

    await this._publish(queue.retryExchange, queue.retryKey, retry);
  }

  static async _retryOrDead(message, error, logModule) {
    const tries = Number(message.tries) || 0;

    if (tries >= RETRY_LIMIT) {
      const job = await MediaJob.findById(message.jobId).lean();

      if (job) {
        await MediaJob.findByIdAndUpdate(message.jobId, {
          status: 'failed',
          error: error?.message || '',
        });
        await this._markFailed(job, error?.message || '');
        await this._clearFiles(job.files);
      }

      await this._publishDead(message, error, 'max_retries_exceeded');

      logger.error('Media moved to DLQ after max retries', {
        module: logModule,
        jobId: message.jobId,
        tries,
        message: error?.message,
        stack: error?.stack,
      });
      return;
    }

    try {
      await this._publishRetry(message, error);
      logger.warn('Media republished to retry exchange', {
        module: logModule,
        jobId: message.jobId,
        nextTry: tries + 1,
        message: error?.message,
      });
    } catch (retryError) {
      const job = await MediaJob.findById(message.jobId).lean();

      if (job) {
        await MediaJob.findByIdAndUpdate(message.jobId, {
          status: 'failed',
          error: retryError?.message || '',
        });
        await this._markFailed(job, retryError?.message || '');
        await this._clearFiles(job.files);
      }

      await this._publishDead(message, retryError, 'retry_publish_failed');
    }
  }

  static async _clearFiles(files = []) {
    const paths = files.map(item => item?.path).filter(Boolean);
    const folders = new Set(paths.map(item => path.dirname(item)));

    await Promise.allSettled(paths.map(item => fs.unlink(item)));
    await Promise.allSettled(
      Array.from(folders).map(folder => fs.rm(folder, { recursive: true, force: true }))
    );
  }
}

export default MediaService;
