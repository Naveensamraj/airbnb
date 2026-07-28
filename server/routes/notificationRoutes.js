const express = require("express");
const notificationController = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");
const {
  validateCreateNotification,
  validateNotificationId,
  validateQuery,
} = require("../validators/notificationValidator");

const router = express.Router();

router.get(
  "/",
  protect,
  validateQuery,
  notificationController.getNotifications,
);
router.post(
  "/",
  protect,
  validateCreateNotification,
  notificationController.createNotification,
);
router.patch(
  "/:id/read",
  protect,
  validateNotificationId,
  notificationController.markAsRead,
);
router.patch("/read-all", protect, notificationController.markAllAsRead);
router.delete(
  "/:id",
  protect,
  validateNotificationId,
  notificationController.deleteNotification,
);
router.get("/unread-count", protect, notificationController.getUnreadCount);

module.exports = router;
