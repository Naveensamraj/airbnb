const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking reference is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property reference is required"],
    },
    guest_name: {
      type: String,
      trim: true,
    },
    property_name: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "advance",
        "balance",
        "deposit",
        "refund",
        "penalty",
        "damage",
        "extra",
      ],
      default: "advance",
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Payment amount must be positive"],
    },
    method: {
      type: String,
      enum: ["cash", "upi", "bank_transfer", "credit_card", "debit_card"],
      default: "upi",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "overdue"],
      default: "pending",
    },
    receipt_number: {
      type: String,
      required: [true, "Receipt number is required"],
      unique: true,
      trim: true,
    },
    billing_period: {
      type: String,
      trim: true,
    },
    due_date: {
      type: Date,
      default: null,
    },
    paid_at: {
      type: Date,
      default: null,
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

PaymentSchema.index({ booking: 1 });
PaymentSchema.index({ property: 1 });
PaymentSchema.index({ user: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ type: 1 });
PaymentSchema.index({ billing_period: 1 });
PaymentSchema.index({ booking: 1, billing_period: 1, type: 1 });

module.exports = mongoose.model("Payment", PaymentSchema);
