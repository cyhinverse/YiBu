import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  resetPasswordBody,
} from '../../../src/validations/auth.validation.js';
import { searchUsersQuery } from '../../../src/validations/user.validation.js';
import { searchPostsQuery } from '../../../src/validations/post.validation.js';
import {
  createGroupBody,
  updateGroupBody,
  searchMessagesQuery,
} from '../../../src/validations/message.validation.js';
import { updatePreferencesBody } from '../../../src/validations/notification.validation.js';
import { resolveReportBody } from '../../../src/validations/report.validation.js';
import { suspendUserBody } from '../../../src/validations/admin.validation.js';
import {
  privacySettingsBody,
  contentSettingsBody,
  themeSettingsBody,
} from '../../../src/validations/userSettings.validation.js';
import { getSavedPostsQuery } from '../../../src/validations/savepost.validation.js';

const OBJECT_ID = '507f191e810c19729de860ea';
const OTHER_ID = '507f191e810c19729de860eb';

describe('validation aliases and edge cases', () => {
  it('auth.resetPasswordBody should validate canonical and legacy password fields', () => {
    const { error, value } = resetPasswordBody.validate({
      token: 'reset-token',
      newPassword: 'StrongPass1',
      confirmPassword: 'StrongPass1',
    });

    assert.equal(error, undefined);
    assert.equal(value.newPassword, 'StrongPass1');
    assert.equal(value.confirmPassword, 'StrongPass1');

    const legacy = resetPasswordBody.validate({
      token: 'reset-token',
      password: 'StrongPass1',
      confirmNewPassword: 'StrongPass1',
    });

    assert.equal(legacy.error, undefined);
    assert.equal(legacy.value.newPassword, 'StrongPass1');
    assert.equal(legacy.value.confirmPassword, 'StrongPass1');
  });

  it('user.searchUsersQuery should map query -> q', () => {
    const { error, value } = searchUsersQuery.validate({ query: 'john' });

    assert.equal(error, undefined);
    assert.equal(value.q, 'john');
    assert.equal(value.query, undefined);
  });

  it('post.searchPostsQuery should map query -> q', () => {
    const { error, value } = searchPostsQuery.validate({ query: 'cat photo' });

    assert.equal(error, undefined);
    assert.equal(value.q, 'cat photo');
    assert.equal(value.query, undefined);
  });

  it('message.searchMessagesQuery should map query -> q', () => {
    const { error, value } = searchMessagesQuery.validate({ query: 'hello' });

    assert.equal(error, undefined);
    assert.equal(value.q, 'hello');
    assert.equal(value.query, undefined);
  });

  it('message.createGroupBody should map name/avatar aliases', () => {
    const { error, value } = createGroupBody.validate({
      name: 'Team chat',
      avatar: 'https://example.com/avatar.png',
      participantIds: [OBJECT_ID, OTHER_ID],
    });

    assert.equal(error, undefined);
    assert.equal(value.groupName, 'Team chat');
    assert.equal(value.groupAvatar, 'https://example.com/avatar.png');
    assert.equal(value.name, undefined);
    assert.equal(value.avatar, undefined);
  });

  it('message.updateGroupBody should map name/avatar aliases', () => {
    const { error, value } = updateGroupBody.validate({
      name: 'Updated group',
      avatar: 'https://example.com/avatar-2.png',
    });

    assert.equal(error, undefined);
    assert.equal(value.groupName, 'Updated group');
    assert.equal(value.groupAvatar, 'https://example.com/avatar-2.png');
  });

  it('notification.updatePreferencesBody should normalize legacy keys', () => {
    const { error, value } = updatePreferencesBody.validate({
      newFollower: true,
      directMessages: false,
    });

    assert.equal(error, undefined);
    assert.equal(value.follows, true);
    assert.equal(value.messages, false);
    assert.equal(value.newFollower, undefined);
    assert.equal(value.directMessages, undefined);
  });

  it('report.resolveReportBody should require at least one resolution field', () => {
    const invalid = resolveReportBody.validate({});
    const valid = resolveReportBody.validate({ decision: 'resolved' });

    assert.ok(invalid.error);
    assert.equal(valid.error, undefined);
  });

  it('admin.suspendUserBody should require duration or days', () => {
    const invalid = suspendUserBody.validate({
      userId: OBJECT_ID,
      reason: 'spam',
    });
    const valid = suspendUserBody.validate({
      userId: OBJECT_ID,
      reason: 'spam',
      days: 7,
    });

    assert.ok(invalid.error);
    assert.equal(valid.error, undefined);
  });

  it('userSettings.privacySettingsBody should map messagePermission -> allowMessages', () => {
    const { error, value } = privacySettingsBody.validate({
      messagePermission: 'followers',
    });

    assert.equal(error, undefined);
    assert.equal(value.allowMessages, 'followers');
    assert.equal(value.messagePermission, undefined);
  });

  it('userSettings.contentSettingsBody should map autoplay alias', () => {
    const { error, value } = contentSettingsBody.validate({
      autoplay: true,
    });

    assert.equal(error, undefined);
    assert.equal(value.autoplayVideos, true);
    assert.equal(value.autoplay, undefined);
  });

  it('userSettings.themeSettingsBody should map appearance -> theme', () => {
    const { error, value } = themeSettingsBody.validate({
      appearance: 'dark',
    });

    assert.equal(error, undefined);
    assert.equal(value.theme, 'dark');
    assert.equal(value.appearance, undefined);
  });

  it('savepost.getSavedPostsQuery should apply pagination defaults', () => {
    const { error, value } = getSavedPostsQuery.validate({});

    assert.equal(error, undefined);
    assert.equal(value.page, 1);
    assert.equal(value.limit, 20);
    assert.equal(value.sort, 'newest');
  });
});
