import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { adminMiddleware } from '../../../src/middlewares/admin.middleware.js';
import { runMiddleware } from '../../shared/middlewareTestUtils.js';
import { TEST_USER_ID } from '../../shared/authTestUtils.js';

describe('admin.middleware', () => {
  it('should return unauthorized error when req.user is missing', async () => {
    const error = await runMiddleware(adminMiddleware, {}, {});

    assert.equal(error.statusCode, 401);
    assert.equal(error.message, 'Unauthorized. Authentication required.');
  });

  it('should return forbidden error when user is not admin', async () => {
    const error = await runMiddleware(
      adminMiddleware,
      { user: { id: TEST_USER_ID, isAdmin: false } },
      {}
    );

    assert.equal(error.statusCode, 403);
    assert.equal(error.message, 'Forbidden. Admin privileges required.');
  });

  it('should pass when user is admin', async () => {
    const error = await runMiddleware(
      adminMiddleware,
      { user: { id: TEST_USER_ID, isAdmin: true } },
      {}
    );

    assert.equal(error, undefined);
  });
});

