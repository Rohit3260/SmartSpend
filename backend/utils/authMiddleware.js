// authMiddleware.js

const jwt = require("jsonwebtoken");
require("dotenv").config();

function protect(req, res, next) {
  const authHeader = req.headers["authorization"];

  // Check header exists
  if (!authHeader) {
    return res.status(401).json({ message: "No token" });
  }

  // Check Bearer format
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Invalid token format" });
  }

  // Extract token
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Save user id
    req.userId = decoded.id;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid" });
  }
}

module.exports = protect;
