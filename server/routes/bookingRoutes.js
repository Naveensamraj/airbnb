const express = require("express");
const bookingController = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  validateCreateBooking,
  validateBookingId,
  validateUpdateBooking,
  validateStatusUpdate,
  validateQuery,
  validateAvailability,
} = require("../validators/bookingValidator");

const router = express.Router();

router.post(
  "/",
  protect,
  validateCreateBooking,
  bookingController.createBooking,
);
router.get("/", protect, validateQuery, bookingController.getBookings);
router.get(
  "/history",
  protect,
  validateQuery,
  bookingController.getBookingHistory,
);
router.get(
  "/availability",
  protect,
  validateAvailability,
  bookingController.checkAvailability,
);
router.get(
  "/:id",
  protect,
  validateBookingId,
  bookingController.getBookingById,
);
router.put(
  "/:id",
  protect,
  validateUpdateBooking,
  bookingController.updateBooking,
);
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  validateBookingId,
  bookingController.deleteBooking,
);
router.patch(
  "/:id/approve",
  protect,
  validateBookingId,
  bookingController.approveBooking,
);
router.patch(
  "/:id/reject",
  protect,
  validateBookingId,
  bookingController.rejectBooking,
);
router.patch(
  "/:id/cancel",
  protect,
  validateBookingId,
  bookingController.cancelBooking,
);
router.patch(
  "/:id/status",
  protect,
  validateStatusUpdate,
  bookingController.updateBookingStatus,
);

module.exports = router;
