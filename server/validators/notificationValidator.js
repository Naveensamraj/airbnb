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

const validateCreateNotification = [
  body("user").optional().isMongoId().withMessage("User ID is invalid"),
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("message").trim().notEmpty().withMessage("Message is required"),
  body("type")
    .optional()
    .isIn(["booking", "payment", "property", "system"])
    .withMessage("Invalid notification type"),
  handleValidationErrors,
];

const validateNotificationId = [
  param("id").isMongoId().withMessage("Notification ID is invalid"),
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
  query("read").optional().isBoolean().withMessage("Read flag must be boolean"),
  query("type")
    .optional()
    .isIn(["booking", "payment", "property", "system"])
    .withMessage("Invalid notification type"),
  handleValidationErrors,
];

module.exports = {
  validateCreateNotification,
  validateNotificationId,
  validateQuery,
};
