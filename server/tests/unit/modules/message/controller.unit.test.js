import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import MessageController from '../../../../src/modules/message/message.controller.js';
import MessageService from '../../../../src/modules/message/message.service.js';
import UserService from '../../../../src/modules/user/user.service.js';
import socketService from '../../../../src/modules/shared/socket/socket.service.js';
import {
  createMockResponse,
  runMiddleware,
} from '../../../shared/middlewareTestUtils.js';

const TEST_USER_ID = '507f191e810c19729de860ea';

describe('MessageController', () => {
  it('GetAllConversations should pass pagination to service', async () => {
    const originalGetConversations = MessageService.getConversations;
    let receivedArgs;

    MessageService.getConversations = async (...args) => {
      receivedArgs = args;
      return { conversations: [], total: 0 };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        query: { page: '2', limit: '5' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        MessageController.GetAllConversations,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.equal(receivedArgs[0], TEST_USER_ID);
      assert.equal(receivedArgs[1].page, 2);
      assert.equal(receivedArgs[1].limit, 5);
      assert.equal(res.statusCode, 200);
    } finally {
      MessageService.getConversations = originalGetConversations;
    }
  });

  it('GetOrCreateConversation should resolve participant and create direct conversation', async () => {
    const originalResolve = UserService.resolveUserIdOrUsername;
    const originalGetOrCreateDirectConversation =
      MessageService.getOrCreateDirectConversation;
    let receivedResolvedInput;
    let receivedDirectArgs;

    UserService.resolveUserIdOrUsername = async input => {
      receivedResolvedInput = input;
      return '507f191e810c19729de860eb';
    };
    MessageService.getOrCreateDirectConversation = async (...args) => {
      receivedDirectArgs = args;
      return { _id: '507f191e810c19729de860ec' };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        body: { participantId: 'john_doe' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        MessageController.GetOrCreateConversation,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.equal(receivedResolvedInput, 'john_doe');
      assert.deepEqual(receivedDirectArgs, [
        TEST_USER_ID,
        '507f191e810c19729de860eb',
      ]);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.data._id, '507f191e810c19729de860ec');
    } finally {
      UserService.resolveUserIdOrUsername = originalResolve;
      MessageService.getOrCreateDirectConversation =
        originalGetOrCreateDirectConversation;
    }
  });

  it('GetOrCreateConversation should create group conversation for group payload', async () => {
    const originalResolve = UserService.resolveUserIdOrUsername;
    const originalCreateGroupConversation =
      MessageService.createGroupConversation;
    let receivedGroupArgs;

    UserService.resolveUserIdOrUsername = async input => `resolved-${input}`;
    MessageService.createGroupConversation = async (...args) => {
      receivedGroupArgs = args;
      return { _id: '507f191e810c19729de860ef' };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        body: {
          participantIds: ['u1', 'u2'],
          isGroup: true,
          groupName: 'Test Group',
          groupAvatar: 'avatar.png',
        },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        MessageController.GetOrCreateConversation,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.equal(receivedGroupArgs[0], TEST_USER_ID);
      assert.deepEqual(receivedGroupArgs[1], {
        participantIds: ['resolved-u1', 'resolved-u2'],
        groupName: 'Test Group',
        groupAvatar: 'avatar.png',
      });
      assert.equal(res.statusCode, 201);
      assert.equal(res.jsonPayload.message, 'Group created successfully');
    } finally {
      UserService.resolveUserIdOrUsername = originalResolve;
      MessageService.createGroupConversation = originalCreateGroupConversation;
    }
  });

  it('GetOrCreateConversation should create direct conversation when participantIds has one item and isGroup=false', async () => {
    const originalResolve = UserService.resolveUserIdOrUsername;
    const originalGetOrCreateDirectConversation =
      MessageService.getOrCreateDirectConversation;
    let receivedDirectArgs;

    UserService.resolveUserIdOrUsername = async input => `resolved-${input}`;
    MessageService.getOrCreateDirectConversation = async (...args) => {
      receivedDirectArgs = args;
      return { _id: '507f191e810c19729de860ec' };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        body: {
          participantIds: ['507f191e810c19729de860eb'],
          isGroup: false,
        },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        MessageController.GetOrCreateConversation,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.deepEqual(receivedDirectArgs, [TEST_USER_ID, 'resolved-507f191e810c19729de860eb']);
      assert.equal(res.statusCode, 200);
    } finally {
      UserService.resolveUserIdOrUsername = originalResolve;
      MessageService.getOrCreateDirectConversation =
        originalGetOrCreateDirectConversation;
    }
  });

  it('GetConversation should return conversation by id', async () => {
    const originalGetConversationById = MessageService.getConversationById;
    let receivedArgs;

    MessageService.getConversationById = async (...args) => {
      receivedArgs = args;
      return { _id: '507f191e810c19729de860ec' };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { conversationId: '507f191e810c19729de860eb' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(MessageController.GetConversation, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        '507f191e810c19729de860eb',
        TEST_USER_ID,
      ]);
      assert.equal(res.statusCode, 200);
    } finally {
      MessageService.getConversationById = originalGetConversationById;
    }
  });

  it('GetOrCreateConversation should return bad request when participant data is missing', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      body: {},
    };
    const res = createMockResponse();

    const error = await runMiddleware(
      MessageController.GetOrCreateConversation,
      req,
      res
    );

    assert.equal(error.statusCode, 400);
  });

  it('CreateGroupConversation should validate minimum participant count', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      body: { participantIds: ['507f191e810c19729de860eb'], groupName: 'A' },
    };
    const res = createMockResponse();

    const error = await runMiddleware(
      MessageController.CreateGroupConversation,
      req,
      res
    );

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Group requires at least 2 participants');
  });

  it('CreateGroupConversation should require group name', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      body: {
        participantIds: [
          TEST_USER_ID,
          '507f191e810c19729de860eb',
        ],
      },
    };
    const res = createMockResponse();

    const error = await runMiddleware(
      MessageController.CreateGroupConversation,
      req,
      res
    );

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Group name is required');
  });

  it('CreateGroupConversation should create group and emit events for other participants', async () => {
    const originalCreateGroupConversation =
      MessageService.createGroupConversation;
    const originalEmitGroupCreated = socketService.emitGroupCreated;
    let createArgs;
    const emitCalls = [];

    MessageService.createGroupConversation = async (...args) => {
      createArgs = args;
      return { _id: '507f191e810c19729de860ef' };
    };
    socketService.emitGroupCreated = (...args) => {
      emitCalls.push(args);
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        body: {
          participantIds: [
            TEST_USER_ID,
            '507f191e810c19729de860eb',
            '507f191e810c19729de860ec',
          ],
          groupName: 'Team',
          groupAvatar: 'team.png',
        },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        MessageController.CreateGroupConversation,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.equal(createArgs[0], TEST_USER_ID);
      assert.equal(createArgs[1].groupName, 'Team');
      assert.equal(emitCalls.length, 2);
      assert.equal(emitCalls[0][0], '507f191e810c19729de860eb');
      assert.equal(emitCalls[1][0], '507f191e810c19729de860ec');
      assert.equal(res.statusCode, 201);
    } finally {
      MessageService.createGroupConversation = originalCreateGroupConversation;
      socketService.emitGroupCreated = originalEmitGroupCreated;
    }
  });

  it('AddGroupMembers should validate memberIds', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      params: { conversationId: '507f191e810c19729de860eb' },
      body: { memberIds: [] },
    };
    const res = createMockResponse();

    const error = await runMiddleware(MessageController.AddGroupMembers, req, res);

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Member IDs are required');
  });

  it('AddGroupMembers should emit added event for each new member', async () => {
    const originalAddGroupMembers = MessageService.addGroupMembers;
    const originalEmitAddedToGroup = socketService.emitAddedToGroup;
    const emitCalls = [];

    MessageService.addGroupMembers = async () => ({
      _id: '507f191e810c19729de860ec',
    });
    socketService.emitAddedToGroup = (...args) => {
      emitCalls.push(args);
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { conversationId: '507f191e810c19729de860eb' },
        body: { memberIds: ['507f191e810c19729de860ec', '507f191e810c19729de860ed'] },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        MessageController.AddGroupMembers,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.equal(emitCalls.length, 2);
      assert.equal(emitCalls[0][0], '507f191e810c19729de860ec');
      assert.equal(emitCalls[1][0], '507f191e810c19729de860ed');
      assert.equal(res.statusCode, 200);
    } finally {
      MessageService.addGroupMembers = originalAddGroupMembers;
      socketService.emitAddedToGroup = originalEmitAddedToGroup;
    }
  });

  it('UpdateGroupConversation should map name/avatar aliases', async () => {
    const originalUpdateGroup = MessageService.updateGroup;
    let receivedArgs;

    MessageService.updateGroup = async (...args) => {
      receivedArgs = args;
      return { _id: '507f191e810c19729de860ec' };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { conversationId: '507f191e810c19729de860eb' },
        body: { name: 'New Group Name', avatar: 'new-avatar.png' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        MessageController.UpdateGroupConversation,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        '507f191e810c19729de860eb',
        TEST_USER_ID,
        { groupName: 'New Group Name', groupAvatar: 'new-avatar.png' },
      ]);
      assert.equal(res.statusCode, 200);
    } finally {
      MessageService.updateGroup = originalUpdateGroup;
    }
  });

  it('RemoveGroupMember should call service and emit socket event', async () => {
    const originalRemoveGroupMember = MessageService.removeGroupMember;
    const originalEmitRemovedFromGroup = socketService.emitRemovedFromGroup;
    let removedArgs;
    let emittedArgs;

    MessageService.removeGroupMember = async (...args) => {
      removedArgs = args;
      return { _id: '507f191e810c19729de860ec' };
    };
    socketService.emitRemovedFromGroup = (...args) => {
      emittedArgs = args;
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: {
          conversationId: '507f191e810c19729de860eb',
          memberId: '507f191e810c19729de860ed',
        },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        MessageController.RemoveGroupMember,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.deepEqual(removedArgs, [
        '507f191e810c19729de860eb',
        TEST_USER_ID,
        '507f191e810c19729de860ed',
      ]);
      assert.equal(emittedArgs[0], '507f191e810c19729de860ed');
      assert.equal(emittedArgs[1].conversationId, '507f191e810c19729de860eb');
      assert.equal(res.statusCode, 200);
    } finally {
      MessageService.removeGroupMember = originalRemoveGroupMember;
      socketService.emitRemovedFromGroup = originalEmitRemovedFromGroup;
    }
  });

  it('LeaveGroup should delegate to service', async () => {
    const originalLeaveGroup = MessageService.leaveGroup;
    let receivedArgs;

    MessageService.leaveGroup = async (...args) => {
      receivedArgs = args;
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { conversationId: '507f191e810c19729de860eb' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(MessageController.LeaveGroup, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        '507f191e810c19729de860eb',
        TEST_USER_ID,
      ]);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.message, 'Left group successfully');
    } finally {
      MessageService.leaveGroup = originalLeaveGroup;
    }
  });

  it('DeleteConversation should delegate to service', async () => {
    const originalDeleteConversation = MessageService.deleteConversation;
    let receivedArgs;

    MessageService.deleteConversation = async (...args) => {
      receivedArgs = args;
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { conversationId: '507f191e810c19729de860eb' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(
        MessageController.DeleteConversation,
        req,
        res
      );

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        '507f191e810c19729de860eb',
        TEST_USER_ID,
      ]);
      assert.equal(res.statusCode, 200);
    } finally {
      MessageService.deleteConversation = originalDeleteConversation;
    }
  });

  it('GetMessages should pass parsed pagination params', async () => {
    const originalGetMessages = MessageService.getMessages;
    let receivedArgs;

    MessageService.getMessages = async (...args) => {
      receivedArgs = args;
      return { messages: [], total: 0 };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { conversationId: '507f191e810c19729de860eb' },
        query: { page: '3', limit: '25', before: '507f191e810c19729de860ef' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(MessageController.GetMessages, req, res);

      assert.equal(error, undefined);
      assert.equal(receivedArgs[0], '507f191e810c19729de860eb');
      assert.equal(receivedArgs[1], TEST_USER_ID);
      assert.deepEqual(receivedArgs[2], {
        page: 3,
        limit: 25,
        before: '507f191e810c19729de860ef',
      });
      assert.equal(res.statusCode, 200);
    } finally {
      MessageService.getMessages = originalGetMessages;
    }
  });

  it('SendMessage should reject empty content without attachments', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      body: { conversationId: '507f191e810c19729de860eb', content: '' },
      files: [],
    };
    const res = createMockResponse();

    const error = await runMiddleware(MessageController.SendMessage, req, res);

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Message content or attachment is required');
  });

  it('SendMessage should map type alias and pass uploaded attachments', async () => {
    const originalUploadAttachments = MessageService.uploadAttachments;
    const originalSendMessage = MessageService.sendMessage;
    let receivedSendArgs;

    MessageService.uploadAttachments = async () => [{ url: 'https://cdn/file.jpg' }];
    MessageService.sendMessage = async (...args) => {
      receivedSendArgs = args;
      return { _id: '507f191e810c19729de860ef' };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        body: {
          conversationId: '507f191e810c19729de860eb',
          type: 'image',
        },
        files: [{ originalname: 'file.jpg' }],
      };
      const res = createMockResponse();

      const error = await runMiddleware(MessageController.SendMessage, req, res);

      assert.equal(error, undefined);
      assert.equal(receivedSendArgs[0], '507f191e810c19729de860eb');
      assert.equal(receivedSendArgs[1], TEST_USER_ID);
      assert.equal(receivedSendArgs[2].messageType, 'image');
      assert.equal(receivedSendArgs[2].media.length, 1);
      assert.equal(res.statusCode, 201);
    } finally {
      MessageService.uploadAttachments = originalUploadAttachments;
      MessageService.sendMessage = originalSendMessage;
    }
  });

  it('DeleteMessage should pass forEveryone flag to service', async () => {
    const originalDeleteMessage = MessageService.deleteMessage;
    let receivedArgs;

    MessageService.deleteMessage = async (...args) => {
      receivedArgs = args;
      return { _id: '507f191e810c19729de860ec' };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { messageId: '507f191e810c19729de860eb' },
        body: { forEveryone: true },
      };
      const res = createMockResponse();

      const error = await runMiddleware(MessageController.DeleteMessage, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        '507f191e810c19729de860eb',
        TEST_USER_ID,
        true,
      ]);
      assert.equal(res.statusCode, 200);
    } finally {
      MessageService.deleteMessage = originalDeleteMessage;
    }
  });

  it('MarkAsRead and MarkMessageAsRead should delegate to service', async () => {
    const originalMarkConversationAsRead = MessageService.markConversationAsRead;
    const originalMarkMessageAsRead = MessageService.markMessageAsRead;
    let markConversationArgs;
    let markMessageArgs;

    MessageService.markConversationAsRead = async (...args) => {
      markConversationArgs = args;
    };
    MessageService.markMessageAsRead = async (...args) => {
      markMessageArgs = args;
    };

    try {
      const reqConversation = {
        user: { id: TEST_USER_ID },
        params: { conversationId: '507f191e810c19729de860eb' },
      };
      const reqMessage = {
        user: { id: TEST_USER_ID },
        params: { messageId: '507f191e810c19729de860ef' },
      };
      const resConversation = createMockResponse();
      const resMessage = createMockResponse();

      const errorConversation = await runMiddleware(
        MessageController.MarkAsRead,
        reqConversation,
        resConversation
      );
      const errorMessage = await runMiddleware(
        MessageController.MarkMessageAsRead,
        reqMessage,
        resMessage
      );

      assert.equal(errorConversation, undefined);
      assert.equal(errorMessage, undefined);
      assert.deepEqual(markConversationArgs, [
        '507f191e810c19729de860eb',
        TEST_USER_ID,
      ]);
      assert.deepEqual(markMessageArgs, [
        '507f191e810c19729de860ef',
        TEST_USER_ID,
      ]);
      assert.equal(resConversation.statusCode, 200);
      assert.equal(resMessage.statusCode, 200);
    } finally {
      MessageService.markConversationAsRead = originalMarkConversationAsRead;
      MessageService.markMessageAsRead = originalMarkMessageAsRead;
    }
  });

  it('GetUnreadCount should return unread count payload', async () => {
    const originalGetUnreadCount = MessageService.getUnreadCount;
    MessageService.getUnreadCount = async () => 7;

    try {
      const req = {
        user: { id: TEST_USER_ID },
      };
      const res = createMockResponse();

      const error = await runMiddleware(MessageController.GetUnreadCount, req, res);

      assert.equal(error, undefined);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.data.unreadCount, 7);
    } finally {
      MessageService.getUnreadCount = originalGetUnreadCount;
    }
  });

  it('AddReaction should require emoji', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      params: { messageId: '507f191e810c19729de860eb' },
      body: {},
    };
    const res = createMockResponse();

    const error = await runMiddleware(MessageController.AddReaction, req, res);

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Emoji is required');
  });

  it('AddReaction should delegate to service and return response', async () => {
    const originalAddReaction = MessageService.addReaction;
    let receivedArgs;

    MessageService.addReaction = async (...args) => {
      receivedArgs = args;
      return { emoji: '😀' };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { messageId: '507f191e810c19729de860eb' },
        body: { emoji: '😀' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(MessageController.AddReaction, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, ['507f191e810c19729de860eb', TEST_USER_ID, '😀']);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload.message, 'Reaction added');
    } finally {
      MessageService.addReaction = originalAddReaction;
    }
  });

  it('RemoveReaction should delegate to service', async () => {
    const originalRemoveReaction = MessageService.removeReaction;
    let receivedArgs;

    MessageService.removeReaction = async (...args) => {
      receivedArgs = args;
      return { removed: true };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        params: { messageId: '507f191e810c19729de860eb' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(MessageController.RemoveReaction, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        '507f191e810c19729de860eb',
        TEST_USER_ID,
      ]);
      assert.equal(res.statusCode, 200);
    } finally {
      MessageService.removeReaction = originalRemoveReaction;
    }
  });

  it('SendTypingIndicator should default and pass isTyping state', async () => {
    const originalEmitTyping = socketService.emitTyping;
    let firstCallArgs;
    let secondCallArgs;
    let callCount = 0;

    socketService.emitTyping = (...args) => {
      callCount += 1;
      if (callCount === 1) firstCallArgs = args;
      if (callCount === 2) secondCallArgs = args;
    };

    try {
      const reqDefault = {
        user: { id: TEST_USER_ID },
        params: { conversationId: '507f191e810c19729de860eb' },
        body: {},
      };
      const reqExplicit = {
        user: { id: TEST_USER_ID },
        params: { conversationId: '507f191e810c19729de860eb' },
        body: { isTyping: false },
      };
      const resDefault = createMockResponse();
      const resExplicit = createMockResponse();

      const errorDefault = await runMiddleware(
        MessageController.SendTypingIndicator,
        reqDefault,
        resDefault
      );
      const errorExplicit = await runMiddleware(
        MessageController.SendTypingIndicator,
        reqExplicit,
        resExplicit
      );

      assert.equal(errorDefault, undefined);
      assert.equal(errorExplicit, undefined);
      assert.deepEqual(firstCallArgs, [
        '507f191e810c19729de860eb',
        TEST_USER_ID,
        true,
      ]);
      assert.deepEqual(secondCallArgs, [
        '507f191e810c19729de860eb',
        TEST_USER_ID,
        false,
      ]);
    } finally {
      socketService.emitTyping = originalEmitTyping;
    }
  });

  it('SearchMessages should require query with at least 2 characters', async () => {
    const req = {
      user: { id: TEST_USER_ID },
      query: { query: 'a' },
    };
    const res = createMockResponse();

    const error = await runMiddleware(MessageController.SearchMessages, req, res);

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Query must be at least 2 characters');
  });

  it('GetUsersForChat should pass search alias and pagination', async () => {
    const originalGetUsersForChat = MessageService.getUsersForChat;
    let receivedArgs;

    MessageService.getUsersForChat = async (...args) => {
      receivedArgs = args;
      return { users: [], total: 0 };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        query: { page: '4', limit: '8', q: 'john' },
      };
      const res = createMockResponse();

      const error = await runMiddleware(MessageController.GetUsersForChat, req, res);

      assert.equal(error, undefined);
      assert.equal(receivedArgs[0], TEST_USER_ID);
      assert.deepEqual(receivedArgs[1], {
        page: 4,
        limit: 8,
        search: 'john',
      });
      assert.equal(res.statusCode, 200);
    } finally {
      MessageService.getUsersForChat = originalGetUsersForChat;
    }
  });

  it('SearchMessages should delegate to service when query is valid', async () => {
    const originalSearchMessages = MessageService.searchMessages;
    let receivedArgs;

    MessageService.searchMessages = async (...args) => {
      receivedArgs = args;
      return { messages: [], total: 0 };
    };

    try {
      const req = {
        user: { id: TEST_USER_ID },
        query: {
          query: 'hello',
          conversationId: '507f191e810c19729de860eb',
          page: '2',
          limit: '4',
        },
      };
      const res = createMockResponse();

      const error = await runMiddleware(MessageController.SearchMessages, req, res);

      assert.equal(error, undefined);
      assert.deepEqual(receivedArgs, [
        TEST_USER_ID,
        'hello',
        { conversationId: '507f191e810c19729de860eb', page: 2, limit: 4 },
      ]);
      assert.equal(res.statusCode, 200);
    } finally {
      MessageService.searchMessages = originalSearchMessages;
    }
  });
});

