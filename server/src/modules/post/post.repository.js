import Post from '../../models/Post.js';
import Comment from '../../models/Comment.js';
import Like from '../../models/Like.js';
import SavePost from '../../models/SavePost.js';
import Hashtag from '../../models/Hashtag.js';

const findPostById = id => Post.findById(id);

const findPostByIdLean = id => Post.findById(id).lean();

const createPost = payload => Post.create(payload);

const updatePost = (id, update, options = {}) => {
  return Post.findByIdAndUpdate(id, update, { new: true, ...options });
};

const deletePost = id => Post.findByIdAndDelete(id);

const findPosts = (query, options = {}) => {
  return Post.find(query)
    .populate(options.populate || [])
    .sort(options.sort || { createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 0);
};

const countPosts = query => Post.countDocuments(query);

const createComment = payload => Comment.create(payload);

const updateComment = (id, update, options = {}) => {
  return Comment.findByIdAndUpdate(id, update, { new: true, ...options });
};

const deleteComment = id => Comment.findByIdAndDelete(id);

const findCommentById = id => Comment.findById(id);

const findComments = (query, options = {}) => {
  return Comment.find(query)
    .populate(options.populate || [])
    .sort(options.sort || { createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 0);
};

const countComments = query => Comment.countDocuments(query);

const findLike = (userId, postId) => Like.findOne({ user: userId, post: postId });

const createLike = payload => Like.create(payload);

const deleteLike = (userId, postId) => Like.findOneAndDelete({ user: userId, post: postId });

const findSave = (userId, postId) => SavePost.findOne({ user: userId, post: postId });

const createSave = payload => SavePost.create(payload);

const deleteSave = (userId, postId) => SavePost.findOneAndDelete({ user: userId, post: postId });

const findHashtag = query => Hashtag.findOne(query);

const createHashtag = payload => Hashtag.create(payload);

const updateHashtag = (query, update) => Hashtag.findOneAndUpdate(query, update, { new: true });

export default {
  findPostById,
  findPostByIdLean,
  createPost,
  updatePost,
  deletePost,
  findPosts,
  countPosts,
  createComment,
  updateComment,
  deleteComment,
  findCommentById,
  findComments,
  countComments,
  findLike,
  createLike,
  deleteLike,
  findSave,
  createSave,
  deleteSave,
  findHashtag,
  createHashtag,
  updateHashtag,
};
