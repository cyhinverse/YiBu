import { Schema, model } from "mongoose";

const ProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
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
    coverPhoto: {
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
