import Joi from 'joi';
import { objectId } from './common.validation.js';

const REPORT_CATEGORIES = [
  'spam',
  'harassment',
  'hate_speech',
  'violence',
  'nudity',
  'misinformation',
  'copyright',
  'impersonation',
  'self_harm',
  'illegal',
  'scam',
  'other',
  'fake_account',
];

const reportReason = Joi.string().trim().min(2).max(500).required();

const reportBody = Joi.object({
  category: Joi.string().valid(...REPORT_CATEGORIES),
  reason: reportReason,
  description: Joi.string().trim().max(500).allow(''),
});

export const createReportBody = Joi.object({
  targetType: Joi.string().valid('post', 'comment', 'user', 'message').required(),
  targetId: objectId.required(),
  category: Joi.string().valid(...REPORT_CATEGORIES),
  reason: reportReason,
  description: Joi.string().trim().max(500).allow(''),
});

export const reportPostParam = Joi.object({
  postId: objectId.required(),
});

export const reportPostBody = reportBody;

export const reportCommentParam = Joi.object({
  commentId: objectId.required(),
});

export const reportCommentBody = reportBody;

export const reportUserParam = Joi.object({
  userId: objectId.required(),
});

export const reportUserBody = reportBody;

export const reportMessageParam = Joi.object({
  messageId: objectId.required(),
});

export const reportMessageBody = reportBody;

export const myReportsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  status: Joi.string().valid(
    'pending',
    'reviewing',
    'in_review',
    'resolved',
    'dismissed',
    'rejected',
    'escalated'
  ),
});

export const reportIdParam = Joi.object({
  reportId: objectId.required(),
});

export const getAllReportsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid(
    'pending',
    'reviewing',
    'in_review',
    'resolved',
    'dismissed',
    'rejected',
    'escalated'
  ),
  category: Joi.string().valid(...REPORT_CATEGORIES),
  targetType: Joi.string().valid('post', 'comment', 'user', 'message'),
  priority: Joi.number().integer().min(0),
  sort: Joi.string().valid('newest', 'oldest').default('newest'),
});

export const pendingReportsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const reportsAgainstUserParam = Joi.object({
  userId: objectId.required(),
});

export const reportsAgainstUserQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  status: Joi.string().valid(
    'pending',
    'reviewing',
    'in_review',
    'resolved',
    'dismissed',
    'rejected',
    'escalated'
  ),
});

export const startReviewParam = Joi.object({
  reportId: objectId.required(),
});

export const resolveReportParam = Joi.object({
  reportId: objectId.required(),
});

export const resolveReportBody = Joi.object({
  decision: Joi.string().valid('resolved', 'rejected', 'escalated'),
  actionTaken: Joi.string().valid('warn_user', 'remove_content', 'suspend_user', 'ban_user'),
  action: Joi.string().valid(
    'dismiss',
    'warn',
    'hide_content',
    'remove_content',
    'suspend_user',
    'ban_user'
  ),
  resolution: Joi.string().valid('dismissed', 'content_removed', 'user_warned', 'user_suspended', 'user_banned'),
  notes: Joi.string().trim().max(1000).allow(''),
}).or('decision', 'actionTaken', 'action', 'resolution');

export const updateStatusParam = Joi.object({
  reportId: objectId.required(),
});

export const updateStatusBody = Joi.object({
  status: Joi.string()
    .valid('pending', 'reviewing', 'resolved', 'dismissed', 'rejected', 'escalated')
    .required(),
  notes: Joi.string().trim().max(1000).allow(''),
});

export default {
  createReportBody,
  reportPostParam,
  reportPostBody,
  reportCommentParam,
  reportCommentBody,
  reportUserParam,
  reportUserBody,
  reportMessageParam,
  reportMessageBody,
  myReportsQuery,
  reportIdParam,
  getAllReportsQuery,
  pendingReportsQuery,
  reportsAgainstUserParam,
  reportsAgainstUserQuery,
  startReviewParam,
  resolveReportParam,
  resolveReportBody,
  updateStatusParam,
  updateStatusBody,
};
