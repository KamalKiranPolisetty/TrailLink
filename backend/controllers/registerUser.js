const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Function to check if email exists
const checkEmailExists = async (req, res) => {
  const { email } = req.query; // Get the email from query parameters
  try {
    // Check if the email already exists in the database
    const user = await User.findOne({ email });
    if (user) {
      return res.json({ exists: true }); // If the user exists, return exists: true
    } else {
      return res.json({ exists: false }); // If no user is found, return exists: false
    }
  } catch (err) {
    console.error('Error checking email:', err);
    return res.status(500).json({ message: 'Server error' }); // Server error
  }
};


const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Please fill in all fields" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      passwordHash: hashedPassword, // Store hashed password directly
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  registerUser,
  checkEmailExists,
};
