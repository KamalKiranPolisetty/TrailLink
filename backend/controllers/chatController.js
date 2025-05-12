const Message = require("../models/Message");

// 🔹 GET /api/chat/:groupId - fetch all messages in a group
const getGroupMessages = async (req, res) => {
  const { groupId } = req.params;

  try {
    const messages = await Message.find({ groupId })
  .sort({ createdAt: 1 })
  .populate("senderId", "name");

const formattedMessages = messages.map((msg) => ({
  _id: msg._id,
  content: msg.content,
  createdAt: msg.createdAt,
  sender: {
    _id: msg.senderId._id,
    name: msg.senderId.name,
  }
}));

res.status(200).json(formattedMessages);


  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// 🔹 POST /api/chat/:groupId - send a message (optional: fallback if socket is down)
const sendMessage = async (req, res) => {
  const { groupId } = req.params;
  const { content } = req.body;
  const senderId = req.user.id;

  if (!content || !groupId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const message = new Message({ groupId, senderId, content });
    await message.save();

    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

module.exports = { getGroupMessages, sendMessage };
