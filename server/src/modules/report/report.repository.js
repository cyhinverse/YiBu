import ReportModel from '../../models/Report.js';
import UserModel from '../../models/User.js';
import PostModel from '../../models/Post.js';
import CommentModel from '../../models/Comment.js';
import MessageModel from '../../models/Message.js';
import RefreshTokenModel from '../../models/RefreshToken.js';

const reportRepository = {
  commentFindById: (...args) => CommentModel.findById(...args),
  commentFindByIdAndUpdate: (...args) => CommentModel.findByIdAndUpdate(...args),
  messageFindById: (...args) => MessageModel.findById(...args),
  postFindById: (...args) => PostModel.findById(...args),
  postFindByIdAndUpdate: (...args) => PostModel.findByIdAndUpdate(...args),
  refreshTokenUpdateMany: (...args) => RefreshTokenModel.updateMany(...args),
  reportCountDocuments: (...args) => ReportModel.countDocuments(...args),
  reportCreate: (...args) => ReportModel.create(...args),
  reportFind: (...args) => ReportModel.find(...args),
  reportFindById: (...args) => ReportModel.findById(...args),
  reportFindByIdAndUpdate: (...args) => ReportModel.findByIdAndUpdate(...args),
  reportFindOne: (...args) => ReportModel.findOne(...args),
  userFindById: (...args) => UserModel.findById(...args),
  userFindByIdAndUpdate: (...args) => UserModel.findByIdAndUpdate(...args),
};

export default reportRepository;
