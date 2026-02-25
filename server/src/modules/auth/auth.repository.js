import UserModel from '../../models/User.js';
import RefreshTokenModel from '../../models/RefreshToken.js';
import UserSettingsModel from '../../models/UserSettings.js';

const authRepository = {
  refreshTokenCreate: (...args) => RefreshTokenModel.create(...args),
  refreshTokenFind: (...args) => RefreshTokenModel.find(...args),
  refreshTokenFindOne: (...args) => RefreshTokenModel.findOne(...args),
  refreshTokenFindOneAndUpdate: (...args) => RefreshTokenModel.findOneAndUpdate(...args),
  refreshTokenUpdateMany: (...args) => RefreshTokenModel.updateMany(...args),
  userCreate: (...args) => UserModel.create(...args),
  userFindById: (...args) => UserModel.findById(...args),
  userFindByIdAndUpdate: (...args) => UserModel.findByIdAndUpdate(...args),
  userFindOne: (...args) => UserModel.findOne(...args),
  userSettingsCreate: (...args) => UserSettingsModel.create(...args),
  userSettingsFindOne: (...args) => UserSettingsModel.findOne(...args),
  userSettingsFindOneAndUpdate: (...args) => UserSettingsModel.findOneAndUpdate(...args),
};

export default authRepository;
