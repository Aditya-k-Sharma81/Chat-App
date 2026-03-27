const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false, // Made optional for group messages
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: false, // Required only for group messages
    },
    text: {
        type: String,
    },
    image: {
        type: String,
    },
    images: {
        type: [String],
        default: [],
    },
    video: {
        type: String,
    },
    videos: {
        type: [String],
        default: [],
    },
    audio: {
        type: String,
    },
    isSeen: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
