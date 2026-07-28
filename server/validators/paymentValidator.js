const { body, param, query, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors
        .array()
        .map((error) => ({ field: error.param, message: error.msg })),
    });
  }
  next();
};

const validateCreatePayment = [
  body("booking").isMongoId().withMessage("Booking ID is invalid"),
  body("amount")
    .isFloat({ min: 0 })
    .withMessage("Amount must be a positive number"),
  body("method")
    .optional()
    .isIn(["cash", "upi", "bank_transfer", "credit_card", "debit_card"])
    .withMessage("Invalid payment method"),
  body("type")
    .optional()
    .isIn([
      "advance",
      "balance",
      "deposit",
      "refund",
      "penalty",
      "damage",
      "extra",
    ])
    .withMessage("Invalid payment type"),
  body("status")
    .optional()
    .isIn(["pending", "paid", "failed", "refunded", "overdue"])
    .withMessage("Invalid payment status"),
  body("due_date")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid ISO date"),
  handleValidationErrors,
];

const validatePaymentId = [
  param("id").isMongoId().withMessage("Payment ID is invalid"),
  handleValidationErrors,
];

const validateUpdatePayment = [
  param("id").isMongoId().withMessage("Payment ID is invalid"),
  handleValidationErrors,
];

const validateQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("status")
    .optional()
    .isIn(["pending", "paid", "failed", "refunded", "overdue"])
    .withMessage("Invalid status"),
  query("method")
    .optional()
    .isIn(["cash", "upi", "bank_transfer", "credit_card", "debit_card"])
    .withMessage("Invalid method"),
  query("from")
    .optional()
    .isISO8601()
    .withMessage("From date must be a valid ISO date"),
  query("to")
    .optional()
    .isISO8601()
    .withMessage("To date must be a valid ISO date"),
  handleValidationErrors,
];

module.exports = {
  validateCreatePayment,
  validatePaymentId,
  validateUpdatePayment,
  validateQuery,
};
