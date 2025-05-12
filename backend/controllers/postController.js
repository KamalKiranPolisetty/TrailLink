const Post = require("../models/Post");
const Group = require("../models/Group");
const mongoose = require("mongoose");


const createPost = async (req, res) => {
  const { title, description, location, image, eventDate } = req.body; // ✅ include it here
  const userId = req.user.id;

  if (!title || !description || !location || !eventDate) {
    return res.status(400).json({ error: "All fields are required including event date" });
  }

  try {
    const post = new Post({
      title,
      description,
      location,
      image,
      eventDate, // ✅ this now has a value
      createdBy: userId,
      members: [userId],
    });

    await post.save();

    const group = new Group({
      postId: post._id,
      groupName: `${title} - Trekking Group`,
      members: [userId],
      admin: userId,
    });

    await group.save();

    post.groupId = group._id;
    await post.save();

    res.status(201).json({ message: "Post created successfully", post, group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const editPost = async (req, res) => {
  const { postId } = req.params;
  const { title, description, location, image } = req.body;
  const userId = req.user.id;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if the user is the creator/admin of the post
    if (post.createdBy.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized: Only the post creator can edit this post" });
    }

    // Update the post fields
    post.title = title || post.title;
    post.description = description || post.description;
    post.location = location || post.location;
    if (image) post.image = image;

    await post.save();

    // Update group name to match post title
    const group = await Group.findById(post.groupId);
    if (group && title) {
      group.groupName = `${title} - Trekking Group`;
      await group.save();
    }

    res.status(200).json({ message: "Post updated successfully", post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const joinPost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if the user is already a member
    if (post.members.includes(userId)) {
      return res.status(400).json({ error: "You are already in this group" });
    }

    // Add user to post members
    post.members.push(userId);
    await post.save();

    // Add user to group members
    const group = await Group.findById(post.groupId);
    if (group) {
      group.members.push(userId);
      await group.save();
    }

    res.status(200).json({ message: "Joined post successfully", groupId: group._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("createdBy", "name email")
      .populate("groupId");

    // Optionally ensure all posts include eventDate in formatted form
    const postsWithEventDate = posts.map(post => ({
      ...post.toObject(),
      eventDate: post.eventDate, // ISO string format
    }));

    res.status(200).json(postsWithEventDate);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Server error" });
  }
};



//get post info
const getPostInfo = async (req, res) => {
  try {
    const { postId } = req.params;
    console.log("🔍 getPostInfo CALLED!", postId);

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: "Invalid post ID format" });
    }

    const postInfo = await Post.findById(postId)
      .populate("createdBy", "name email")
      .populate("members", "name email");

    if (!postInfo) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Convert to plain object and include eventDate explicitly
    const responsePost = {
      ...postInfo.toObject(),
      eventDate: postInfo.eventDate, // Optional if you want to ensure visibility
    };

    res.status(200).json(responsePost);
  } catch (error) {
    console.error("Error fetching post info:", error);
    res.status(500).json({ error: "Server error" });
  }
};





// ✅ DELETE Post (Admin Only)
const deletePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.createdBy.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized: Only the post creator can delete this post" });
    }

    await Group.findByIdAndDelete(post.groupId);
    await Post.findByIdAndDelete(postId);

    res.status(200).json({ message: "Post and associated group deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ LEAVE Post
const leavePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const group = await Group.findById(post.groupId);
    if (!group) {
      return res.status(404).json({ error: "Associated group not found" });
    }

    if (!post.members.includes(userId)) {
      return res.status(400).json({ error: "You are not a member of this post" });
    }

    if (post.createdBy.toString() === userId) {
      return deletePost(req, res); // Call deletePost if admin leaves
    }

    post.members = post.members.filter(member => member.toString() !== userId);
    await post.save();

    group.members = group.members.filter(member => member.toString() !== userId);
    await group.save();

    res.status(200).json({ message: "You have left the post and group successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ EXPORT ALL FUNCTIONS CORRECTLY
module.exports = { createPost, getPosts, joinPost, deletePost, leavePost,getPostInfo, editPost };
