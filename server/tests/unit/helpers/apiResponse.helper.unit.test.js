import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildSuccessResponse,
  buildErrorResponse,
  sendOk,
  sendCreated,
} from '../../../src/helpers/apiResponse.js';
import { createMockResponse } from '../../shared/middlewareTestUtils.js';

describe('helpers/apiResponse', () => {
  it('buildSuccessResponse should include data/meta only when provided', () => {
    const withData = buildSuccessResponse({
      message: 'ok',
      data: { id: 1 },
      meta: { page: 1 },
    });
    const withoutData = buildSuccessResponse({});

    assert.equal(withData.success, true);
    assert.deepEqual(withData.data, { id: 1 });
    assert.deepEqual(withData.meta, { page: 1 });
    assert.equal(withoutData.data, undefined);
    assert.equal(withoutData.meta, undefined);
  });

  it('buildErrorResponse should include optional errorCode/details', () => {
    const response = buildErrorResponse({
      message: 'bad',
      errorCode: 'BAD_REQUEST',
      details: { field: 'email' },
    });

    assert.equal(response.success, false);
    assert.equal(response.errorCode, 'BAD_REQUEST');
    assert.deepEqual(response.details, { field: 'email' });
  });

  it('sendOk and sendCreated should set status and response body', () => {
    const okRes = createMockResponse();
    const createdRes = createMockResponse();

    sendOk(okRes, { message: 'done' });
    sendCreated(createdRes, { message: 'created' });

    assert.equal(okRes.statusCode, 200);
    assert.equal(createdRes.statusCode, 201);
    assert.equal(okRes.jsonPayload.success, true);
    assert.equal(createdRes.jsonPayload.success, true);
  });
});

