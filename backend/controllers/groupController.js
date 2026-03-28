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

    // Create system message
    const systemMessage = new Message({
      senderId: admin,
      groupId: newGroup._id,
      text: `${req.user.name} created the group "${groupName}"`,
      messageType: "system",
    });
    await systemMessage.save();

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

    const groupsWithUnreadCount = await Promise.all(
      groups.map(async (group) => {
        const unreadCount = await Message.countDocuments({
          groupId: group._id,
          seenBy: { $ne: loggedInUserId },
          senderId: { $ne: loggedInUserId },
        });
        return { ...group.toObject(), unreadCount };
      })
    );

    res.status(200).json(groupsWithUnreadCount);
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

        // Mark messages as seen
        await Message.updateMany(
            { groupId, seenBy: { $ne: userId }, senderId: { $ne: userId } },
            { $push: { seenBy: userId } }
        );

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

    // Create system message for name change
    if (groupName && groupName !== group.groupName) {
        const systemMessage = new Message({
          senderId: userId,
          groupId: groupId,
          text: `${req.user.name} changed the group name to "${groupName}"`,
          messageType: "system",
        });
        await systemMessage.save();
        const { io } = require("../lib/socket");
        io.to(groupId).emit("newMessage", systemMessage);
    }

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in updateGroup: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Only admin can delete the group" });
    }

    // Delete all messages in the group
    await Message.deleteMany({ groupId });

    // Delete the group
    await Group.findByIdAndDelete(groupId);

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error in deleteGroup: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Remove user from members
    group.members = group.members.filter((m) => m.toString() !== userId.toString());

    // If no members left, delete the group
    if (group.members.length === 0) {
      await Message.deleteMany({ groupId });
      await Group.findByIdAndDelete(groupId);
      return res.status(200).json({ message: "Group left and deleted (last member)" });
    }

    // If leaving user was admin, assign a new admin
    if (group.admin.toString() === userId.toString()) {
      group.admin = group.members[0]; // Promote the next member
    }

    await group.save();

    // Create system message
    const systemMessage = new Message({
      senderId: userId,
      groupId: groupId,
      text: `${req.user.name} left the group`,
      messageType: "system",
    });
    await systemMessage.save();
    
    // Emit via socket
    const { io } = require("../lib/socket");
    io.to(groupId).emit("newMessage", systemMessage);

    const fullGroup = await Group.findById(groupId)
      .populate("members", "-password")
      .populate("admin", "-password");

    res.status(200).json(fullGroup);
  } catch (error) {
    console.error("Error in leaveGroup: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { createGroup, getGroups, getGroupMessages, updateGroup, deleteGroup, leaveGroup };
