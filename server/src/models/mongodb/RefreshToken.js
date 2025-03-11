import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  token: [{ type: String, required: true }],
  createdAt: { type: Date, default: Date.now },
});

const RefreshToken = mongoose.model("RefreshToken", RefreshTokenSchema);

export default RefreshToken;
