import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import ApiError from '../../../src/helpers/ApiError.js';

describe('helpers/ApiError', () => {
  it('factory methods should produce expected status code and message', () => {
    const badRequest = ApiError.badRequest('bad');
    const unauthorized = ApiError.unauthorized('unauthorized');
    const forbidden = ApiError.forbidden('forbidden');
    const notFound = ApiError.notFound('not found');
    const conflict = ApiError.conflict('conflict');
    const unsupported = ApiError.unsupportedMediaType('unsupported');
    const internal = ApiError.internal('internal');

    assert.equal(badRequest.statusCode, 400);
    assert.equal(unauthorized.statusCode, 401);
    assert.equal(forbidden.statusCode, 403);
    assert.equal(notFound.statusCode, 404);
    assert.equal(conflict.statusCode, 409);
    assert.equal(unsupported.statusCode, 415);
    assert.equal(internal.statusCode, 500);
  });
});
