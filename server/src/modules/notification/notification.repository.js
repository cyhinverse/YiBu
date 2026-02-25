import NotificationModel from '../../models/Notification.js';
import UserSettingsModel from '../../models/UserSettings.js';
import UserModel from '../../models/User.js';

const notificationRepository = {
  notificationAggregate: (...args) => NotificationModel.aggregate(...args),
  notificationCountDocuments: (...args) => NotificationModel.countDocuments(...args),
  notificationCreate: (...args) => NotificationModel.create(...args),
  notificationDeleteMany: (...args) => NotificationModel.deleteMany(...args),
  notificationFind: (...args) => NotificationModel.find(...args),
  notificationFindById: (...args) => NotificationModel.findById(...args),
  notificationFindByIdAndUpdate: (...args) => NotificationModel.findByIdAndUpdate(...args),
  notificationFindOne: (...args) => NotificationModel.findOne(...args),
  notificationFindOneAndDelete: (...args) => NotificationModel.findOneAndDelete(...args),
  notificationFindOneAndUpdate: (...args) => NotificationModel.findOneAndUpdate(...args),
  notificationUpdateMany: (...args) => NotificationModel.updateMany(...args),
  userFindById: (...args) => UserModel.findById(...args),
  userSettingsFindOne: (...args) => UserSettingsModel.findOne(...args),
  userSettingsFindOneAndUpdate: (...args) => UserSettingsModel.findOneAndUpdate(...args),
};

export default notificationRepository;
