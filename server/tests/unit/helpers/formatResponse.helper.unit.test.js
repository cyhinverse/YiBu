import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatResponse } from '../../../src/helpers/formatResponse.js';
import { createMockResponse } from '../../shared/middlewareTestUtils.js';

describe('helpers/formatResponse', () => {
  it('should build success payload with optional meta extras', () => {
    const res = createMockResponse();

    formatResponse(
      res,
      200,
      1,
      'Success',
      { id: '507f191e810c19729de860ea' },
      { page: 2, limit: 10 }
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonPayload.success, true);
    assert.equal(res.jsonPayload.code, 1);
    assert.equal(res.jsonPayload.message, 'Success');
    assert.deepEqual(res.jsonPayload.data, { id: '507f191e810c19729de860ea' });
    assert.deepEqual(res.jsonPayload.meta, { page: 2, limit: 10 });
  });

  it('should omit meta when extras are empty', () => {
    const res = createMockResponse();

    formatResponse(res, 200, 1, 'OK', { value: 1 }, {});

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonPayload.meta, undefined);
  });

  it('should build error payload using data as details', () => {
    const res = createMockResponse();

    formatResponse(res, 422, 0, 'Validation failed', { field: 'email' });

    assert.equal(res.statusCode, 422);
    assert.equal(res.jsonPayload.success, false);
    assert.equal(res.jsonPayload.code, 0);
    assert.equal(res.jsonPayload.message, 'Validation failed');
    assert.deepEqual(res.jsonPayload.details, { field: 'email' });
  });

  it('should fallback to extras as details for errors when data is null', () => {
    const res = createMockResponse();

    formatResponse(res, 400, 0, 'Bad request', null, { reason: 'missing_input' });

    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonPayload.success, false);
    assert.deepEqual(res.jsonPayload.details, { reason: 'missing_input' });
  });
});

