// billRoutes.js
const express = require("express");
const router = express.Router();
const protect = require("../utils/authMiddleware");
const {
  getBills,
  addBill,
  updateBill,
  deleteBill,
} = require("../controllers/billController");

router.get("/", protect, getBills);
router.post("/", protect, addBill);
router.put("/:id", protect, updateBill);
router.delete("/:id", protect, deleteBill);

module.exports = router;
