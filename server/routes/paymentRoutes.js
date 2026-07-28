const express = require("express");
const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  validateCreatePayment,
  validatePaymentId,
  validateUpdatePayment,
  validateQuery,
} = require("../validators/paymentValidator");

const router = express.Router();

router.post(
  "/",
  protect,
  validateCreatePayment,
  paymentController.createPayment,
);
router.get("/", protect, validateQuery, paymentController.getPayments);
router.get(
  "/history",
  protect,
  validateQuery,
  paymentController.getPaymentHistory,
);
router.get("/revenue", protect, paymentController.getRevenue);
router.get("/outstanding", protect, paymentController.getOutstanding);
router.get(
  "/:id",
  protect,
  validatePaymentId,
  paymentController.getPaymentById,
);
router.put(
  "/:id",
  protect,
  validateUpdatePayment,
  paymentController.updatePayment,
);
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  validatePaymentId,
  paymentController.deletePayment,
);

module.exports = router;
