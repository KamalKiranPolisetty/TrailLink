
const Message = require("../models/Message")

const activeUsers = {}; // In-memory user map

const setupSocket = (io) => {
  console.log("✅ Socket.IO initialized");

  io.on("connection", (socket) => {
    console.log("🔌 A user connected:", socket.id);

    socket.on("joinGroup", ({ groupId, userId }) => {
      socket.join(groupId);
      activeUsers[userId] = socket.id;
      console.log(`👥 User ${userId} joined group ${groupId}`);
    });

    socket.on("sendMessage", async ({ groupId, senderId, content }) => {
      console.log("📨 Received sendMessage from client:", {
        groupId,
        senderId,
        content,
      });

      try {
        const message = await new Message({ groupId, senderId, content }).save();
        console.log("✅ Message saved:", message);

        const populatedMessage = await Message.findById(message._id)
          .populate("senderId", "name");

        console.log("👤 Populated sender:", populatedMessage.senderId);

        io.in(groupId).emit("receiveMessage", {
            _id: populatedMessage._id,
            sender: {
              _id: populatedMessage.senderId._id,
              name: populatedMessage.senderId.name,
            },
            content: populatedMessage.content,
            timestamp: populatedMessage.createdAt, // ✅ MUST BE a valid ISO date
          });

        console.log("📡 Message broadcasted to group:", groupId);
      } catch (error) {
        console.error("❌ Error saving or broadcasting message:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 A user disconnected:", socket.id);
      Object.keys(activeUsers).forEach((userId) => {
        if (activeUsers[userId] === socket.id) {
          console.log(`🧹 Removing user ${userId} from activeUsers`);
          delete activeUsers[userId];
        }
      });
    });

    
  });
};

module.exports = setupSocket;
