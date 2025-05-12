const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  if (!req.session || !req.session.jwt) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(req.session.jwt, process.env.JWT_SECRET);
    req.user = decoded; 
    console.log("Authenticated User:", req.user); // 🔍 Debugging
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};


module.exports = authMiddleware;
