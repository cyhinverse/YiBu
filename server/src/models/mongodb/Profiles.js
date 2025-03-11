import { Schema, model, Types } from "mongoose";

const ProfileSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    birthday: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    location: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "Profiles",
  }
);

export default model("Profile", ProfileSchema);
