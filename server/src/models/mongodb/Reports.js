import mongoose from "mongoose";
const { Schema } = mongoose;

const ReportSchema = new Schema({
  reporter: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reportType: {
    type: String,
    enum: ["post", "comment", "user"],
    required: true,
  },
  targetId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  additionalInfo: {
    type: String,
    default: "",
  },
  content: {
    type: String,
    default: "",
  },
  parentPostId: {
    type: Schema.Types.ObjectId,
    ref: "Post",
    default: null,
  },
  status: {
    type: String,
    enum: ["pending", "resolved", "dismissed", "escalated"],
    default: "pending",
  },
  actions: [
    {
      type: {
        type: String,
        enum: ["review", "resolve", "dismiss", "escalate", "comment"],
        required: true,
      },
      admin: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      time: {
        type: Date,
        default: Date.now,
      },
      comment: {
        type: String,
        default: "",
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
ReportSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for reference to the target based on type
ReportSchema.virtual("targetRef").get(function () {
  switch (this.reportType) {
    case "post":
      return "Post";
    case "comment":
      return "Comment";
    case "user":
      return "User";
    default:
      return null;
  }
});

const Report = mongoose.model("Report", ReportSchema);

export default Report;
