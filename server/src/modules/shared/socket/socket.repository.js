import UserModel from '../../../models/User.js';
import UserSettingsModel from '../../../models/UserSettings.js';
import MessageModel from '../../../models/Message.js';

const socketRepository = {
  messageFindByIdAndUpdate: (...args) => MessageModel.findByIdAndUpdate(...args),
  userFind: (...args) => UserModel.find(...args),
  userFindById: (...args) => UserModel.findById(...args),
  userFindByIdAndUpdate: (...args) => UserModel.findByIdAndUpdate(...args),
  userSettingsFind: (...args) => UserSettingsModel.find(...args),
  userSettingsFindOne: (...args) => UserSettingsModel.findOne(...args),
};

export default socketRepository;
