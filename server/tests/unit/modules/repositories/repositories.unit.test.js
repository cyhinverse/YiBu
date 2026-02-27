import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import authRepository from '../../../../src/modules/auth/auth.repository.js';
import userRepository from '../../../../src/modules/user/user.repository.js';
import postRepository from '../../../../src/modules/post/post.repository.js';
import messageRepository from '../../../../src/modules/message/message.repository.js';
import notificationRepository from '../../../../src/modules/notification/notification.repository.js';
import reportRepository from '../../../../src/modules/report/report.repository.js';
import adminRepository from '../../../../src/modules/admin/admin.repository.js';
import socketRepository from '../../../../src/modules/shared/socket/socket.repository.js';

import UserModel from '../../../../src/models/User.js';
import PostModel from '../../../../src/models/Post.js';
import ConversationModel from '../../../../src/models/Conversation.js';
import NotificationModel from '../../../../src/models/Notification.js';
import ReportModel from '../../../../src/models/Report.js';
import FollowModel from '../../../../src/models/Follow.js';
import HashtagModel from '../../../../src/models/Hashtag.js';
import UserSettingsModel from '../../../../src/models/UserSettings.js';
import RefreshTokenModel from '../../../../src/models/RefreshToken.js';
import MessageModel from '../../../../src/models/Message.js';

const runProxyTest = ({ repository, repositoryMethod, model, modelMethod, args }) => {
  const original = model[modelMethod];
  const marker = { ok: true };
  let receivedArgs;

  model[modelMethod] = (...input) => {
    receivedArgs = input;
    return marker;
  };

  try {
    const result = repository[repositoryMethod](...args);
    assert.equal(result, marker);
    assert.deepEqual(receivedArgs, args);
  } finally {
    model[modelMethod] = original;
  }
};

describe('module repositories', () => {
  it('authRepository.userFindById should proxy to UserModel.findById', () => {
    runProxyTest({
      repository: authRepository,
      repositoryMethod: 'userFindById',
      model: UserModel,
      modelMethod: 'findById',
      args: ['507f191e810c19729de860ea'],
    });
  });

  it('userRepository.userFindById should proxy to UserModel.findById', () => {
    runProxyTest({
      repository: userRepository,
      repositoryMethod: 'userFindById',
      model: UserModel,
      modelMethod: 'findById',
      args: ['507f191e810c19729de860ea'],
    });
  });

  it('userRepository.followFollow should proxy to FollowModel.follow', () => {
    runProxyTest({
      repository: userRepository,
      repositoryMethod: 'followFollow',
      model: FollowModel,
      modelMethod: 'follow',
      args: ['507f191e810c19729de860ea', '507f191e810c19729de860eb'],
    });
  });

  it('postRepository.postFindById should proxy to PostModel.findById', () => {
    runProxyTest({
      repository: postRepository,
      repositoryMethod: 'postFindById',
      model: PostModel,
      modelMethod: 'findById',
      args: ['507f191e810c19729de860ec'],
    });
  });

  it('postRepository.hashtagGetTrending should proxy to HashtagModel.getTrending', () => {
    runProxyTest({
      repository: postRepository,
      repositoryMethod: 'hashtagGetTrending',
      model: HashtagModel,
      modelMethod: 'getTrending',
      args: [{ limit: 10 }],
    });
  });

  it('messageRepository.conversationFindById should proxy to ConversationModel.findById', () => {
    runProxyTest({
      repository: messageRepository,
      repositoryMethod: 'conversationFindById',
      model: ConversationModel,
      modelMethod: 'findById',
      args: ['507f191e810c19729de860ed'],
    });
  });

  it('messageRepository.followIsFollowing should proxy to FollowModel.isFollowing', () => {
    runProxyTest({
      repository: messageRepository,
      repositoryMethod: 'followIsFollowing',
      model: FollowModel,
      modelMethod: 'isFollowing',
      args: ['507f191e810c19729de860ea', '507f191e810c19729de860eb'],
    });
  });

  it('notificationRepository.notificationFindById should proxy to NotificationModel.findById', () => {
    runProxyTest({
      repository: notificationRepository,
      repositoryMethod: 'notificationFindById',
      model: NotificationModel,
      modelMethod: 'findById',
      args: ['507f191e810c19729de860ee'],
    });
  });

  it('notificationRepository.userSettingsFindOneAndUpdate should proxy to UserSettingsModel.findOneAndUpdate', () => {
    runProxyTest({
      repository: notificationRepository,
      repositoryMethod: 'userSettingsFindOneAndUpdate',
      model: UserSettingsModel,
      modelMethod: 'findOneAndUpdate',
      args: [{ user: '507f191e810c19729de860ea' }, { $set: { likes: false } }],
    });
  });

  it('reportRepository.reportFindById should proxy to ReportModel.findById', () => {
    runProxyTest({
      repository: reportRepository,
      repositoryMethod: 'reportFindById',
      model: ReportModel,
      modelMethod: 'findById',
      args: ['507f191e810c19729de860ef'],
    });
  });

  it('reportRepository.refreshTokenUpdateMany should proxy to RefreshTokenModel.updateMany', () => {
    runProxyTest({
      repository: reportRepository,
      repositoryMethod: 'refreshTokenUpdateMany',
      model: RefreshTokenModel,
      modelMethod: 'updateMany',
      args: [{ user: '507f191e810c19729de860ea' }, { revoked: true }],
    });
  });

  it('adminRepository.userFindById should proxy to UserModel.findById', () => {
    runProxyTest({
      repository: adminRepository,
      repositoryMethod: 'userFindById',
      model: UserModel,
      modelMethod: 'findById',
      args: ['507f191e810c19729de860ea'],
    });
  });

  it('adminRepository.notificationInsertMany should proxy to NotificationModel.insertMany', () => {
    runProxyTest({
      repository: adminRepository,
      repositoryMethod: 'notificationInsertMany',
      model: NotificationModel,
      modelMethod: 'insertMany',
      args: [[{ recipient: '507f191e810c19729de860ea', content: 'hello' }]],
    });
  });

  it('socketRepository.userFindById should proxy to UserModel.findById', () => {
    runProxyTest({
      repository: socketRepository,
      repositoryMethod: 'userFindById',
      model: UserModel,
      modelMethod: 'findById',
      args: ['507f191e810c19729de860ea'],
    });
  });

  it('socketRepository.messageFindByIdAndUpdate should proxy to MessageModel.findByIdAndUpdate', () => {
    runProxyTest({
      repository: socketRepository,
      repositoryMethod: 'messageFindByIdAndUpdate',
      model: MessageModel,
      modelMethod: 'findByIdAndUpdate',
      args: ['507f191e810c19729de860ec', { $set: { isRead: true } }],
    });
  });
});

