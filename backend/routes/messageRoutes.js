const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getUsersForSidebar,
  getMessages,
  sendMessage,
} = require("../controllers/messageController");

const router = express.Router();

router.get("/users", protect, getUsersForSidebar);
router.get("/:id", protect, getMessages);
router.post("/send/:id", protect, sendMessage);

module.exports = router;
