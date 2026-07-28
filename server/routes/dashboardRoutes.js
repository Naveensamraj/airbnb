const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, dashboardController.getDashboard);
router.get("/stats", protect, dashboardController.getDashboardStats);
router.get("/revenue", protect, dashboardController.getDashboardRevenue);
router.get("/recent", protect, dashboardController.getDashboardRecent);

module.exports = router;
