import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  xssClean,
  mongoSanitizeMiddleware,
  globalRateLimiter,
} from '../../../src/middlewares/security.middleware.js';
import logger from '../../../src/configs/logger.js';

describe('security.middleware', () => {
  it('xssClean should sanitize HTML in body/query/params and keep sensitive fields raw', () => {
    const req = {
      body: {
        content: '<script>alert(1)</script><b>Hello</b>',
        password: '<script>do-not-touch</script>',
      },
      query: {
        q: '<img src=x onerror=alert(1)>hello',
      },
      params: {
        id: '<b>unsafe</b>',
      },
    };

    let nextCalled = false;
    xssClean(req, {}, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.body.password, '<script>do-not-touch</script>');
    assert.ok(!req.body.content.includes('<'));
    assert.ok(!req.query.q.includes('<'));
    assert.ok(!req.params.id.includes('<'));
  });

  it('xssClean should sanitize nested structures and keep non-string values unchanged', () => {
    const req = {
      body: '<b>bold</b>',
      query: {
        nested: {
          bio: '<img src=x onerror=alert(1)>hi',
          age: 20,
          active: true,
          profile: null,
        },
        list: ['<script>bad()</script>', 1, null],
        accessToken: '<script>raw-token</script>',
      },
      params: null,
    };

    let nextCalled = false;
    xssClean(req, {}, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.body, 'bold');
    assert.ok(!req.query.nested.bio.includes('<'));
    assert.equal(req.query.nested.age, 20);
    assert.equal(req.query.nested.active, true);
    assert.equal(req.query.nested.profile, null);
    assert.ok(!req.query.list[0].includes('<'));
    assert.equal(req.query.list[1], 1);
    assert.equal(req.query.list[2], null);
    assert.equal(req.query.accessToken, '<script>raw-token</script>');
  });

  it('xssClean should continue when req does not include body/query/params', () => {
    const req = {};
    let nextCalled = false;

    xssClean(req, {}, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
  });

  it('mongoSanitizeMiddleware should sanitize NoSQL operators and trigger warning callback', () => {
    const originalWarn = logger.warn;
    let warnCalled = false;
    logger.warn = () => {
      warnCalled = true;
    };

    try {
      const req = {
        path: '/users',
        body: { user: { $ne: null } },
      };

      let nextCalled = false;
      mongoSanitizeMiddleware(req, {}, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
      assert.equal(warnCalled, true);
    } finally {
      logger.warn = originalWarn;
    }
  });

  it('globalRateLimiter should use custom handler response when rate limit is exceeded', async () => {
    const testIp = '203.0.113.1';
    let blockedCount = 0;

    globalRateLimiter.resetKey(testIp);

    for (let i = 0; i < 5005; i++) {
      const req = {
        ip: testIp,
        path: '/api/posts',
        method: 'GET',
        headers: {},
        socket: { remoteAddress: testIp },
        app: { get: () => false },
      };

      await new Promise(resolve => {
        const res = {
          status: statusCode => ({
            json: payload => {
              blockedCount++;
              assert.equal(statusCode, 429);
              assert.equal(payload.code, 0);
              resolve();
            },
          }),
          setHeader: () => {},
          getHeader: () => undefined,
          headersSent: false,
        };

        globalRateLimiter(req, res, () => resolve());
      });
    }

    assert.ok(blockedCount > 0);
    globalRateLimiter.resetKey(testIp);
  });
});
