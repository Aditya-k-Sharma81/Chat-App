const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getUsersForSidebar,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
} = require("../controllers/messageController");

const router = express.Router();

router.get("/users", protect, getUsersForSidebar);
router.get("/:id", protect, getMessages);
router.post("/send/:id", protect, sendMessage);
router.put("/read/:id", protect, markMessagesAsRead);
router.delete("/:id", protect, deleteMessage);

module.exports = router;
