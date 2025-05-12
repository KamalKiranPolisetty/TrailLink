const Group = require("../models/Group");

const getGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("postId", "title location") // Show linked post details
      .populate("admin", "name email") // Show admin details
      .populate("members", "name email"); // Show member details

    res.status(200).json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getGroups };
