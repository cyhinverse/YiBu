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
      default:
        "https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1",
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
    website: {
      type: String,
      default: "",
    },
    interests: {
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
