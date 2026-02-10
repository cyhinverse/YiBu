import { Schema, Types, model } from "mongoose";
import { hashRefreshToken } from "../utils/refreshTokenHash.js";

/**
 * RefreshToken Model - Optimized for secure token management
 *
 * Features:
 * 1. One token per device (not array)
 * 2. Automatic expiration via TTL
 * 3. Device tracking for security
 * 4. Token rotation support
 */
const RefreshTokenSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Token family for rotation detection
    family: {
      type: String,
      required: true,
      index: true,
    },

    // Device information
    device: {
      id: { type: String },
      name: { type: String },
      type: { type: String, enum: ["mobile", "tablet", "desktop", "unknown"] },
      browser: { type: String },
      os: { type: String },
      ip: { type: String },
    },

    // Is this token revoked?
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },

    revokedReason: {
      type: String,
      default: null,
    },


    // When was it last used?
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },

    // Automatic expiration (30 days)
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      // index: true, // Defined in explicit index below with expireAfterSeconds
    },
  },
  {
    timestamps: true,
    collection: "RefreshTokens",
  }
);

// ============ INDEXES ============
// Primary lookups
// RefreshTokenSchema.index({ token: 1 }, { unique: true }); // Already defined in schema
RefreshTokenSchema.index({ user: 1, isRevoked: 1 });
RefreshTokenSchema.index({ family: 1, isRevoked: 1 });

// TTL index - automatically delete expired tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Device lookup
RefreshTokenSchema.index({ user: 1, "device.id": 1 });

// ============ STATICS ============
RefreshTokenSchema.statics.createToken = async function (data) {
  const { user, token, family, device } = data;
  const tokenHash = hashRefreshToken(token);

  // Invalidate existing token for same device if exists
  if (device?.id) {
    await this.updateMany(
      { user, "device.id": device.id, isRevoked: false },
      { $set: { isRevoked: true, revokedReason: 'new_device_token' } }
    );
  }


  return this.create({
    user,
    token: tokenHash,
    family: family || tokenHash, // Use token hash as family if not provided
    device,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
};

RefreshTokenSchema.statics.verifyAndRotate = async function (token, newToken) {
  const tokenHash = hashRefreshToken(token);
  const newTokenHash = hashRefreshToken(newToken);

  // Prefer hashed lookup; fall back to legacy plaintext tokens for backward compatibility.
  let existingToken = await this.findOne({ token: tokenHash, isRevoked: false });
  const matchedLegacyPlaintext = !existingToken;
  if (!existingToken) {
    existingToken = await this.findOne({ token, isRevoked: false });
  }

  if (!existingToken) {
    // Token not found or invalid - possible token reuse attack
    // Invalidate entire family
    const stolenToken = (await this.findOne({ token: tokenHash })) || (await this.findOne({ token }));
    if (stolenToken) {
      await this.updateMany(
        { family: stolenToken.family },
        { $set: { isRevoked: true, revokedReason: 'token_reuse_detected' } }
      );
    }
    return { success: false, error: "Invalid token", compromised: true };
  }

  // Check if expired
  if (existingToken.expiresAt < new Date()) {
    if (matchedLegacyPlaintext && existingToken.token === token) {
      existingToken.token = tokenHash;
    }
    existingToken.isRevoked = true;
    existingToken.revokedReason = 'expired';
    await existingToken.save();
    return { success: false, error: "Token expired" };
  }

  // Invalidate current token
  existingToken.isRevoked = true;
  existingToken.revokedReason = 'rotated';
  if (matchedLegacyPlaintext && existingToken.token === token) {
    existingToken.token = tokenHash;
  }
  await existingToken.save();


  // Create new token in same family
  const newRefreshToken = await this.create({
    user: existingToken.user,
    token: newTokenHash,
    family: existingToken.family,
    device: existingToken.device,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return {
    success: true,
    userId: existingToken.user,
    newToken: newRefreshToken,
  };
};

RefreshTokenSchema.statics.revokeToken = async function (token) {
  const tokenHash = hashRefreshToken(token);
  return this.updateOne(
    { token: { $in: [token, tokenHash] } },
    { $set: { isRevoked: true, revokedReason: 'manual' } }
  );
};

RefreshTokenSchema.statics.revokeAllForUser = async function (
  userId,
  exceptToken = null
) {
  const query = { user: userId, isRevoked: false };
  if (exceptToken) {
    const exceptHash = hashRefreshToken(exceptToken);
    query.token = { $nin: [exceptToken, exceptHash] };
  }
  return this.updateMany(
    query,
    { $set: { isRevoked: true, revokedReason: 'bulk_revoke' } }
  );
};

RefreshTokenSchema.statics.revokeFamily = async function (family) {
  return this.updateMany(
    { family, isRevoked: false },
    { $set: { isRevoked: true, revokedReason: 'family_revoke' } }
  );
};

RefreshTokenSchema.statics.getActiveSessions = async function (userId) {
  return this.find({ user: userId, isRevoked: false })
    .select("device lastUsedAt createdAt")
    .sort({ lastUsedAt: -1 })
    .lean();
};


RefreshTokenSchema.statics.updateLastUsed = async function (token) {
  const tokenHash = hashRefreshToken(token);
  return this.updateOne({ token: { $in: [token, tokenHash] } }, { $set: { lastUsedAt: new Date() } });
};

const RefreshToken = model("RefreshToken", RefreshTokenSchema);
export default RefreshToken;
