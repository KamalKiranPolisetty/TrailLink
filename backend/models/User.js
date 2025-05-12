const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    bio: { type: String, default: "", trim: true },
    profileImage: {
      type: String,
      default:
        "../../assets/images/profilePic.png",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
