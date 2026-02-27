import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import MessageService from '../../../../src/modules/message/message.service.js';
import messageRepository from '../../../../src/modules/message/message.repository.js';
import socketService from '../../../../src/modules/shared/socket/socket.service.js';
import logger from '../../../../src/configs/logger.js';
import cloudinary from '../../../../src/configs/cloudinaryConfig.js';

const USER_ID = '507f191e810c19729de860ea';
const OTHER_ID = '507f191e810c19729de860eb';
const THIRD_ID = '507f191e810c19729de860ec';

const originalRepositoryMethods = { ...messageRepository };
const originalSendMessage = socketService.sendMessage;
const originalSendConversationRead = socketService.sendConversationRead;
const originalSendMessageStatus = socketService.sendMessageStatus;
const originalEmitToRoom = socketService.emitToRoom;
const originalFindConversation = MessageService.findConversation;
const originalGetOrCreateDirectConversation =
  MessageService.getOrCreateDirectConversation;
const originalCanSendMessage = MessageService.canSendMessage;
const originalRemoveGroupMember = MessageService.removeGroupMember;
const originalMarkConversationAsRead = MessageService.markConversationAsRead;
const originalLoggerError = logger.error;

const CLOUDINARY_ENV_KEYS = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

function makePopulateLeanChain(value) {
  return {
    populate() {
      return this;
    },
    sort() {
      return this;
    },
    skip() {
      return this;
    },
    limit() {
      return this;
    },
    select() {
      return this;
    },
    lean: async () => value,
  };
}

afterEach(() => {
  Object.assign(messageRepository, originalRepositoryMethods);
  socketService.sendMessage = originalSendMessage;
  socketService.sendConversationRead = originalSendConversationRead;
  socketService.sendMessageStatus = originalSendMessageStatus;
  socketService.emitToRoom = originalEmitToRoom;
  MessageService.findConversation = originalFindConversation;
  MessageService.getOrCreateDirectConversation = originalGetOrCreateDirectConversation;
  MessageService.canSendMessage = originalCanSendMessage;
  MessageService.removeGroupMember = originalRemoveGroupMember;
  MessageService.markConversationAsRead = originalMarkConversationAsRead;
  logger.error = originalLoggerError;
});

describe('MessageService', () => {
  it('normalizeMessageType should map legacy media types and defaults', () => {
    assert.equal(MessageService.normalizeMessageType(undefined, false), 'text');
    assert.equal(MessageService.normalizeMessageType(undefined, true), 'media');
    assert.equal(MessageService.normalizeMessageType('image', false), 'media');
    assert.equal(MessageService.normalizeMessageType('reply', false), 'reply');
    assert.equal(MessageService.normalizeMessageType('unknown', false), 'text');
  });

  it('generateConversationId should produce stable sorted id', () => {
    const a = MessageService.generateConversationId(USER_ID, OTHER_ID);
    const b = MessageService.generateConversationId(OTHER_ID, USER_ID);

    assert.equal(a, b);
    assert.equal(a, `${USER_ID}_${OTHER_ID}`);
  });

  it('getConversations should format direct/group conversations and filter blocked users', async () => {
    let findQuery;
    let unreadPipeline;

    messageRepository.userSettingsFindOne = () => ({
      select: () => ({
        lean: async () => ({ blockedUsers: [THIRD_ID] }),
      }),
    });
    messageRepository.conversationFind = query => {
      findQuery = query;
      return makePopulateLeanChain([
        {
          _id: 'conv-direct',
          isGroup: false,
          members: [
            { _id: USER_ID, username: 'me' },
            {
              _id: OTHER_ID,
              username: 'other',
              lastActiveAt: new Date(Date.now() - 60 * 1000).toISOString(),
            },
          ],
        },
        {
          _id: 'conv-blocked',
          isGroup: false,
          members: [{ _id: USER_ID }, { _id: THIRD_ID }],
        },
        {
          _id: 'conv-group',
          isGroup: true,
          members: [{ _id: USER_ID }, { _id: OTHER_ID }],
        },
      ]);
    };
    messageRepository.messageAggregate = async pipeline => {
      unreadPipeline = pipeline;
      return [
        { _id: 'conv-direct', count: 2 },
        { _id: 'conv-group', count: 1 },
      ];
    };

    const result = await MessageService.getConversations(USER_ID, {
      page: 1,
      limit: 3,
    });

    assert.equal(findQuery.members, USER_ID);
    assert.equal(findQuery.$or.length, 3);
    assert.equal(
      unreadPipeline[0].$match.conversationId.$in.includes('conv-direct'),
      true
    );
    assert.equal(result.hasMore, true);
    assert.equal(result.conversations.length, 2);

    const directConversation = result.conversations.find(
      item => item.conversationId === 'conv-direct'
    );
    const groupConversation = result.conversations.find(
      item => item.conversationId === 'conv-group'
    );

    assert.equal(directConversation.otherUser._id, OTHER_ID);
    assert.equal(directConversation.otherUser.isOnline, true);
    assert.equal(directConversation.unreadCount, 2);
    assert.equal(groupConversation.unreadCount, 1);
  });

  it('canSendMessage should block sending to self', async () => {
    const result = await MessageService.canSendMessage(USER_ID, USER_ID);
    assert.equal(result.allowed, false);
  });

  it('canSendMessage should block when receiver does not exist', async () => {
    const originalUserFindById = messageRepository.userFindById;
    messageRepository.userFindById = () => ({
      select: () => ({
        lean: async () => null,
      }),
    });

    try {
      const result = await MessageService.canSendMessage(USER_ID, OTHER_ID);
      assert.equal(result.allowed, false);
      assert.equal(result.reason, 'Người dùng không tồn tại');
    } finally {
      messageRepository.userFindById = originalUserFindById;
    }
  });

  it('canSendMessage should block when sender has blocked receiver', async () => {
    const originalUserFindById = messageRepository.userFindById;
    const originalSettingsFindOne = messageRepository.userSettingsFindOne;

    messageRepository.userFindById = () => ({
      select: () => ({
        lean: async () => ({ privacy: { allowMessages: 'everyone' } }),
      }),
    });
    messageRepository.userSettingsFindOne = query => ({
      select: () => ({
        lean: async () =>
          query.user === USER_ID
            ? { blockedUsers: [OTHER_ID] }
            : { blockedUsers: [] },
      }),
    });

    try {
      const result = await MessageService.canSendMessage(USER_ID, OTHER_ID);
      assert.equal(result.allowed, false);
      assert.equal(result.reason, 'Bạn đã chặn người dùng này');
    } finally {
      messageRepository.userFindById = originalUserFindById;
      messageRepository.userSettingsFindOne = originalSettingsFindOne;
    }
  });

  it('canSendMessage should block when receiver only accepts following messages and sender is not followed', async () => {
    const originalUserFindById = messageRepository.userFindById;
    const originalSettingsFindOne = messageRepository.userSettingsFindOne;
    const originalFollowIsFollowing = messageRepository.followIsFollowing;

    messageRepository.userFindById = () => ({
      select: () => ({
        lean: async () => ({ privacy: { allowMessages: 'following' } }),
      }),
    });
    messageRepository.userSettingsFindOne = () => ({
      select: () => ({
        lean: async () => ({ blockedUsers: [] }),
      }),
    });
    messageRepository.followIsFollowing = async () => false;

    try {
      const result = await MessageService.canSendMessage(USER_ID, OTHER_ID);
      assert.equal(result.allowed, false);
      assert.equal(result.reason, 'Chỉ người được follow mới có thể gửi tin nhắn');
    } finally {
      messageRepository.userFindById = originalUserFindById;
      messageRepository.userSettingsFindOne = originalSettingsFindOne;
      messageRepository.followIsFollowing = originalFollowIsFollowing;
    }
  });

  it('canSendMessage should block when receiver does not accept any messages', async () => {
    const originalUserFindById = messageRepository.userFindById;
    const originalSettingsFindOne = messageRepository.userSettingsFindOne;

    messageRepository.userFindById = () => ({
      select: () => ({
        lean: async () => ({ privacy: { allowMessages: 'none' } }),
      }),
    });
    messageRepository.userSettingsFindOne = () => ({
      select: () => ({
        lean: async () => ({ blockedUsers: [] }),
      }),
    });

    try {
      const result = await MessageService.canSendMessage(USER_ID, OTHER_ID);
      assert.equal(result.allowed, false);
      assert.equal(result.reason, 'Người dùng không nhận tin nhắn');
    } finally {
      messageRepository.userFindById = originalUserFindById;
      messageRepository.userSettingsFindOne = originalSettingsFindOne;
    }
  });

  it('canSendMessage should allow when policy allows and no block exists', async () => {
    const originalUserFindById = messageRepository.userFindById;
    const originalSettingsFindOne = messageRepository.userSettingsFindOne;
    const originalFollowIsFollowing = messageRepository.followIsFollowing;

    messageRepository.userFindById = () => ({
      select: () => ({
        lean: async () => ({ privacy: { allowMessages: 'everyone' } }),
      }),
    });
    messageRepository.userSettingsFindOne = () => ({
      select: () => ({
        lean: async () => ({ blockedUsers: [] }),
      }),
    });
    messageRepository.followIsFollowing = async () => true;

    try {
      const result = await MessageService.canSendMessage(USER_ID, OTHER_ID);
      assert.deepEqual(result, { allowed: true });
    } finally {
      messageRepository.userFindById = originalUserFindById;
      messageRepository.userSettingsFindOne = originalSettingsFindOne;
      messageRepository.followIsFollowing = originalFollowIsFollowing;
    }
  });

  it('leaveGroup should delegate to removeGroupMember with self id', async () => {
    let receivedArgs;
    MessageService.removeGroupMember = async (...args) => {
      receivedArgs = args;
      return { ok: true };
    };

    const result = await MessageService.leaveGroup('conv-1', USER_ID);
    assert.deepEqual(receivedArgs, ['conv-1', USER_ID, USER_ID]);
    assert.equal(result.ok, true);
  });

  it('findConversation should query by directId when id is compound', async () => {
    let query;
    messageRepository.conversationFindOne = async q => {
      query = q;
      return { _id: 'conv-1' };
    };

    const result = await MessageService.findConversation(
      `${USER_ID}_${OTHER_ID}`,
      USER_ID
    );
    assert.equal(query.directId, `${USER_ID}_${OTHER_ID}`);
    assert.equal(query.members, USER_ID);
    assert.equal(result._id, 'conv-1');
  });

  it('findConversation should auto-create direct conversation when requested', async () => {
    messageRepository.conversationFindOne = async () => null;
    MessageService.getOrCreateDirectConversation = async () => ({ _id: 'created-conv' });
    messageRepository.conversationFindById = async id => ({ _id: id, members: [] });

    const result = await MessageService.findConversation(
      `${USER_ID}_${OTHER_ID}`,
      USER_ID,
      { autoCreate: true }
    );
    assert.equal(result._id, 'created-conv');
  });

  it('getConversationById should throw when conversation does not exist', async () => {
    MessageService.findConversation = async () => null;

    await assert.rejects(
      MessageService.getConversationById('missing-conv', USER_ID),
      err => err?.statusCode === 404
    );
  });

  it('getConversationById should return direct conversation with otherUser and unreadCount', async () => {
    MessageService.findConversation = async () => ({ _id: 'conv-2' });
    messageRepository.conversationFindById = () =>
      makePopulateLeanChain({
        _id: 'conv-2',
        isGroup: false,
        members: [
          { _id: USER_ID, username: 'me' },
          { _id: OTHER_ID, username: 'other' },
        ],
      });
    messageRepository.messageCountDocuments = async () => 3;

    const result = await MessageService.getConversationById('conv-2', USER_ID);
    assert.equal(result.conversationId, 'conv-2');
    assert.equal(result.otherUser._id, OTHER_ID);
    assert.equal(result.unreadCount, 3);
  });

  it('sendMessage should reject empty text content', async () => {
    MessageService.findConversation = async () => ({
      _id: 'conv-3',
      isGroup: false,
      members: [USER_ID, OTHER_ID],
    });

    await assert.rejects(
      MessageService.sendMessage('conv-3', USER_ID, {
        type: 'text',
        content: '   ',
      }),
      err => err?.statusCode === 400
    );
  });

  it('sendMessage should create message, update seenBy and emit socket event', async () => {
    const saveCalls = [];
    const socketCalls = [];
    MessageService.findConversation = async () => ({
      _id: 'conv-4',
      isGroup: false,
      members: [USER_ID, OTHER_ID],
      save: async () => {
        saveCalls.push('saved');
      },
    });
    messageRepository.messageCreate = async payload => ({ _id: 'msg-1', ...payload });
    messageRepository.messageFindById = () =>
      makePopulateLeanChain({
        _id: 'msg-1',
        sender: { _id: USER_ID, username: 'me' },
        content: 'hello',
        conversationId: 'conv-4',
      });
    messageRepository.messageFindByIdAndUpdate = async () => ({});
    socketService.sendMessage = (...args) => {
      socketCalls.push(args);
    };

    const result = await MessageService.sendMessage('conv-4', USER_ID, {
      content: ' hello ',
      type: 'text',
    });

    assert.equal(saveCalls.length, 1);
    assert.equal(socketCalls.length, 1);
    assert.equal(socketCalls[0][1], OTHER_ID);
    assert.equal(result.conversationId, 'conv-4');
    assert.equal(result.isMine, true);
  });

  it('markConversationAsRead should return zero when conversation is missing', async () => {
    MessageService.findConversation = async () => null;
    const result = await MessageService.markConversationAsRead('missing', USER_ID);
    assert.deepEqual(result, { updatedCount: 0 });
  });

  it('markConversationAsRead should update unread messages and notify direct peer', async () => {
    let updateQuery;
    let updateDoc;
    let conversationReadArgs;

    MessageService.findConversation = async () => ({
      _id: 'conv-5',
      directId: `${USER_ID}_${OTHER_ID}`,
      isGroup: false,
      members: [USER_ID, OTHER_ID],
    });
    messageRepository.messageUpdateMany = async (query, update) => {
      updateQuery = query;
      updateDoc = update;
      return { modifiedCount: 5 };
    };
    socketService.sendConversationRead = (...args) => {
      conversationReadArgs = args;
    };

    const result = await MessageService.markConversationAsRead('conv-5', USER_ID);

    assert.equal(updateQuery.conversationId.$in.includes('conv-5'), true);
    assert.equal(updateQuery.conversationId.$in.includes(`${USER_ID}_${OTHER_ID}`), true);
    assert.ok(updateDoc.$set.readAt instanceof Date);
    assert.deepEqual(conversationReadArgs, [OTHER_ID, USER_ID, 'conv-5']);
    assert.deepEqual(result, { updatedCount: 5 });
  });

  it('markMessageAsRead should emit status update when message is updated', async () => {
    let receivedEventArgs;
    messageRepository.messageFindOneAndUpdate = async () => ({
      _id: 'msg-2',
      sender: OTHER_ID,
    });
    socketService.sendMessageStatus = (...args) => {
      receivedEventArgs = args;
    };

    const result = await MessageService.markMessageAsRead('msg-2', USER_ID);
    assert.equal(result._id, 'msg-2');
    assert.deepEqual(receivedEventArgs, [OTHER_ID, USER_ID, 'msg-2', 'read']);
  });

  it('deleteMessage should support soft delete for self and for everyone', async () => {
    const saveEvents = [];
    const selfDeleteMessage = {
      sender: USER_ID,
      createdAt: new Date(),
      deletedFor: [],
      save: async () => {
        saveEvents.push('self');
      },
    };
    const everyoneDeleteMessage = {
      sender: USER_ID,
      createdAt: new Date(Date.now() - 1000),
      media: ['a'],
      content: 'abc',
      save: async () => {
        saveEvents.push('everyone');
      },
    };
    let callIndex = 0;
    messageRepository.messageFindOne = async () => {
      callIndex += 1;
      return callIndex === 1 ? selfDeleteMessage : everyoneDeleteMessage;
    };

    const selfResult = await MessageService.deleteMessage('msg-a', USER_ID, false);
    const allResult = await MessageService.deleteMessage('msg-b', USER_ID, true);

    assert.equal(selfResult.success, true);
    assert.equal(allResult.forEveryone, true);
    assert.equal(selfDeleteMessage.deletedFor.includes(USER_ID), true);
    assert.equal(everyoneDeleteMessage.isDeleted, true);
    assert.deepEqual(everyoneDeleteMessage.media, []);
    assert.equal(saveEvents.length, 2);
  });

  it('deleteConversation should hide all messages for current user', async () => {
    let receivedQuery;
    let receivedUpdate;
    MessageService.findConversation = async () => ({
      _id: 'conv-6',
      directId: `${USER_ID}_${OTHER_ID}`,
    });
    messageRepository.messageUpdateMany = async (query, update) => {
      receivedQuery = query;
      receivedUpdate = update;
      return { modifiedCount: 4 };
    };

    const result = await MessageService.deleteConversation('conv-6', USER_ID);
    assert.equal(receivedQuery.conversationId.$in.includes('conv-6'), true);
    assert.equal(receivedQuery.conversationId.$in.includes(`${USER_ID}_${OTHER_ID}`), true);
    assert.deepEqual(receivedUpdate, { $addToSet: { deletedFor: USER_ID } });
    assert.equal(result.success, true);
  });

  it('getUnreadCount should include group conversations and exclude blocked users', async () => {
    let receivedQuery;
    messageRepository.userSettingsFindOne = () => ({
      select: () => ({
        lean: async () => ({ blockedUsers: [THIRD_ID] }),
      }),
    });
    messageRepository.conversationFind = () =>
      makePopulateLeanChain([{ _id: 'group-1' }]);
    messageRepository.messageCountDocuments = async query => {
      receivedQuery = query;
      return 7;
    };

    const result = await MessageService.getUnreadCount(USER_ID);
    assert.equal(result, 7);
    assert.equal(receivedQuery.sender.$nin.includes(USER_ID), true);
    assert.equal(receivedQuery.sender.$nin.includes(THIRD_ID), true);
    assert.equal(receivedQuery.$or.length, 2);
  });

  it('searchMessages should return empty when conversation filter is invalid', async () => {
    MessageService.findConversation = async () => null;

    const result = await MessageService.searchMessages(USER_ID, 'hello', {
      conversationId: 'invalid',
    });
    assert.deepEqual(result, { messages: [], total: 0, hasMore: false });
  });

  it('searchMessages should return paginated results with isMine flag', async () => {
    messageRepository.conversationFind = () =>
      makePopulateLeanChain([{ _id: 'conv-7' }]);
    messageRepository.messageFind = () =>
      makePopulateLeanChain([
        {
          _id: 'm-a',
          sender: { _id: USER_ID },
          receiver: { _id: OTHER_ID },
          content: 'hello',
        },
        {
          _id: 'm-b',
          sender: { _id: OTHER_ID },
          receiver: { _id: USER_ID },
          content: 'world',
        },
      ]);
    messageRepository.messageCountDocuments = async () => 5;

    const result = await MessageService.searchMessages(USER_ID, 'he', {
      page: 1,
      limit: 2,
    });

    assert.equal(result.messages.length, 2);
    assert.equal(result.messages[0].isMine, true);
    assert.equal(result.messages[1].isMine, false);
    assert.equal(result.hasMore, true);
  });

  it('addReaction and removeReaction should update reactions and emit room events', async () => {
    const emitted = [];
    socketService.emitToRoom = (...args) => {
      emitted.push(args);
    };
    const message = {
      _id: 'msg-3',
      conversationId: 'conv-8',
      reactions: [{ user: OTHER_ID, emoji: '😀' }],
      save: async () => {},
    };
    messageRepository.messageFindOne = async () => message;

    const addResult = await MessageService.addReaction('msg-3', USER_ID, '🔥');
    const removeResult = await MessageService.removeReaction('msg-3', USER_ID);

    assert.equal(addResult.success, true);
    assert.equal(removeResult.success, true);
    assert.equal(emitted.length, 2);
    assert.equal(Array.isArray(removeResult.reactions), true);
  });

  it('canSendMessage should block when receiver has blocked sender', async () => {
    messageRepository.userFindById = () => ({
      select: () => ({
        lean: async () => ({ privacy: { allowMessages: 'everyone' } }),
      }),
    });
    messageRepository.userSettingsFindOne = query => ({
      select: () => ({
        lean: async () =>
          query.user === USER_ID
            ? { blockedUsers: [] }
            : { blockedUsers: [USER_ID] },
      }),
    });

    const result = await MessageService.canSendMessage(USER_ID, OTHER_ID);
    assert.equal(result.allowed, false);
    assert.equal(result.reason, 'Bạn không thể gửi tin nhắn cho người này');
  });

  it('getOrCreateDirectConversation should throw forbidden when cannot send', async () => {
    MessageService.canSendMessage = async () => ({
      allowed: false,
      reason: 'blocked',
    });

    await assert.rejects(
      MessageService.getOrCreateDirectConversation(USER_ID, OTHER_ID),
      err => err?.statusCode === 403
    );
  });

  it('getOrCreateDirectConversation should create conversation when missing', async () => {
    MessageService.canSendMessage = async () => ({ allowed: true });
    messageRepository.conversationFindOne = () => ({
      populate() {
        return this;
      },
      lean: async () => null,
    });
    messageRepository.conversationCreate = async () => ({ _id: 'conv-created' });
    messageRepository.conversationFindById = () =>
      makePopulateLeanChain({
        _id: 'conv-created',
        members: [{ _id: USER_ID }, { _id: OTHER_ID }],
      });
    messageRepository.messageCountDocuments = async () => 2;

    const result = await MessageService.getOrCreateDirectConversation(
      USER_ID,
      OTHER_ID
    );

    assert.equal(result.conversationId, 'conv-created');
    assert.equal(result.unreadCount, 2);
    assert.equal(result.otherUser._id, OTHER_ID);
  });

  it('createGroupConversation should deduplicate participants and support alias fields', async () => {
    let createPayload;
    messageRepository.conversationCreate = async payload => {
      createPayload = payload;
      return { _id: 'group-1' };
    };
    messageRepository.conversationFindById = () =>
      makePopulateLeanChain({
        _id: 'group-1',
        members: [{ _id: USER_ID }, { _id: OTHER_ID }],
      });

    const result = await MessageService.createGroupConversation(USER_ID, {
      participantIds: [OTHER_ID, OTHER_ID],
      name: 'Team',
      avatar: 'avatar-url',
    });

    assert.equal(createPayload.name, 'Team');
    assert.equal(createPayload.avatar, 'avatar-url');
    assert.equal(createPayload.members.length, 2);
    assert.equal(result._id, 'group-1');
  });

  it('updateGroup should reject when requester is not in conversation', async () => {
    messageRepository.conversationFindOne = async () => null;

    await assert.rejects(
      MessageService.updateGroup('group-2', USER_ID, { groupName: 'new' }),
      err => err?.statusCode === 403
    );
  });

  it('updateGroup should save name/avatar changes for valid member', async () => {
    let saved = false;
    const conversation = {
      name: 'old',
      avatar: 'old-avatar',
      save: async () => {
        saved = true;
      },
    };
    messageRepository.conversationFindOne = async () => conversation;
    messageRepository.conversationFindById = () =>
      makePopulateLeanChain({ _id: 'group-3', name: 'new-name' });

    const result = await MessageService.updateGroup('group-3', USER_ID, {
      name: 'new-name',
      avatar: 'new-avatar',
    });

    assert.equal(saved, true);
    assert.equal(conversation.name, 'new-name');
    assert.equal(conversation.avatar, 'new-avatar');
    assert.equal(result._id, 'group-3');
  });

  it('addGroupMembers should validate group type and append only new members', async () => {
    messageRepository.conversationFindOne = async () => ({
      isGroup: false,
      members: [USER_ID],
      save: async () => {},
    });

    await assert.rejects(
      MessageService.addGroupMembers('group-4', USER_ID, [OTHER_ID]),
      err => err?.statusCode === 400
    );

    let saved = false;
    const groupConversation = {
      isGroup: true,
      members: [USER_ID, OTHER_ID],
      save: async () => {
        saved = true;
      },
    };
    messageRepository.conversationFindOne = async () => groupConversation;
    messageRepository.conversationFindById = () =>
      makePopulateLeanChain({ _id: 'group-4' });

    await MessageService.addGroupMembers('group-4', USER_ID, [OTHER_ID, THIRD_ID]);
    assert.equal(saved, true);
    assert.equal(groupConversation.members.includes(THIRD_ID), true);
  });

  it('addGroupMembers should reject when conversation is missing', async () => {
    messageRepository.conversationFindOne = async () => null;

    await assert.rejects(
      MessageService.addGroupMembers('group-missing', USER_ID, [OTHER_ID]),
      err => err?.statusCode === 403
    );
  });

  it('removeGroupMember should enforce permissions', async () => {
    messageRepository.conversationFindOne = async () => ({
      admin: OTHER_ID,
      members: [USER_ID, OTHER_ID, THIRD_ID],
      save: async () => {},
    });

    await assert.rejects(
      MessageService.removeGroupMember('group-5', USER_ID, THIRD_ID),
      err => err?.statusCode === 403
    );
  });

  it('removeGroupMember should transfer admin when current admin leaves', async () => {
    const conversation = {
      admin: USER_ID,
      members: [USER_ID, OTHER_ID],
      save: async () => {},
    };
    messageRepository.conversationFindOne = async () => conversation;
    messageRepository.conversationFindById = () =>
      makePopulateLeanChain({ _id: 'group-6', admin: OTHER_ID });

    const result = await MessageService.removeGroupMember(
      'group-6',
      USER_ID,
      USER_ID
    );

    assert.equal(conversation.admin, OTHER_ID);
    assert.equal(result._id, 'group-6');
  });

  it('removeGroupMember should reject when conversation is missing', async () => {
    messageRepository.conversationFindOne = async () => null;

    await assert.rejects(
      MessageService.removeGroupMember('group-missing', USER_ID, OTHER_ID),
      err => err?.statusCode === 403
    );
  });

  it('getMessages should include before filter and reverse response order', async () => {
    let query;
    MessageService.findConversation = async () => ({
      _id: 'conv-9',
      isGroup: false,
      directId: `${USER_ID}_${OTHER_ID}`,
      members: [{ _id: USER_ID }, { _id: OTHER_ID }],
    });
    messageRepository.messageFind = q => {
      query = q;
      return makePopulateLeanChain([
        { _id: 'm1', sender: { _id: USER_ID }, content: 'a' },
        { _id: 'm2', sender: { _id: OTHER_ID }, content: 'b' },
      ]);
    };
    messageRepository.messageCountDocuments = async () => 2;
    MessageService.markConversationAsRead = async () => ({ updatedCount: 2 });

    const result = await MessageService.getMessages('conv-9', USER_ID, {
      before: '2026-01-01T00:00:00.000Z',
      page: 1,
      limit: 10,
    });

    assert.ok(query.createdAt.$lt instanceof Date);
    assert.equal(result.messages[0]._id, 'm2');
    assert.equal(result.messages[1]._id, 'm1');
  });

  it('getMessages should reject missing conversation and log read errors for groups', async () => {
    MessageService.findConversation = async () => null;
    await assert.rejects(
      MessageService.getMessages('conv-missing', USER_ID),
      err => err?.statusCode === 403
    );

    let query;
    const logCalls = [];
    MessageService.findConversation = async () => ({
      _id: 'group-logs',
      isGroup: true,
      members: [{ _id: USER_ID }, { _id: OTHER_ID }],
    });
    messageRepository.messageFind = q => {
      query = q;
      return makePopulateLeanChain([
        { _id: 'g1', sender: { _id: OTHER_ID }, content: 'group message' },
      ]);
    };
    messageRepository.messageCountDocuments = async () => 1;
    MessageService.markConversationAsRead = async () => {
      throw new Error('mark read failed');
    };
    logger.error = (...args) => {
      logCalls.push(args);
    };

    const result = await MessageService.getMessages('group-logs', USER_ID, {
      page: 1,
      limit: 20,
    });
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(query.conversationId, 'group-logs');
    assert.equal(result.messages.length, 1);
    assert.equal(result.messages[0].isMine, false);
    assert.equal(logCalls.length, 1);
    assert.equal(logCalls[0][0], 'Mark read failed:');
  });

  it('sendMessage should reject when conversation is missing and tolerate socket failure', async () => {
    MessageService.findConversation = async () => null;
    await assert.rejects(
      MessageService.sendMessage('missing', USER_ID, {
        content: 'hello',
        type: 'text',
      }),
      err => err?.statusCode === 403
    );

    const conversation = {
      _id: 'conv-10',
      isGroup: false,
      members: [USER_ID, OTHER_ID],
      save: async () => {},
    };
    MessageService.findConversation = async () => conversation;
    messageRepository.messageCreate = async payload => ({ _id: 'm-reply', ...payload });
    messageRepository.messageFindOne = () => ({
      select: () => ({
        lean: async () => ({ _id: 'reply-id' }),
      }),
    });
    messageRepository.messageFindById = () =>
      makePopulateLeanChain({
        _id: 'm-reply',
        sender: { _id: USER_ID },
        content: 'hello',
      });
    messageRepository.messageFindByIdAndUpdate = async () => ({});
    socketService.sendMessage = () => {
      throw new Error('socket down');
    };

    const result = await MessageService.sendMessage('conv-10', USER_ID, {
      content: 'hello',
      messageType: 'text',
      replyTo: 'reply-id',
    });

    assert.equal(result._id, 'm-reply');
  });

  it('deleteMessage should reject missing message and expired delete-for-everyone window', async () => {
    messageRepository.messageFindOne = async () => null;
    await assert.rejects(
      MessageService.deleteMessage('m-missing', USER_ID, false),
      err => err?.statusCode === 403
    );

    messageRepository.messageFindOne = async () => ({
      sender: USER_ID,
      createdAt: new Date(Date.now() - 16 * 60 * 1000),
      save: async () => {},
    });
    await assert.rejects(
      MessageService.deleteMessage('m-old', USER_ID, true),
      err => err?.statusCode === 403
    );
  });

  it('deleteMessage should initialize deletedFor for self-delete when missing', async () => {
    let saved = false;
    const message = {
      sender: USER_ID,
      createdAt: new Date(),
      save: async () => {
        saved = true;
      },
    };
    messageRepository.messageFindOne = async () => message;

    const result = await MessageService.deleteMessage('m-self', USER_ID, false);

    assert.equal(result.success, true);
    assert.deepEqual(message.deletedFor, [USER_ID]);
    assert.equal(saved, true);
  });

  it('deleteConversation should throw when conversation does not exist', async () => {
    MessageService.findConversation = async () => null;
    await assert.rejects(
      MessageService.deleteConversation('missing-conv', USER_ID),
      err => err?.statusCode === 404
    );
  });

  it('searchMessages should short-circuit for very short query and no conversation list', async () => {
    const shortResult = await MessageService.searchMessages(USER_ID, 'a', {});
    assert.deepEqual(shortResult, { messages: [], total: 0 });

    messageRepository.conversationFind = () => makePopulateLeanChain([]);
    const emptyResult = await MessageService.searchMessages(USER_ID, 'hello', {});
    assert.deepEqual(emptyResult, { messages: [], total: 0, hasMore: false });
  });

  it('searchMessages should apply resolved conversationId when provided', async () => {
    let receivedQuery;
    MessageService.findConversation = async () => ({ _id: 'conv-search' });
    messageRepository.messageFind = query => {
      receivedQuery = query;
      return makePopulateLeanChain([
        {
          _id: 'm-search',
          sender: OTHER_ID,
          receiver: USER_ID,
          content: 'hello',
        },
      ]);
    };
    messageRepository.messageCountDocuments = async () => 1;

    const result = await MessageService.searchMessages(USER_ID, ' hello ', {
      conversationId: 'conv-search',
      page: 1,
      limit: 10,
    });

    assert.equal(receivedQuery.conversationId, 'conv-search');
    assert.equal(result.messages[0].isMine, false);
    assert.equal(result.hasMore, false);
  });

  it('addReaction/removeReaction should handle not-found and no-reaction branches', async () => {
    messageRepository.messageFindOne = async () => null;
    await assert.rejects(
      MessageService.addReaction('m404', USER_ID, '😀'),
      err => err?.statusCode === 404
    );
    await assert.rejects(
      MessageService.removeReaction('m404', USER_ID),
      err => err?.statusCode === 404
    );

    messageRepository.messageFindOne = async () => ({
      _id: 'm-empty',
      conversationId: 'conv-empty',
      reactions: null,
      save: async () => {},
    });
    const result = await MessageService.removeReaction('m-empty', USER_ID);
    assert.deepEqual(result, { success: true, reactions: [] });
  });

  it('addReaction should initialize reactions and toggle duplicate emoji off', async () => {
    const message = {
      _id: 'm-toggle',
      conversationId: 'conv-toggle',
      reactions: null,
      save: async () => {},
    };
    messageRepository.messageFindOne = async () => message;

    const first = await MessageService.addReaction('m-toggle', USER_ID, '😀');
    const firstLength = first.reactions.length;
    const second = await MessageService.addReaction('m-toggle', USER_ID, '😀');

    assert.equal(firstLength, 1);
    assert.equal(second.reactions.length, 0);
  });

  it('uploadAttachments should upload image/video files and map returned media', async () => {
    const envSnapshot = {};
    for (const key of CLOUDINARY_ENV_KEYS) {
      envSnapshot[key] = process.env[key];
      process.env[key] = 'test-value';
    }

    const originalUploadStream = cloudinary.uploader.upload_stream;
    const originalDateNow = Date.now;
    const uploadCalls = [];

    try {
      Date.now = () => 1700000000000;
      cloudinary.uploader.upload_stream = (options, cb) => ({
        end: buffer => {
          uploadCalls.push({ options, buffer });
          const idx = uploadCalls.length;
          cb(null, {
            secure_url: `https://cdn.example.com/file-${idx}`,
            public_id: `public-${idx}`,
          });
        },
      });

      const result = await MessageService.uploadAttachments(
        [
          {
            mimetype: 'image/png',
            originalname: 'avatar.png',
            buffer: Buffer.from('img'),
          },
          {
            mimetype: 'video/mp4',
            originalname: 'clip.mp4',
            buffer: Buffer.from('vid'),
          },
        ],
        USER_ID
      );

      assert.equal(result.length, 2);
      assert.deepEqual(result[0], {
        url: 'https://cdn.example.com/file-1',
        type: 'image',
        publicId: 'public-1',
      });
      assert.deepEqual(result[1], {
        url: 'https://cdn.example.com/file-2',
        type: 'video',
        publicId: 'public-2',
      });
      assert.equal(uploadCalls.length, 2);
      assert.equal(uploadCalls[0].options.folder, 'messages');
      assert.equal(uploadCalls[0].options.resourceType, 'image');
      assert.equal(uploadCalls[0].options.publicId.includes('msg_'), true);
      assert.equal(uploadCalls[0].buffer.toString(), 'img');
      assert.equal(uploadCalls[1].options.resourceType, 'video');
      assert.equal(uploadCalls[1].buffer.toString(), 'vid');
    } finally {
      Date.now = originalDateNow;
      cloudinary.uploader.upload_stream = originalUploadStream;
      for (const key of CLOUDINARY_ENV_KEYS) {
        if (envSnapshot[key] === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = envSnapshot[key];
        }
      }
    }
  });

  it('getUsersForChat should return paginated users from aggregate pipeline', async () => {
    messageRepository.conversationAggregate = () => ({
      collation: async () => [
        {
          metadata: [{ total: 3 }],
          users: [{ _id: OTHER_ID }, { _id: THIRD_ID }],
        },
      ],
    });

    const result = await MessageService.getUsersForChat(USER_ID, {
      page: 1,
      limit: 2,
      search: 'bo',
    });

    assert.equal(result.total, 3);
    assert.equal(result.users.length, 2);
    assert.equal(result.hasMore, true);
  });
});

