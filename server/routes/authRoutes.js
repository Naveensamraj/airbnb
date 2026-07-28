const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  validateAdminLogin,
  validateUserRegister,
  validateUserLogin,
  validateRefreshToken,
  validateUpdateProfile,
  validateChangePassword,
  validateForgotPassword,
} = require("../validators/authValidator");

const router = express.Router();

router.post("/admin/login", validateAdminLogin, authController.adminLogin);
router.post("/register", validateUserRegister, authController.register);
router.post("/login", validateUserLogin, authController.login);
router.post("/refresh", validateRefreshToken, authController.refreshToken);
router.get("/me", protect, authController.getMe);
router.put(
  "/profile",
  protect,
  validateUpdateProfile,
  authController.updateProfile,
);
router.put(
  "/change-password",
  protect,
  validateChangePassword,
  authController.changePassword,
);
router.post(
  "/forgot-password",
  validateForgotPassword,
  authController.forgotPassword,
);
router.post("/logout", protect, authController.logout);

router.get("/admin-only", protect, authorizeRoles("admin"), (req, res) => {
  res.status(200).json({ success: true, message: "Admin access granted" });
});

router.get(
  "/owner-or-tenant",
  protect,
  authorizeRoles("owner", "tenant"),
  (req, res) => {
    res.status(200).json({ success: true, message: "User access granted" });
  },
);

module.exports = router;
