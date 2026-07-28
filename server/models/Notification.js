const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: 160,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ["booking", "payment", "property", "system"],
      default: "system",
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

NotificationSchema.index({ user: 1, is_read: 1 });
NotificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);
