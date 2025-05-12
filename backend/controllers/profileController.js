const mongoose = require("mongoose");
const User = require("../models/User");




const fetchUserProfile = async(req, res) => {
  const { userId } = req.params;
  try {
    // Ensure the logged-in user is accessing their own profile
    if (userId !== req.user.id) {
      console.log("Unauthorized access");
      return res.status(403).json({ error: "Not authorized to access this profile" });
    }
    // Check if the user exists
    const user = await User.findById(userId);
    if (user) {
      //console.log("User found:", user);
      res.json(user);  // Send the found user profile
    } else {
      console.log("User not found, ID:", userId);
      res.status(404).json({ error: "User not found" });  // Handle case where user is not found
    }
  } catch (err) {
    console.error("Error fetching user profile:", err);
    // Respond with more detailed error information
    if (err.name === 'CastError') {
      res.status(400).json({ error: "Invalid user ID format" });
    } else {
      res.status(500).json({ error: "Internal server error", message: err.message, stack: err.stack });
    }
  }
};



// Update user profile with PATCH (update only provided fields)
const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateFields = req.body; // Get all fields from request body
    
    // Ensure the logged-in user is updating their own profile
    if (userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to update this profile" });
    }

    // Check if userId is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // Check if the user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Validate email if provided
    if (updateFields.email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateFields.email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // Check if email is already in use by another user
      const existingEmail = await User.findOne({ 
        email: updateFields.email, 
        _id: { $ne: userId }
      });

      if (existingEmail) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    // Validate username if provided
    if (updateFields.username) {
      const existingUser = await User.findOne({ 
        username: updateFields.username, 
        _id: { $ne: userId }
      });

      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }
    }

    // Update user and return updated document
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  fetchUserProfile,
  updateUserProfile
};