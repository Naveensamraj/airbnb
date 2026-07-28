const { body, validationResult } = require("express-validator");

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

const validateAdminLogin = [
  body("email").isEmail().withMessage("A valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  handleValidationErrors,
];

const validateUserRegister = [
  body("full_name").trim().notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("A valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("role")
    .optional()
    .isIn(["owner", "tenant"])
    .withMessage("Role must be owner or tenant"),
  handleValidationErrors,
];

const validateUserLogin = [
  body("email").isEmail().withMessage("A valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

const validateRefreshToken = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
  handleValidationErrors,
];

const validateUpdateProfile = [
  body("full_name")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Full name must be at least 2 characters"),
  body("email").optional().isEmail().withMessage("A valid email is required"),
  body("phone")
    .optional()
    .trim()
    .isLength({ min: 5 })
    .withMessage("Phone number is too short"),
  body("address")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Address is too short"),
  body("avatar_url").optional().isURL().withMessage("Avatar URL must be valid"),
  handleValidationErrors,
];

const validateChangePassword = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters"),
  handleValidationErrors,
];

const validateForgotPassword = [
  body("email").isEmail().withMessage("A valid email is required"),
  body("accountType")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Account type must be user or admin"),
  handleValidationErrors,
];

module.exports = {
  validateAdminLogin,
  validateUserRegister,
  validateUserLogin,
  validateRefreshToken,
  validateUpdateProfile,
  validateChangePassword,
  validateForgotPassword,
};
