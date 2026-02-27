import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import cloudinary from '../../../src/configs/cloudinaryConfig.js';
import upload, {
  uploadToCloudinary,
  deleteFromCloudinary,
} from '../../../src/middlewares/multerUpload.js';

const ENV_KEYS = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const snapshotEnv = () =>
  ENV_KEYS.reduce((acc, key) => {
    acc[key] = process.env[key];
    return acc;
  }, {});

const restoreEnv = envSnapshot => {
  for (const key of ENV_KEYS) {
    if (envSnapshot[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = envSnapshot[key];
    }
  }
};

describe('multerUpload middleware helpers', () => {
  it('upload.fileFilter should reject unsupported mime types', () => {
    let callbackArgs;

    upload.fileFilter({}, { mimetype: 'application/pdf' }, (...args) => {
      callbackArgs = args;
    });

    assert.equal(callbackArgs[0].statusCode, 415);
    assert.equal(callbackArgs[1], false);
  });

  it('upload.fileFilter should accept supported image/video mime types', () => {
    {
      let callbackArgs;
      upload.fileFilter({}, { mimetype: 'image/png' }, (...args) => {
        callbackArgs = args;
      });
      assert.deepEqual(callbackArgs, [null, true]);
    }

    {
      let callbackArgs;
      upload.fileFilter({}, { mimetype: 'video/mp4' }, (...args) => {
        callbackArgs = args;
      });
      assert.deepEqual(callbackArgs, [null, true]);
    }
  });

  it('uploadToCloudinary should reject when cloudinary env is missing', async () => {
    const originalEnv = snapshotEnv();

    try {
      for (const key of ENV_KEYS) {
        delete process.env[key];
      }

      await assert.rejects(
        uploadToCloudinary(Buffer.from('abc')),
        err => err?.errorCode === 'CONFIG_MISSING'
      );
    } finally {
      restoreEnv(originalEnv);
    }
  });

  it('uploadToCloudinary should reject when cloudinary upload callback returns error', async () => {
    const originalEnv = snapshotEnv();
    const originalUploadStream = cloudinary.uploader.upload_stream;

    try {
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-key';
      process.env.CLOUDINARY_API_SECRET = 'test-secret';

      cloudinary.uploader.upload_stream = (_options, cb) => ({
        end: () => cb(new Error('cloudinary upload failed')),
      });

      await assert.rejects(
        uploadToCloudinary(Buffer.from('hello')),
        err => err?.message === 'cloudinary upload failed'
      );
    } finally {
      cloudinary.uploader.upload_stream = originalUploadStream;
      restoreEnv(originalEnv);
    }
  });

  it('uploadToCloudinary should call cloudinary.uploader.upload_stream with merged options', async () => {
    const originalEnv = snapshotEnv();
    const originalUploadStream = cloudinary.uploader.upload_stream;
    let capturedOptions = null;
    let capturedBuffer = null;

    try {
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-key';
      process.env.CLOUDINARY_API_SECRET = 'test-secret';

      cloudinary.uploader.upload_stream = (options, cb) => {
        capturedOptions = options;
        return {
          end: buffer => {
            capturedBuffer = buffer;
            cb(null, { public_id: 'file-1', secure_url: 'https://cdn.example/file-1' });
          },
        };
      };

      const result = await uploadToCloudinary(Buffer.from('hello'), {
        folder: 'posts',
        resourceType: 'image',
        publicId: 'post_1',
      });

      assert.equal(result.public_id, 'file-1');
      assert.equal(capturedOptions.folder, 'posts');
      assert.equal(capturedOptions.resource_type, 'image');
      assert.equal(capturedOptions.public_id, 'post_1');
      assert.equal(capturedBuffer.toString(), 'hello');
    } finally {
      cloudinary.uploader.upload_stream = originalUploadStream;
      restoreEnv(originalEnv);
    }
  });

  it('deleteFromCloudinary should proxy call to cloudinary.uploader.destroy', async () => {
    const originalDestroy = cloudinary.uploader.destroy;
    let receivedArgs = null;

    try {
      cloudinary.uploader.destroy = async (...args) => {
        receivedArgs = args;
        return { result: 'ok' };
      };

      const result = await deleteFromCloudinary('post_1', 'video');

      assert.deepEqual(receivedArgs, ['post_1', { resource_type: 'video' }]);
      assert.deepEqual(result, { result: 'ok' });
    } finally {
      cloudinary.uploader.destroy = originalDestroy;
    }
  });
});
