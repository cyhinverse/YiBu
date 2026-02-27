import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import Joi from 'joi';
import {
  validateBody,
  validateParams,
  validateQuery,
  validate,
} from '../../../src/middlewares/validation.middleware.js';
import { runMiddleware } from '../../shared/middlewareTestUtils.js';

describe('validation.middleware', () => {
  it('validateBody should strip unknown keys and pass valid payload', async () => {
    const middleware = validateBody(
      Joi.object({
        name: Joi.string().required(),
      })
    );

    const req = {
      body: {
        name: 'Cyhin',
        extra: 'remove-me',
      },
    };

    const error = await runMiddleware(middleware, req, {});

    assert.equal(error, undefined);
    assert.deepEqual(req.body, { name: 'Cyhin' });
  });

  it('validateParams should return ApiError for invalid params', async () => {
    const middleware = validateParams(
      Joi.object({
        id: Joi.string().length(24).required(),
      })
    );

    const req = {
      params: {
        id: 'short-id',
      },
    };

    const error = await runMiddleware(middleware, req, {});

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Invalid request params');
    assert.equal(error.errorCode, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(error.details));
    assert.equal(error.details[0].field, 'id');
  });

  it('validateQuery should coerce query values and strip unknown keys', async () => {
    const middleware = validateQuery(
      Joi.object({
        page: Joi.number().integer().min(1).default(1),
      })
    );

    const req = {
      query: {
        page: '2',
        ignored: 'x',
      },
    };

    const error = await runMiddleware(middleware, req, {});

    assert.equal(error, undefined);
    assert.deepEqual(req.query, { page: 2 });
  });

  it('validateQuery should return ApiError for invalid query payload', async () => {
    const middleware = validateQuery(
      Joi.object({
        page: Joi.number().integer().min(1).required(),
      })
    );

    const req = {
      query: {
        page: '0',
      },
    };

    const error = await runMiddleware(middleware, req, {});

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Invalid request query');
    assert.equal(error.errorCode, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(error.details));
    assert.equal(error.details[0].field, 'page');
  });

  it('validateParams should pass and normalize valid params', async () => {
    const middleware = validateParams(
      Joi.object({
        id: Joi.string().length(24).required(),
      })
    );

    const req = {
      params: {
        id: '507f191e810c19729de860ea',
      },
    };

    const error = await runMiddleware(middleware, req, {});

    assert.equal(error, undefined);
    assert.deepEqual(req.params, { id: '507f191e810c19729de860ea' });
  });

  it('validate should pass when all inputs are valid', async () => {
    const middleware = validate({
      body: Joi.object({ name: Joi.string().required() }),
      params: Joi.object({ id: Joi.string().length(24).required() }),
      query: Joi.object({ page: Joi.number().integer().min(1).required() }),
    });

    const req = {
      body: { name: 'Cyhin', ignored: 'x' },
      params: { id: '507f191e810c19729de860ea' },
      query: { page: '3', extra: 'remove' },
    };

    const error = await runMiddleware(middleware, req, {});

    assert.equal(error, undefined);
    assert.deepEqual(req.body, { name: 'Cyhin' });
    assert.deepEqual(req.params, { id: '507f191e810c19729de860ea' });
    assert.deepEqual(req.query, { page: 3 });
  });

  it('validateBody should handle schema errors without Joi details', async () => {
    const middleware = validateBody({
      validate() {
        return { error: { message: 'custom validation failed' } };
      },
    });

    const req = { body: { any: 'value' } };
    const error = await runMiddleware(middleware, req, {});

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Invalid request body');
    assert.equal(error.errorCode, 'VALIDATION_ERROR');
    assert.deepEqual(error.details, []);
  });

  it('validate should aggregate body/params/query validation errors with location', async () => {
    const middleware = validate({
      body: Joi.object({ name: Joi.string().required() }),
      params: Joi.object({ id: Joi.string().length(24).required() }),
      query: Joi.object({ page: Joi.number().integer().min(1).required() }),
    });

    const req = {
      body: {},
      params: { id: 'invalid' },
      query: {},
    };

    const error = await runMiddleware(middleware, req, {});

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, 'Invalid request data');
    assert.equal(error.errorCode, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(error.details));
    assert.ok(error.details.some(detail => detail.location === 'body'));
    assert.ok(error.details.some(detail => detail.location === 'params'));
    assert.ok(error.details.some(detail => detail.location === 'query'));
  });
});

