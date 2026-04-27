// expenseRoutes.js
// All routes starting with /api/expenses
// All are protected — user must be logged in

const express = require("express");
const router = express.Router();
const protect = require("../utils/authMiddleware");
const {
  getExpenses,
  addExpense,
  deleteExpense,
} = require("../controllers/expenseController");

router.get("/", protect, getExpenses);
router.post("/", protect, addExpense);
router.delete("/:id", protect, deleteExpense);

module.exports = router;
