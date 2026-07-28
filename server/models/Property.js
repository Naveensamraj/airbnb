const mongoose = require("mongoose");

const PropertySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Property owner is required"],
    },
    name: {
      type: String,
      required: [true, "Property name is required"],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: 1200,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: 200,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      maxlength: 250,
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
    bedrooms: {
      type: Number,
      required: [true, "Number of bedrooms is required"],
      min: [1, "Bedrooms must be at least 1"],
    },
    bathrooms: {
      type: Number,
      required: [true, "Number of bathrooms is required"],
      min: [1, "Bathrooms must be at least 1"],
    },
    daily_price: {
      type: Number,
      required: [true, "Daily price is required"],
      min: [0, "Daily price must be positive"],
    },
    weekly_price: {
      type: Number,
      required: [true, "Weekly price is required"],
      min: [0, "Weekly price must be positive"],
    },
    monthly_price: {
      type: Number,
      required: [true, "Monthly price is required"],
      min: [0, "Monthly price must be positive"],
    },
    security_deposit: {
      type: Number,
      required: [true, "Security deposit is required"],
      min: [0, "Security deposit must be positive"],
    },
    cleaning_fee: {
      type: Number,
      required: [true, "Cleaning fee is required"],
      min: [0, "Cleaning fee must be positive"],
    },
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance", "reserved"],
      default: "available",
    },
    amenities: {
      type: [String],
      default: [],
    },
    rules: {
      smoking: { type: Boolean, default: false },
      pets: { type: Boolean, default: false },
      parties: { type: Boolean, default: false },
      checkin: { type: String, trim: true, default: "2:00 PM" },
      checkout: { type: String, trim: true, default: "11:00 AM" },
    },
    cover_photo: {
      type: String,
      trim: true,
    },
    gallery: {
      type: [String],
      default: [],
    },
    is_approved: {
      type: Boolean,
      default: false,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

PropertySchema.index({ status: 1 });
PropertySchema.index({ owner: 1 });
PropertySchema.index({ is_deleted: 1 });
PropertySchema.index({ is_approved: 1 });
PropertySchema.index({
  location: "text",
  name: "text",
  description: "text",
  address: "text",
});

module.exports = mongoose.model("Property", PropertySchema);
