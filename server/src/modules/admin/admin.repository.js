import UserModel from '../../models/User.js';
import PostModel from '../../models/Post.js';
import CommentModel from '../../models/Comment.js';
import ReportModel from '../../models/Report.js';
import RefreshTokenModel from '../../models/RefreshToken.js';
import UserSettingsModel from '../../models/UserSettings.js';
import NotificationModel from '../../models/Notification.js';
import LikeModel from '../../models/Like.js';
import FollowModel from '../../models/Follow.js';
import SavePostModel from '../../models/SavePost.js';
import UserInteractionModel from '../../models/UserInteraction.js';

const adminRepository = {
  commentCountDocuments: (...args) => CommentModel.countDocuments(...args),
  commentFind: (...args) => CommentModel.find(...args),
  commentFindById: (...args) => CommentModel.findById(...args),
  followCountDocuments: (...args) => FollowModel.countDocuments(...args),
  followFind: (...args) => FollowModel.find(...args),
  likeCountDocuments: (...args) => LikeModel.countDocuments(...args),
  likeFind: (...args) => LikeModel.find(...args),
  notificationInsertMany: (...args) => NotificationModel.insertMany(...args),
  postAggregate: (...args) => PostModel.aggregate(...args),
  postCountDocuments: (...args) => PostModel.countDocuments(...args),
  postFind: (...args) => PostModel.find(...args),
  postFindById: (...args) => PostModel.findById(...args),
  postFindByIdAndUpdate: (...args) => PostModel.findByIdAndUpdate(...args),
  refreshTokenUpdateMany: (...args) => RefreshTokenModel.updateMany(...args),
  reportCountDocuments: (...args) => ReportModel.countDocuments(...args),
  reportFind: (...args) => ReportModel.find(...args),
  savePostCountDocuments: (...args) => SavePostModel.countDocuments(...args),
  savePostFind: (...args) => SavePostModel.find(...args),
  userAggregate: (...args) => UserModel.aggregate(...args),
  userCountDocuments: (...args) => UserModel.countDocuments(...args),
  userFind: (...args) => UserModel.find(...args),
  userFindById: (...args) => UserModel.findById(...args),
  userFindByIdAndUpdate: (...args) => UserModel.findByIdAndUpdate(...args),
  userInteractionCountDocuments: (...args) => UserInteractionModel.countDocuments(...args),
  userInteractionFind: (...args) => UserInteractionModel.find(...args),
  userSettingsFind: (...args) => UserSettingsModel.find(...args),
  userSettingsFindOne: (...args) => UserSettingsModel.findOne(...args),
};

export default adminRepository;
