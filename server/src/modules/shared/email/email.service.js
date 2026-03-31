import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';
import config from '../../../configs/config.js';
import logger from '../../../configs/logger.js';
import { getChannel, rabbit } from '../../../configs/rabbitmq.config.js';

const JOB = 'email';
const EVENT = 'email.send';
const RETRY_LIMIT = 3;

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  static getRetryLimit() {
    return RETRY_LIMIT;
  }

  async sendEmail(to, subject, html, meta = {}) {
    if (!to || !subject || !html) {
      throw new Error('to, subject and html are required');
    }

    const id = randomUUID();
    const queue = rabbit.email;
    const channel = await getChannel(JOB);
    const message = {
      type: EVENT,
      data: { to, subject, html },
      meta: {
        source: meta.source || 'email.service',
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

  async sendNow(data) {
    const { to, subject, html } = data;

    logger.info(
      `Attempting to send email to ${to} via ${config.email.host}:${config.email.port}`
    );

    const info = await this.transporter.sendMail({
      from: `"YiBu Security" <${config.email.user}>`,
      to,
      subject,
      html,
    });

    logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
    return info;
  }

  async handleMessage(msg, options = {}) {
    const logModule = options.logModule || 'email-worker';
    const data = this._read(msg, logModule);

    if (!data) {
      return { shouldAck: true };
    }

    if (data.type !== EVENT) {
      logger.warn('Unsupported email event skipped', {
        module: logModule,
        type: data.type,
        traceId: data.meta?.traceId,
      });
      return { shouldAck: true };
    }

    if (!data.data?.to || !data.data?.subject || !data.data?.html) {
      await this._publishDead(data, null, 'email_payload_missing');
      logger.warn('Malformed email payload moved to DLQ', {
        module: logModule,
        traceId: data.meta?.traceId,
      });
      return { shouldAck: true };
    }

    try {
      await this.sendNow(data.data);
      logger.info('Email processed successfully', {
        module: logModule,
        traceId: data.meta?.traceId,
        tries: data.tries ?? 0,
      });
      return { shouldAck: true };
    } catch (error) {
      await this._retryOrDead(data, error, logModule);
      return { shouldAck: true };
    }
  }

  async sendPasswordReset(to, resetLink) {
    const subject = 'Yêu cầu đặt lại mật khẩu - YiBu';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Xin chào,</h2>
        <p>Bạn nhận được email này vì đã yêu cầu đặt lại mật khẩu cho tài khoản YiBu.</p>
        <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu (Token hết hạn sau 1 giờ):</p>
        <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Đặt lại mật khẩu</a>
        <p>Hoặc truy cập link sau:</p>
        <p>${resetLink}</p>
        <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
        <hr>
        <p style="font-size: 12px; color: #888;">YiBu Security Team</p>
      </div>
    `;

    return this.sendEmail(to, subject, html, {
      source: 'email.passwordReset',
    });
  }

  async sendVerificationEmail(to, verificationLink) {
    const subject = 'Xác thực tài khoản - YiBu';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Chào mừng đến với YiBu!</h2>
        <p>Vui lòng xác thực địa chỉ email để kích hoạt đầy đủ tính năng:</p>
        <a href="${verificationLink}" style="background-color: #008CBA; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Xác thực Email</a>
        <p>Hoặc truy cập link sau:</p>
        <p>${verificationLink}</p>
        <hr>
        <p style="font-size: 12px; color: #888;">YiBu Team</p>
      </div>
    `;

    return this.sendEmail(to, subject, html, {
      source: 'email.verification',
    });
  }

  _read(message, logModule) {
    try {
      return JSON.parse(message.content.toString('utf8'));
    } catch (error) {
      logger.error('Failed to parse email message', {
        module: logModule,
        messageId: message.properties?.messageId,
        content: message.content?.toString('utf8'),
        parseError: error.message,
      });
      return null;
    }
  }

  _options(message) {
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

  async _publish(exchange, key, message) {
    const channel = await getChannel(JOB);
    await channel.publish(exchange, key, message, this._options(message));
  }

  async _publishDead(message, error, reason) {
    const queue = rabbit.email;
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

  async _publishRetry(message, error) {
    const queue = rabbit.email;
    const retry = {
      ...message,
      tries: (Number(message.tries) || 0) + 1,
      meta: {
        ...message.meta,
        lastRetryAt: new Date().toISOString(),
        lastError: error?.message,
      },
    };

    await this._publish(queue.retryExchange, queue.retryKey, retry);
  }

  async _retryOrDead(message, error, logModule) {
    const tries = Number(message.tries) || 0;

    if (tries >= RETRY_LIMIT) {
      await this._publishDead(message, error, 'max_retries_exceeded');

      logger.error('Email moved to DLQ after max retries', {
        module: logModule,
        tries,
        traceId: message.meta?.traceId,
        message: error?.message,
        stack: error?.stack,
      });
      return;
    }

    try {
      await this._publishRetry(message, error);

      logger.warn('Email republished to retry exchange', {
        module: logModule,
        nextTry: tries + 1,
        traceId: message.meta?.traceId,
        message: error?.message,
      });
    } catch (retryError) {
      logger.error('Retry republish failed, sending email to DLQ', {
        module: logModule,
        traceId: message.meta?.traceId,
        message: retryError?.message,
        stack: retryError?.stack,
      });

      await this._publishDead(message, retryError, 'retry_publish_failed');
    }
  }
}

export default new EmailService();
