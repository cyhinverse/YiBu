import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "https://via.placeholder.com/150" },
    profile: { type: Schema.Types.ObjectId, ref: "Profile" },
  },
  {
    collection: "Users",
    timestamps: true,
  }
);

export const User = model("User", UserSchema);
export default User;
