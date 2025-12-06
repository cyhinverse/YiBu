import { Schema, model } from "mongoose";

const RefreshTokenSchema = new Schema({
  userId: { type: String, required: true },
  token: [{ type: String, required: true }],
  createdAt: { type: Date, default: Date.now },
});

const RefreshToken = model("RefreshToken", RefreshTokenSchema);

export default RefreshToken;
