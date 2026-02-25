import MessageModel from '../../models/Message.js';
import UserModel from '../../models/User.js';
import UserSettingsModel from '../../models/UserSettings.js';
import FollowModel from '../../models/Follow.js';
import ConversationModel from '../../models/Conversation.js';

const messageRepository = {
  conversationAggregate: (...args) => ConversationModel.aggregate(...args),
  conversationCreate: (...args) => ConversationModel.create(...args),
  conversationFind: (...args) => ConversationModel.find(...args),
  conversationFindById: (...args) => ConversationModel.findById(...args),
  conversationFindOne: (...args) => ConversationModel.findOne(...args),
  followIsFollowing: (...args) => FollowModel.isFollowing(...args),
  messageAggregate: (...args) => MessageModel.aggregate(...args),
  messageCountDocuments: (...args) => MessageModel.countDocuments(...args),
  messageCreate: (...args) => MessageModel.create(...args),
  messageFind: (...args) => MessageModel.find(...args),
  messageFindById: (...args) => MessageModel.findById(...args),
  messageFindByIdAndUpdate: (...args) => MessageModel.findByIdAndUpdate(...args),
  messageFindOne: (...args) => MessageModel.findOne(...args),
  messageFindOneAndUpdate: (...args) => MessageModel.findOneAndUpdate(...args),
  messageUpdateMany: (...args) => MessageModel.updateMany(...args),
  userFindById: (...args) => UserModel.findById(...args),
  userSettingsFindOne: (...args) => UserSettingsModel.findOne(...args),
};

export default messageRepository;
