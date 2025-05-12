const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const http = require("http");
const { Server } = require("socket.io");
const setupSocket = require("./controllers/socketHandler");

// Load environment variables
dotenv.config();



// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: "*", // or your frontend URL
  credentials: true,
}));


app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// API routes
const apiRoutes = require("./routes/api");
app.use("/api", apiRoutes);

// Simple test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO instance
const io = new Server(server, {
  cors: {
    origin: "*", // change this to your frontend
    credentials: true,
  },
});

// Setup socket handling
setupSocket(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
