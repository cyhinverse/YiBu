import User from '../../models/User.js';
import Post from '../../models/Post.js';
import Comment from '../../models/Comment.js';
import Report from '../../models/Report.js';
import RefreshToken from '../../models/RefreshToken.js';
import AdminLog from '../../models/AdminLog.js';
import Notification from '../../models/Notification.js';
import Like from '../../models/Like.js';
import Follow from '../../models/Follow.js';
import SavePost from '../../models/SavePost.js';
import Message from '../../models/Message.js';

const findUserById = id => User.findById(id);

const findUserByIdSelect = (id, select) => User.findById(id).select(select);

const updateUserById = (id, update, options = {}) => {
  return User.findByIdAndUpdate(id, update, { new: true, ...options });
};

const deleteUserById = id => User.findByIdAndDelete(id);

const createAdminLog = payload => AdminLog.create(payload);

const createNotification = payload => Notification.createNotification(payload);

const updateManyRefreshTokens = (query, update) => RefreshToken.updateMany(query, update);

const findPostById = id => Post.findById(id);

const updatePostById = (id, update, options = {}) => {
  return Post.findByIdAndUpdate(id, update, { new: true, ...options });
};

const findCommentById = id => Comment.findById(id);

const updateCommentById = (id, update, options = {}) => {
  return Comment.findByIdAndUpdate(id, update, { new: true, ...options });
};

const findReportById = id => Report.findById(id);

const updateReportById = (id, update, options = {}) => {
  return Report.findByIdAndUpdate(id, update, { new: true, ...options });
};

const deleteManyLikes = query => Like.deleteMany(query);

const deleteManyFollows = query => Follow.deleteMany(query);

const deleteManySavePosts = query => SavePost.deleteMany(query);

const deleteManyPosts = query => Post.deleteMany(query);

const deleteManyComments = query => Comment.deleteMany(query);

const deleteManyReports = query => Report.deleteMany(query);

const deleteManyMessages = query => Message.deleteMany(query);

export default {
  findUserById,
  findUserByIdSelect,
  updateUserById,
  deleteUserById,
  createAdminLog,
  createNotification,
  updateManyRefreshTokens,
  findPostById,
  updatePostById,
  findCommentById,
  updateCommentById,
  findReportById,
  updateReportById,
  deleteManyLikes,
  deleteManyFollows,
  deleteManySavePosts,
  deleteManyPosts,
  deleteManyComments,
  deleteManyReports,
  deleteManyMessages,
};
