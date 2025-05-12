const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true }, // Linked Post
    groupName: { type: String, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Members of the group
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Group Admin
  },
  { timestamps: true }
);

module.exports = mongoose.model("Group", groupSchema);
