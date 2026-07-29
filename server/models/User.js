const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["owner", "tenant"],
      default: "tenant",
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    alt_phone: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    postal_code: {
      type: String,
      trim: true,
    },
    emergency_contact_name: {
      type: String,
      trim: true,
    },
    emergency_contact_phone: {
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
    id_proof_file: {
      type: String,
      trim: true,
    },
    id_proof_mime_type: {
      type: String,
      trim: true,
    },
    id_proof_original_name: {
      type: String,
      trim: true,
    },
    id_proof_size: {
      type: Number,
    },
    avatar_url: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "blacklisted", "inactive"],
      default: "active",
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    guest_notes: {
      type: String,
      trim: true,
    },
    admin_notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("User", UserSchema);
