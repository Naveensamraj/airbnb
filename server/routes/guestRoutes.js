const express = require("express");
const guestController = require("../controllers/guestController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, guestController.getGuests);
router.get("/:id", protect, guestController.getGuestById);
router.post("/", protect, guestController.createGuest);
router.put("/:id", protect, guestController.updateGuest);
router.patch("/:id/blacklist", protect, guestController.toggleBlacklist);
router.delete("/:id", protect, guestController.deleteGuest);

module.exports = router;
