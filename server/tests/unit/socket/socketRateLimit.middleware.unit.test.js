import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import logger from '../../../src/configs/logger.js';
import rateLimiter, {
  cleanupRateLimiter,
  createRateLimitedHandler,
  getRateLimiterStats,
  shutdownRateLimiter,
  socketRateLimitMiddleware,
} from '../../../src/socket/middlewares/socketRateLimit.middleware.js';
import { createMockSocket } from '../../shared/socketTestUtils.js';

describe('socketRateLimit.middleware', () => {
  const originalWarn = logger.warn;

  afterEach(() => {
    logger.warn = originalWarn;
    shutdownRateLimiter();
  });

  it('socketRateLimitMiddleware should call next while under the limit', () => {
    const socket = createMockSocket({ id: 'socket-limit-1' });
    let nextCalls = 0;

    socketRateLimitMiddleware('typing')(socket, () => {
      nextCalls += 1;
    });

    assert.equal(nextCalls, 1);
    assert.equal(rateLimiter.clients.get('socket-limit-1').events.typing.length, 1);
  });

  it('createRateLimitedHandler should warn and disconnect repeat offenders', async () => {
    const socket = createMockSocket({ id: 'socket-limit-2' });
    const handlerCalls = [];
    const warnCalls = [];

    logger.warn = (message, meta) => {
      warnCalls.push({ message, meta });
    };

    const handler = createRateLimitedHandler(
      'typing',
      payload => {
        handlerCalls.push(payload);
      },
      socket
    );

    for (let i = 0; i < 30; i++) {
      await handler(i);
    }

    assert.equal(handlerCalls.length, 20);
    assert.ok(socket.emissions.some(item => item.event === 'rate_limit_warning'));
    assert.ok(
      socket.emissions.some(
        item =>
          item.event === 'error' &&
          item.payload.message === 'Rate limit exceeded. Connection closed.'
      )
    );
    assert.deepEqual(socket.disconnectCalls, [true]);
    assert.equal(rateLimiter.clients.has('socket-limit-2'), false);
    assert.equal(warnCalls[0].message, 'Socket rate limit warning');
    assert.equal(
      warnCalls[warnCalls.length - 1].message,
      'Socket rate limit exceeded - disconnecting'
    );
  });

  it('should cleanup expired timestamps and empty client buckets', () => {
    rateLimiter.clients.set('socket-limit-3', {
      events: {
        typing: [Date.now() - 20_000],
      },
      violations: 0,
    });

    rateLimiter._cleanup();

    assert.equal(rateLimiter.clients.has('socket-limit-3'), false);
  });

  it('cleanupRateLimiter, getRateLimiterStats, and shutdownRateLimiter should manage singleton state', () => {
    rateLimiter.clients.set('socket-limit-4', {
      events: { sendMessage: [Date.now()] },
      violations: 0,
    });
    rateLimiter.clients.set('socket-limit-5', {
      events: { typing: [Date.now()] },
      violations: 0,
    });

    cleanupRateLimiter('socket-limit-4');

    const stats = getRateLimiterStats();
    assert.equal(stats.totalClients, 1);
    assert.ok(stats.timestamp instanceof Date);

    shutdownRateLimiter();

    assert.equal(rateLimiter.clients.size, 0);
    assert.equal(rateLimiter._cleanupInterval, null);
  });
});
