const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },
    property_name: {
      type: String,
      required: [true, "Property name is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "maintenance",
        "electricity",
        "water",
        "cleaning",
        "repairs",
        "salary",
        "misc",
        "other",
      ],
    },
    customCategory: {
      type: String,
      default: null,
      trim: true,
    },
    custom_category: {
      type: String,
      default: null,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be non-negative"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    expense_date: {
      type: String,
      required: [true, "Expense date is required"],
    },
  },
  {
    timestamps: true,
  }
);

ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ expense_date: 1 });

module.exports = mongoose.model("Expense", ExpenseSchema);
