const Group = require("../models/groupModel");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const cloudinary = require("../config/cloudinaryConfig");

const createGroup = async (req, res) => {
  try {
    const { groupName, members, groupIcon } = req.body;
    const admin = req.user._id;

    if (!groupName || !members || members.length < 1) {
      return res.status(400).json({ error: "Please fill all the fields" });
    }

    // Add admin to members if not already present
    const allMembers = [...new Set([...members, admin.toString()])];

    let iconUrl;
    if (groupIcon) {
      const uploadResponse = await cloudinary.uploader.upload(groupIcon);
      iconUrl = uploadResponse.secure_url;
    }

    const newGroup = new Group({
      groupName,
      members: allMembers,
      admin,
      groupIcon: iconUrl,
    });

    await newGroup.save();

    const fullGroup = await Group.findById(newGroup._id)
      .populate("members", "-password")
      .populate("admin", "-password");

    res.status(201).json(fullGroup);
  } catch (error) {
    console.error("Error in createGroup: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getGroups = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const groups = await Group.find({ members: { $in: [loggedInUserId] } })
      .populate("members", "-password")
      .populate("admin", "-password")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getGroups: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getGroupMessages = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const userId = req.user._id;

        // Check if user is member of group
        const group = await Group.findById(groupId);
        if (!group || !group.members.includes(userId)) {
            return res.status(403).json({ error: "Access denied" });
        }

        const messages = await Message.find({ groupId }).populate("senderId", "name pic email");
        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getGroupMessages: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

const updateGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { groupName, groupIcon } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Only admin can update group details" });
    }

    let iconUrl = group.groupIcon;
    if (groupIcon && groupIcon.startsWith("data:image")) {
      const uploadResponse = await cloudinary.uploader.upload(groupIcon);
      iconUrl = uploadResponse.secure_url;
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { groupName: groupName || group.groupName, groupIcon: iconUrl },
      { new: true }
    )
      .populate("members", "-password")
      .populate("admin", "-password");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in updateGroup: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { createGroup, getGroups, getGroupMessages, updateGroup };
