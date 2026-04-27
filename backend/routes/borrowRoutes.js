// borrowRoutes.js
const express = require("express");
const router = express.Router();
const protect = require("../utils/authMiddleware");
const {
  getBorrows,
  addBorrow,
  addTransaction,
  deleteTransaction,
  settleBorrow,
  unsettleBorrow,
  deleteBorrow,
} = require("../controllers/borrowController");

router.get("/", protect, getBorrows);
router.post("/", protect, addBorrow);
router.post("/:id/transactions", protect, addTransaction);
router.delete("/:id/transactions/:txnId", protect, deleteTransaction);
router.put("/:id/settle", protect, settleBorrow);
router.put("/:id/unsettle", protect, unsettleBorrow);
router.delete("/:id", protect, deleteBorrow);

module.exports = router;
