const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { getGroupMessages, sendMessage } = require("../controllers/chatController");


// Import Controllers
const {
  fetchUserProfile, updateUserProfile
} = require("../controllers/profileController");
const {changePassword} = require("../controllers/changePassword");
const { registerUser,checkEmailExists } = require("../controllers/registerUser");
const { loginUser, logoutUser } = require("../controllers/loginUser");
const { createPost,joinPost, getPosts, deletePost, leavePost,getPostInfo, editPost } = require("../controllers/postController");
const {  getGroups } = require("../controllers/groupController");

// ✅ Test Route
router.get("/ping", (req, res) => {
  res.json({ message: "Pong!" });
});

// ✅ User Authentication Routes
router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

// ✅ Post Routes
router.post("/posts/createPost", authMiddleware, createPost); // Create post
router.patch("/posts/edit/:postId", authMiddleware, editPost); 
router.get("/posts/listPosts", getPosts); // Get all posts

router.delete("/posts/delete/:postId", authMiddleware, deletePost); // Delete post
router.post("/posts/leave/:postId", authMiddleware, leavePost); // Leave post
router.post("/posts/join/:postId", authMiddleware, joinPost); // Join a post

router.get("/check-email", checkEmailExists);//check if email exists
router.get("/groups/listGroups", getGroups); // Get all groups

//✅updateProfile
router.get("/profile/:userId", authMiddleware, fetchUserProfile); // Get user profile
router.patch("/profile/update/:userId", authMiddleware, updateUserProfile);


// ✅ Chat Routes
router.get("/chat/:groupId", authMiddleware, getGroupMessages);  // Get messages for a group
router.post("/chat/:groupId", authMiddleware, sendMessage);      // Send a message to a group

router.patch('/change-password', authMiddleware, changePassword);
router.get("/postinfo/:postId", getPostInfo);//Get Post Info

// ✅ Chat Routes
router.get("/chat/:groupId", authMiddleware, getGroupMessages);  // Get messages for a group
router.post("/chat/:groupId", authMiddleware, sendMessage);      // Send a message to a group


module.exports = router;
