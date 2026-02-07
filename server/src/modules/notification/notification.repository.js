import Notification from '../../models/Notification.js';

const findNotifications = (query, options = {}) => {
  return Notification.find(query)
    .populate(options.populate || [])
    .sort(options.sort || { createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 0);
};

const countNotifications = query => Notification.countDocuments(query);

const createNotification = payload => Notification.createNotification(payload);

const updateNotification = (id, update, options = {}) => {
  return Notification.findByIdAndUpdate(id, update, { new: true, ...options });
};

const deleteNotification = id => Notification.findByIdAndDelete(id);

export default {
  findNotifications,
  countNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
};
