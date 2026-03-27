const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { createGroup, getGroups, getGroupMessages, updateGroup, deleteGroup, leaveGroup } = require("../controllers/groupController");

const router = express.Router();

router.post("/create", protect, createGroup);
router.get("/", protect, getGroups);
router.get("/:id", protect, getGroupMessages);
router.put("/:id/update", protect, updateGroup);
router.delete("/:id", protect, deleteGroup);
router.post("/:id/leave", protect, leaveGroup);

module.exports = router;
