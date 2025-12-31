import mongoose from 'mongoose';

const AdminLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ['user', 'post', 'comment', 'report', 'system', 'other'],
    },
    targetId: {
      type: mongoose.Schema.Types.Mixed, // Can be ObjectId or string
      default: null,
    },
    level: {
      type: String,
      enum: ['info', 'warning', 'error', 'success'],
      default: 'info',
    },
    details: {
      type: String,
      default: '',
    },
    metadata: {
      type: Object,
      default: {},
    },
    ip: {
      type: String,
      default: 'unknown',
    },
    userAgent: {
      type: String,
      default: 'unknown',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
AdminLogSchema.index({ createdAt: -1 });
AdminLogSchema.index({ admin: 1 });
AdminLogSchema.index({ action: 1 });
AdminLogSchema.index({ level: 1 });

const AdminLog = mongoose.model('AdminLog', AdminLogSchema);

export default AdminLog;
