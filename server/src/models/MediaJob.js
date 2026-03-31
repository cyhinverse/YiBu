import { Schema, Types, model } from 'mongoose';

const MediaJobSchema = new Schema(
  {
    owner: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ['post', 'message', 'avatar', 'cover'],
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    field: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'working', 'done', 'failed'],
      default: 'pending',
      index: true,
    },
    tries: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
      default: '',
    },
    files: [
      {
        tempId: { type: String, required: true },
        path: { type: String, required: true },
        name: { type: String, default: '' },
        mimeType: { type: String, default: '' },
        size: { type: Number, default: 0 },
        type: {
          type: String,
          enum: ['image', 'video'],
          required: true,
        },
      },
    ],
    results: [
      {
        tempId: { type: String, required: true },
        url: { type: String, default: '' },
        type: {
          type: String,
          enum: ['image', 'video'],
          required: true,
        },
        publicId: { type: String, default: '' },
        width: { type: Number },
        height: { type: Number },
        duration: { type: Number },
        thumbnail: { type: String, default: '' },
        filename: { type: String, default: '' },
        mimeType: { type: String, default: '' },
        size: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ['ready', 'failed'],
          default: 'ready',
        },
      },
    ],
  },
  {
    collection: 'MediaJobs',
    timestamps: true,
  }
);

MediaJobSchema.index({ owner: 1, status: 1, createdAt: -1 });
MediaJobSchema.index({ kind: 1, status: 1, createdAt: -1 });

const MediaJob = model('MediaJob', MediaJobSchema);

export default MediaJob;
