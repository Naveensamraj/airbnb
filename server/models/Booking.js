const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property reference is required"],
    },
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Guest reference is required"],
    },
    property_name: {
      type: String,
      required: true,
      trim: true,
    },
    property_cover: {
      type: String,
      trim: true,
    },
    guest_name: {
      type: String,
      required: true,
      trim: true,
    },
    guest_email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    guest_phone: {
      type: String,
      trim: true,
    },
    check_in: {
      type: Date,
      required: [true, "Check-in date is required"],
    },
    check_out: {
      type: Date,
      required: [true, "Check-out date is required"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "active",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    total_amount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount must be positive"],
    },
    advance_paid: {
      type: Number,
      required: [true, "Advance payment is required"],
      min: [0, "Advance paid must be positive"],
      default: 0,
    },
    balance_due: {
      type: Number,
      required: [true, "Balance due is required"],
      min: [0, "Balance due must be positive"],
      default: 0,
    },
    num_guests: {
      type: Number,
      required: [true, "Number of guests is required"],
      min: [1, "There must be at least one guest"],
    },
    vehicle_number: {
      type: String,
      trim: true,
    },
    id_proof_type: {
      type: String,
      trim: true,
    },
    id_proof_number: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

BookingSchema.index({ property: 1 });
BookingSchema.index({ guest: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ check_in: 1, check_out: 1 });

module.exports = mongoose.model("Booking", BookingSchema);
