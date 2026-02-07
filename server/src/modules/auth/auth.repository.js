import User from '../../models/User.js';
import UserSettings from '../../models/UserSettings.js';
import RefreshToken from '../../models/RefreshToken.js';

const createUser = data => User.create(data);

const findUserByEmail = email => User.findOne({ email: email.toLowerCase() });

const findUserById = id => User.findById(id);

const findUserByIdWithPassword = id => User.findById(id).select('+password');

const updateUserById = (id, update, options = {}) => {
  return User.findByIdAndUpdate(id, update, {
    new: true,
    ...options,
  });
};

const findUserSettings = userId => UserSettings.findOne({ user: userId });

const findUserSettingsWithSecurity = userId => {
  return UserSettings.findOne({ user: userId }).select(
    '+security.twoFactorSecret +security.twoFactorEnabled'
  );
};

const createUserSettings = userId => UserSettings.create({ user: userId });

const updateUserSettings = (userId, update) => {
  return UserSettings.findOneAndUpdate({ user: userId }, update, { new: true });
};

const findRefreshToken = token => RefreshToken.findOne({ token });

const findActiveRefreshToken = token => {
  return RefreshToken.findOne({ token, isRevoked: false });
};

const revokeRefreshToken = token => RefreshToken.revokeToken(token);

const revokeRefreshTokenFamily = family => RefreshToken.revokeFamily(family);

const rotateRefreshToken = (token, newToken) => {
  return RefreshToken.verifyAndRotate(token, newToken);
};

const createRefreshToken = data => RefreshToken.createToken(data);

const getActiveSessions = userId => RefreshToken.getActiveSessions(userId);

const revokeAllSessionsForUser = (userId, exceptToken) => {
  return RefreshToken.revokeAllForUser(userId, exceptToken);
};

const updateRefreshTokenLastUsed = token => RefreshToken.updateLastUsed(token);

const deleteSessionsForUser = userId => RefreshToken.deleteMany({ user: userId });

export default {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByIdWithPassword,
  updateUserById,
  findUserSettings,
  findUserSettingsWithSecurity,
  createUserSettings,
  updateUserSettings,
  findRefreshToken,
  findActiveRefreshToken,
  revokeRefreshToken,
  revokeRefreshTokenFamily,
  rotateRefreshToken,
  createRefreshToken,
  getActiveSessions,
  revokeAllSessionsForUser,
  updateRefreshTokenLastUsed,
  deleteSessionsForUser,
};
