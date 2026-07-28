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

const validateCreateProperty = [
  body("name").trim().notEmpty().withMessage("Property name is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("address").trim().notEmpty().withMessage("Address is required"),
  body("capacity").isInt({ min: 1 }).withMessage("Capacity must be at least 1"),
  body("bedrooms").isInt({ min: 1 }).withMessage("Bedrooms must be at least 1"),
  body("bathrooms")
    .isInt({ min: 1 })
    .withMessage("Bathrooms must be at least 1"),
  body("daily_price")
    .isFloat({ min: 0 })
    .withMessage("Daily price must be a positive number"),
  body("weekly_price")
    .isFloat({ min: 0 })
    .withMessage("Weekly price must be a positive number"),
  body("monthly_price")
    .isFloat({ min: 0 })
    .withMessage("Monthly price must be a positive number"),
  body("security_deposit")
    .isFloat({ min: 0 })
    .withMessage("Security deposit must be a positive number"),
  body("cleaning_fee")
    .isFloat({ min: 0 })
    .withMessage("Cleaning fee must be a positive number"),
  handleValidationErrors,
];

const validateUpdateProperty = [
  param("id").isMongoId().withMessage("Property ID is invalid"),
  handleValidationErrors,
];

const validatePropertyId = [
  param("id").isMongoId().withMessage("Property ID is invalid"),
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
    .isIn(["available", "occupied", "maintenance", "reserved"])
    .withMessage("Invalid status"),
  handleValidationErrors,
];

const validateStatusUpdate = [
  param("id").isMongoId().withMessage("Property ID is invalid"),
  body("status")
    .isIn(["available", "occupied", "maintenance", "reserved"])
    .withMessage("Invalid status"),
  handleValidationErrors,
];

const validateApproval = [
  param("id").isMongoId().withMessage("Property ID is invalid"),
  body("approved").isBoolean().withMessage("approved must be boolean"),
  handleValidationErrors,
];

module.exports = {
  validateCreateProperty,
  validateUpdateProperty,
  validatePropertyId,
  validateQuery,
  validateStatusUpdate,
  validateApproval,
};
