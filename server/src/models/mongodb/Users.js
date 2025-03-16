import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    },
    followers: {
      type: Array,
      default: [],
      ref: "User",
    },
    following: {
      type: Array,
      default: [],
      ref: "User",
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    profile: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
      unique: true,
    },
  },
  {
    timestamps: true,
    collection: "Users",
  }
);

export default model("User", UserSchema);
