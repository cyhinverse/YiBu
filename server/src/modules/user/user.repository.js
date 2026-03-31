import User from '../../models/User.js';
import Follow from '../../models/Follow.js';
import UserSettings from '../../models/UserSettings.js';
import UserInteraction from '../../models/UserInteraction.js';
import Like from '../../models/Like.js';
import Post from '../../models/Post.js';
import Comment from '../../models/Comment.js';
import Hashtag from '../../models/Hashtag.js';
import NotificationService from '../notification/notification.service.js';

const findUserById = id => User.findById(id);

const findUserByIdLean = id => User.findById(id).lean();

const findUserByIdSelect = (id, select) => User.findById(id).select(select);

const findUserByUsername = username => User.findOne({ username });

const updateUserById = (id, update, options = {}) => {
  return User.findByIdAndUpdate(id, update, { new: true, ...options });
};

const searchUsers = (query, limit, skip) => {
  return User.find(query).select('-password -loginAttempts').skip(skip).limit(limit);
};

const countUsers = query => User.countDocuments(query);

const findUserSettings = userId => UserSettings.findOne({ user: userId });

const updateUserSettings = (userId, update) => {
  return UserSettings.findOneAndUpdate({ user: userId }, update, { new: true });
};

const createNotification = payload => {
  return NotificationService.publishCreate(payload, {
    source: 'user.repository',
  });
};

const createFollow = payload => Follow.create(payload);

const deleteFollow = (userId, targetUserId) => {
  return Follow.findOneAndDelete({ user: userId, targetUser: targetUserId });
};

const findFollow = (userId, targetUserId) => {
  return Follow.findOne({ user: userId, targetUser: targetUserId });
};

const getFollowers = userId => Follow.find({ targetUser: userId });

const getFollowing = userId => Follow.find({ user: userId });

const findUserInteraction = (userId, targetUserId) => {
  return UserInteraction.findOne({ user: userId, targetUser: targetUserId });
};

const updateUserInteraction = (userId, targetUserId, update) => {
  return UserInteraction.findOneAndUpdate(
    { user: userId, targetUser: targetUserId },
    update,
    { upsert: true, new: true }
  );
};

const createLike = payload => Like.create(payload);

const deleteLike = (userId, postId) => Like.findOneAndDelete({ user: userId, post: postId });

const findLike = (userId, postId) => Like.findOne({ user: userId, post: postId });

const updatePostCounts = (postId, update) => Post.findByIdAndUpdate(postId, update, { new: true });

const findPostById = postId => Post.findById(postId);

const countPosts = query => Post.countDocuments(query);

const countComments = query => Comment.countDocuments(query);

const createHashtag = payload => Hashtag.create(payload);

const findHashtag = query => Hashtag.findOne(query);

const updateHashtag = (query, update) => Hashtag.findOneAndUpdate(query, update, { new: true });

export default {
  findUserById,
  findUserByIdLean,
  findUserByIdSelect,
  findUserByUsername,
  updateUserById,
  searchUsers,
  countUsers,
  findUserSettings,
  updateUserSettings,
  createNotification,
  createFollow,
  deleteFollow,
  findFollow,
  getFollowers,
  getFollowing,
  findUserInteraction,
  updateUserInteraction,
  createLike,
  deleteLike,
  findLike,
  updatePostCounts,
  findPostById,
  countPosts,
  countComments,
  createHashtag,
  findHashtag,
  updateHashtag,
};
