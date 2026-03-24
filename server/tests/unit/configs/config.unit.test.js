import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

const CONFIG_MODULE_URL = new URL('../../../src/configs/config.js', import.meta.url);
const ORIGINAL_ENV = { ...process.env };

const importFreshConfig = async () =>
  import(`${CONFIG_MODULE_URL.href}?t=${Date.now()}-${Math.random()}`);

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) {
      delete process.env[key];
    }
  }

  Object.assign(process.env, ORIGINAL_ENV);
});

describe('configs/config', () => {
  it('should parse production env values and normalize repeated origins', async () => {
    Object.assign(process.env, {
      NODE_ENV: 'production',
      PORT: '0',
      TRUST_PROXY: '3',
      DEBUG_MODE: 'true',
      CLIENT_URL: 'https://app.example.com',
      CORS_ORIGINS:
        'https://app.example.com, https://api.example.com,https://app.example.com',
      ACCESS_TOKEN_SECRET: 'AbCdEfGhIjKlMnOpQrStUvWxYz123456',
      REFRESH_TOKEN_SECRET: 'ZyXwVuTsRqPoNmLkJiHgFeDcBa654321',
      EMAIL_PORT: '0',
    });

    const { default: config } = await importFreshConfig();

    assert.equal(config.env, 'production');
    assert.equal(config.isProduction, true);
    assert.equal(config.port, 1);
    assert.equal(config.trustProxy, 3);
    assert.equal(config.debugMode, true);
    assert.equal(config.CLIENT_URL, 'https://app.example.com');
    assert.deepEqual(config.cors.origins, [
      'https://app.example.com',
      'https://api.example.com',
    ]);
    assert.equal(config.email.port, 1);
  });

  it('validateCriticalConfig should be a no-op outside production', async () => {
    Object.assign(process.env, {
      NODE_ENV: 'development',
      ACCESS_TOKEN_SECRET: '',
      REFRESH_TOKEN_SECRET: '',
    });

    const { default: config } = await importFreshConfig();

    assert.doesNotThrow(() => config.validateCriticalConfig());
    assert.equal(config.trustProxy, false);
  });

  it('validateCriticalConfig should reject missing, short, and insecure secrets in production', async () => {
    Object.assign(process.env, {
      NODE_ENV: 'production',
      ACCESS_TOKEN_SECRET: '',
      REFRESH_TOKEN_SECRET: 'AbCdEfGhIjKlMnOpQrStUvWxYz654321',
    });

    let config = (await importFreshConfig()).default;
    assert.throws(
      () => config.validateCriticalConfig(),
      /ACCESS_TOKEN_SECRET is required in production/
    );

    process.env.ACCESS_TOKEN_SECRET = 'too-short';
    config = (await importFreshConfig()).default;
    assert.throws(
      () => config.validateCriticalConfig(),
      /ACCESS_TOKEN_SECRET must be at least 32 characters/
    );

    process.env.ACCESS_TOKEN_SECRET =
      'your_access_token_secret_here_change_in_production';
    config = (await importFreshConfig()).default;
    assert.throws(
      () => config.validateCriticalConfig(),
      /ACCESS_TOKEN_SECRET uses an insecure default value/
    );
  });

  it('validateCriticalConfig should warn when a production secret has low entropy', async () => {
    const originalWarn = console.warn;
    const warnings = [];

    console.warn = message => {
      warnings.push(message);
    };

    Object.assign(process.env, {
      NODE_ENV: 'production',
      ACCESS_TOKEN_SECRET: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      REFRESH_TOKEN_SECRET: 'AbCdEfGhIjKlMnOpQrStUvWxYz654321',
      TRUST_PROXY: 'true',
    });

    try {
      const { default: config } = await importFreshConfig();

      assert.doesNotThrow(() => config.validateCriticalConfig());
      assert.equal(config.trustProxy, true);
      assert.equal(warnings.length, 1);
      assert.match(warnings[0], /ACCESS_TOKEN_SECRET has low entropy/);
    } finally {
      console.warn = originalWarn;
    }
  });
});
