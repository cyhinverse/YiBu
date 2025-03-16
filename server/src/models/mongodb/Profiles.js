import { Schema, model, Types } from "mongoose";

const ProfileSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      unique: true,
    },
    avatar: {
      type: String,
      default: "https://sbcf.fr/en/default-avatar/",
    },
    bio: {
      type: String,
      default: "",
    },
    birthday: {
      type: Date,
      default: new Date(),
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
  },
  {
    timestamps: true,
    collection: "Profiles",
  }
);

export default model("Profile", ProfileSchema);
