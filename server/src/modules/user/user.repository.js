import UserModel from '../../models/User.js';
import UserSettingsModel from '../../models/UserSettings.js';
import FollowModel from '../../models/Follow.js';
import UserInteractionModel from '../../models/UserInteraction.js';
import PostModel from '../../models/Post.js';
import CommentModel from '../../models/Comment.js';
import LikeModel from '../../models/Like.js';
import SavePostModel from '../../models/SavePost.js';
import MessageModel from '../../models/Message.js';
import NotificationModel from '../../models/Notification.js';

const userRepository = {
  commentUpdateMany: (...args) => CommentModel.updateMany(...args),
  followAcceptFollowRequest: (...args) => FollowModel.acceptFollowRequest(...args),
  followDeleteMany: (...args) => FollowModel.deleteMany(...args),
  followFind: (...args) => FollowModel.find(...args),
  followFollow: (...args) => FollowModel.follow(...args),
  followGetFollowers: (...args) => FollowModel.getFollowers(...args),
  followGetFollowing: (...args) => FollowModel.getFollowing(...args),
  followGetFollowStatus: (...args) => FollowModel.getFollowStatus(...args),
  followGetMutualFollowers: (...args) => FollowModel.getMutualFollowers(...args),
  followGetPendingRequests: (...args) => FollowModel.getPendingRequests(...args),
  followRejectFollowRequest: (...args) => FollowModel.rejectFollowRequest(...args),
  followUnfollow: (...args) => FollowModel.unfollow(...args),
  likeDeleteMany: (...args) => LikeModel.deleteMany(...args),
  messageDeleteMany: (...args) => MessageModel.deleteMany(...args),
  notificationCreateNotification: (...args) => NotificationModel.createNotification(...args),
  notificationDeleteMany: (...args) => NotificationModel.deleteMany(...args),
  postFind: (...args) => PostModel.find(...args),
  postUpdateMany: (...args) => PostModel.updateMany(...args),
  savePostDeleteMany: (...args) => SavePostModel.deleteMany(...args),
  userCountDocuments: (...args) => UserModel.countDocuments(...args),
  userFind: (...args) => UserModel.find(...args),
  userFindById: (...args) => UserModel.findById(...args),
  userFindByIdAndDelete: (...args) => UserModel.findByIdAndDelete(...args),
  userFindByIdAndUpdate: (...args) => UserModel.findByIdAndUpdate(...args),
  userFindOne: (...args) => UserModel.findOne(...args),
  userGetRecommendedUsers: (...args) => UserModel.getRecommendedUsers(...args),
  userInteractionDeleteMany: (...args) => UserInteractionModel.deleteMany(...args),
  userInteractionRecord: (...args) => UserInteractionModel.record(...args),
  userSettingsDeleteOne: (...args) => UserSettingsModel.deleteOne(...args),
  userSettingsFindOne: (...args) => UserSettingsModel.findOne(...args),
  userSettingsFindOneAndUpdate: (...args) => UserSettingsModel.findOneAndUpdate(...args),
  userSettingsGetOrCreate: (...args) => UserSettingsModel.getOrCreate(...args),
  userUpdateMany: (...args) => UserModel.updateMany(...args),
};

export default userRepository;
