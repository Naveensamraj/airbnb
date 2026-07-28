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

const validateCreateBooking = [
  body("property").isMongoId().withMessage("Property ID is invalid"),
  body("check_in")
    .isISO8601()
    .withMessage("Check-in date must be a valid ISO date"),
  body("check_out")
    .isISO8601()
    .withMessage("Check-out date must be a valid ISO date"),
  body("num_guests")
    .isInt({ min: 1 })
    .withMessage("Number of guests must be at least 1"),
  body("total_amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Total amount must be a positive number"),
  body("advance_paid")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Advance paid must be a positive number"),
  handleValidationErrors,
];

const validateBookingId = [
  param("id").isMongoId().withMessage("Booking ID is invalid"),
  handleValidationErrors,
];

const validateUpdateBooking = [
  param("id").isMongoId().withMessage("Booking ID is invalid"),
  handleValidationErrors,
];

const validateStatusUpdate = [
  param("id").isMongoId().withMessage("Booking ID is invalid"),
  body("status")
    .optional()
    .isIn([
      "pending",
      "approved",
      "rejected",
      "active",
      "completed",
      "cancelled",
    ])
    .withMessage("Invalid booking status"),
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
    .isIn([
      "pending",
      "approved",
      "rejected",
      "active",
      "completed",
      "cancelled",
    ])
    .withMessage("Invalid status"),
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

const validateAvailability = [
  query("property").isMongoId().withMessage("Property ID is invalid"),
  query("from").isISO8601().withMessage("From date must be a valid ISO date"),
  query("to").isISO8601().withMessage("To date must be a valid ISO date"),
  handleValidationErrors,
];

module.exports = {
  validateCreateBooking,
  validateBookingId,
  validateUpdateBooking,
  validateStatusUpdate,
  validateQuery,
  validateAvailability,
};
