const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true }, // Group where message is sent
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // User who sent message
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
