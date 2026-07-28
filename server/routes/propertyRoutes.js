const express = require("express");
const propertyController = require("../controllers/propertyController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  validateCreateProperty,
  validateUpdateProperty,
  validatePropertyId,
  validateQuery,
  validateStatusUpdate,
  validateApproval,
} = require("../validators/propertyValidator");

const router = express.Router();

router.post(
  "/",
  protect,
  validateCreateProperty,
  propertyController.createProperty,
);
router.get("/", protect, validateQuery, propertyController.getProperties);
router.get(
  "/:id",
  protect,
  validatePropertyId,
  propertyController.getPropertyById,
);
router.put(
  "/:id",
  protect,
  validateUpdateProperty,
  propertyController.updateProperty,
);
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  validatePropertyId,
  propertyController.deleteProperty,
);
router.patch(
  "/:id/status",
  protect,
  validateStatusUpdate,
  propertyController.updateStatus,
);
router.patch(
  "/:id/approve",
  protect,
  authorizeRoles("admin"),
  validateApproval,
  propertyController.approveProperty,
);
router.post(
  "/:id/images",
  protect,
  validatePropertyId,
  propertyController.uploadMiddleware,
  propertyController.uploadImages,
);

module.exports = router;
