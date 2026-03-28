const Message = require("../models/messageModel");
const User = require("../models/userModel");
const cloudinary = require("../config/cloudinaryConfig");

const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    const usersWithUnreadCount = await Promise.all(
      filteredUsers.map(async (user) => {
        const unreadCount = await Message.countDocuments({
          senderId: user._id,
          receiverId: loggedInUserId,
          isSeen: false,
        });
        return { ...user.toObject(), unreadCount };
      })
    );

    res.status(200).json(usersWithUnreadCount);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    await Message.updateMany(
      { senderId: userToChatId, receiverId: myId, isSeen: false },
      { $set: { isSeen: true } }
    );

    // Notify the sender that their messages were read
    const { getReceiverSocketId, io } = require("../lib/socket");
    const senderSocketId = getReceiverSocketId(userToChatId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", { readerId: myId });
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { text, image, images, video, videos, audio, groupId } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!receiverId && !groupId) {
      return res.status(400).json({ error: "Receiver ID or Group ID is required" });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    let imageUrls = [];
    if (images && Array.isArray(images) && images.length > 0) {
      const uploadPromises = images.map((img) => cloudinary.uploader.upload(img));
      const uploadResponses = await Promise.all(uploadPromises);
      imageUrls = uploadResponses.map((res) => res.secure_url);
    }

    let videoUrl;
    if (video) {
        const uploadResponse = await cloudinary.uploader.upload(video, { resource_type: "video" });
        videoUrl = uploadResponse.secure_url;
    }

    let videoUrls = [];
    if (videos && Array.isArray(videos) && videos.length > 0) {
        const uploadPromises = videos.map((vid) => cloudinary.uploader.upload(vid, { resource_type: "video" }));
        const uploadResponses = await Promise.all(uploadPromises);
        videoUrls = uploadResponses.map((res) => res.secure_url);
    }

    let audioUrl;
    if (audio) {
        const uploadResponse = await cloudinary.uploader.upload(audio, { resource_type: "video" });
        audioUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId: groupId ? undefined : receiverId,
      groupId: groupId || undefined,
      text,
      image: imageUrl,
      images: imageUrls,
      video: videoUrl,
      videos: videoUrls,
      audio: audioUrl,
      seenBy: groupId ? [senderId] : [],
    });

    await newMessage.save();
    await newMessage.populate("senderId", "name pic email");

    // Update last message in Group or Conversation (if implemented)
    if (groupId) {
      const Group = require("../models/groupModel");
      await Group.findByIdAndUpdate(groupId, { lastMessage: newMessage._id });
    }

    const { getReceiverSocketId, io } = require("../lib/socket");
    
    if (groupId) {
      // Send to all members in the group room
      io.to(groupId).emit("newMessage", newMessage);
    } else {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const markMessagesAsRead = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const receiverId = req.user._id;

    await Message.updateMany(
      { senderId, receiverId, isSeen: false },
      { $set: { isSeen: true } }
    );

    // Notify the sender that their messages were read
    const { getReceiverSocketId, io } = require("../lib/socket");
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", { readerId: receiverId });
    }

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error in markMessagesAsRead: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    await Message.findByIdAndDelete(messageId);

    // Notify receiver via socket
    const { getReceiverSocketId, io } = require("../lib/socket");
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", messageId);
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error in deleteMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getUsersForSidebar, getMessages, sendMessage, markMessagesAsRead, deleteMessage };
