// authController.js
// Handles: Register, Login, Update Profile, Forgot Password, Reset Password

const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

//  Helper: create a JWT token for a user
function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

//  REGISTER
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required." });
    }

    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
    );

    const token = createToken(result.insertId);
    res.status(201).json({
      message: "Registered successfully!",
      token,
      user: { id: result.insertId, name, email, profile_complete: false },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error. Try again." });
  }
}

//  LOGIN
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      return res.status(400).json({ message: "Email not found." });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password." });
    }

    const token = createToken(user.id);
    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        dob: user.dob,
        city: user.city,
        profession: user.profession,
        salary: user.salary,
        profile_complete: user.profile_complete,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error. Try again." });
  }
}

//  UPDATE PROFILE
async function updateProfile(req, res) {
  try {
    const { name, phone, gender, dob, city, profession, salary } = req.body;
    const userId = req.userId;

    await db.query(
      `UPDATE users SET name=?, phone=?, gender=?, dob=?,
       city=?, profession=?, salary=?, profile_complete=TRUE WHERE id=?`,
      [name, phone, gender, dob, city, profession, salary, userId],
    );

    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
    const user = rows[0];

    res.json({
      message: "Profile updated!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        dob: user.dob,
        city: user.city,
        profession: user.profession,
        salary: user.salary,
        profile_complete: user.profile_complete,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Server error. Try again." });
  }
}

//  FORGOT PASSWORD
// FEATURES COMING SOON
async function forgotPassword(req, res) {
  return res.status(200).json({
    message: "Forgot password feature coming soon.",
  });
}
// DEV MODE
// POST /api/auth/forgot-password
// Body: { email }
// async function forgotPassword(req, res) {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ message: "Email is required." });
//     }

//     // Check if user exists
//     const [rows] = await db.query("SELECT id FROM users WHERE email = ?", [
//       email,
//     ]);
//     if (rows.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No account found with this email." });
//     }

//     // Generate short-lived reset token (15 min)
//     const resetToken = jwt.sign(
//       { id: rows[0].id, purpose: "reset" },
//       process.env.JWT_SECRET,
//       { expiresIn: "15m" },
//     );

//     // Dev mode — return link directly (no email sent)
//     const resetLink =
//       process.env.APP_URL + "/reset-password.html?token=" + resetToken;

//     res.json({
//       message: "Reset link generated! Copy the link below.",
//       resetLink: resetLink,
//     });
//   } catch (err) {
//     console.error("Forgot password error:", err);
//     res.status(500).json({ message: "Server error. Try again." });
//   }
// }

//  RESET PASSWORD
// POST /api/auth/reset-password
// Body: { token, newPassword }
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required." });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res
        .status(400)
        .json({ message: "Reset link is invalid or expired." });
    }

    // Check purpose
    if (decoded.purpose !== "reset") {
      return res.status(400).json({ message: "Invalid reset token." });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      decoded.id,
    ]);

    res.json({ message: "Password reset successfully! You can now login." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error. Try again." });
  }
}

module.exports = {
  register,
  login,
  updateProfile,
  forgotPassword,
  resetPassword,
};
