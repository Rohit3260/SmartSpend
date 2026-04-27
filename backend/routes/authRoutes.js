// authRoutes.js
// All routes starting with /api/auth

const express = require("express");
const router = express.Router();
const protect = require("../utils/authMiddleware");
const {
  register,
  login,
  updateProfile,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.put("/profile", protect, updateProfile);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
