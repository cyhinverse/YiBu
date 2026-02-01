import Conversation from '../../models/Conversation.js';
import Message from '../../models/Message.js';

const findConversationById = id => Conversation.findById(id);

const findConversationByIdLean = id => Conversation.findById(id).lean();

const findConversation = query => Conversation.findOne(query);

const createConversation = payload => Conversation.create(payload);

const updateConversation = (id, update, options = {}) => {
  return Conversation.findByIdAndUpdate(id, update, { new: true, ...options });
};

const deleteConversation = id => Conversation.findByIdAndDelete(id);

const findConversations = (query, options = {}) => {
  return Conversation.find(query)
    .populate(options.populate || [])
    .sort(options.sort || { updatedAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 0);
};

const createMessage = payload => Message.create(payload);

const findMessageById = id => Message.findById(id);

const findMessages = (query, options = {}) => {
  return Message.find(query)
    .populate(options.populate || [])
    .sort(options.sort || { createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 0);
};

const updateMessage = (id, update, options = {}) => {
  return Message.findByIdAndUpdate(id, update, { new: true, ...options });
};

const deleteMessage = id => Message.findByIdAndDelete(id);

export default {
  findConversationById,
  findConversationByIdLean,
  findConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  findConversations,
  createMessage,
  findMessageById,
  findMessages,
  updateMessage,
  deleteMessage,
};
