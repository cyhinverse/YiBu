import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { registerBody } from '../../../src/validations/auth.validation.js';
import { followBody } from '../../../src/validations/user.validation.js';
import { postIdParam as postValidationIdParam } from '../../../src/validations/post.validation.js';
import { createConversationBody } from '../../../src/validations/message.validation.js';
import { createNotificationBody } from '../../../src/validations/notification.validation.js';
import { createReportBody } from '../../../src/validations/report.validation.js';
import { banUserBody } from '../../../src/validations/admin.validation.js';
import { createCommentBody } from '../../../src/validations/comment.validation.js';
import { createLikeBody } from '../../../src/validations/like.validation.js';
import { postIdParam as savePostIdParam } from '../../../src/validations/savepost.validation.js';
import { privacySettingsBody } from '../../../src/validations/userSettings.validation.js';
import { objectId } from '../../../src/validations/common.validation.js';

const OBJECT_ID = '507f191e810c19729de860ea';

const expectValid = (schema, payload) => {
  const { error } = schema.validate(payload, { abortEarly: false });
  assert.equal(error, undefined);
};

const expectInvalid = (schema, payload) => {
  const { error } = schema.validate(payload, { abortEarly: false });
  assert.ok(error);
};

describe('validation schemas', () => {
  it('auth.registerBody should validate required fields', () => {
    expectValid(registerBody, {
      name: 'Cyhin',
      username: 'cyhin_dev',
      email: 'cyhin@example.com',
      password: 'StrongPass1',
    });
    expectInvalid(registerBody, {});
  });

  it('user.followBody should require targetUserId', () => {
    expectValid(followBody, { targetUserId: OBJECT_ID });
    expectInvalid(followBody, { targetUserId: 'bad-id' });
  });

  it('post.postIdParam should enforce ObjectId format', () => {
    expectValid(postValidationIdParam, { id: OBJECT_ID });
    expectInvalid(postValidationIdParam, { id: 'post-1' });
  });

  it('message.createConversationBody should require valid participantId', () => {
    expectValid(createConversationBody, { participantId: OBJECT_ID });
    expectInvalid(createConversationBody, {});
  });

  it('notification.createNotificationBody should require recipient and content', () => {
    expectValid(createNotificationBody, {
      recipient: OBJECT_ID,
      type: 'system',
      content: 'Hello',
    });
    expectInvalid(createNotificationBody, { type: 'system', content: 'Hello' });
  });

  it('report.createReportBody should require target info and reason', () => {
    expectValid(createReportBody, {
      targetType: 'post',
      targetId: OBJECT_ID,
      reason: 'Spam content',
    });
    expectInvalid(createReportBody, { targetType: 'post' });
  });

  it('admin.banUserBody should require userId and reason', () => {
    expectValid(banUserBody, { userId: OBJECT_ID, reason: 'Violation' });
    expectInvalid(banUserBody, { userId: OBJECT_ID });
  });

  it('comment.createCommentBody should require content and postId', () => {
    expectValid(createCommentBody, { content: 'Nice post', postId: OBJECT_ID });
    expectInvalid(createCommentBody, {});
  });

  it('like.createLikeBody should require postId', () => {
    expectValid(createLikeBody, { postId: OBJECT_ID });
    expectInvalid(createLikeBody, {});
  });

  it('savepost.postIdParam should enforce ObjectId format', () => {
    expectValid(savePostIdParam, { postId: OBJECT_ID });
    expectInvalid(savePostIdParam, { postId: '123' });
  });

  it('userSettings.privacySettingsBody should require at least one setting', () => {
    expectValid(privacySettingsBody, { profileVisibility: 'public' });
    expectInvalid(privacySettingsBody, {});
  });

  it('common.objectId should enforce ObjectId pattern', () => {
    assert.equal(objectId.validate(OBJECT_ID).error, undefined);
    assert.ok(objectId.validate('not-object-id').error);
  });
});
