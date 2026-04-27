// expenseController.js
// Handles: Get all, Add, Delete expenses

const db = require("../db");

//  GET ALL EXPENSES
async function getExpenses(req, res) {
  try {
    const userId = req.userId;

    const [rows] = await db.query(
      "SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC",
      [userId],
    );

    res.json(rows);
  } catch (err) {
    console.error("Get expenses error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

//  ADD EXPENSE
async function addExpense(req, res) {
  try {
    const userId = req.userId;
    var { amount, category, date, note } = req.body;

    amount = parseFloat(amount);

    if (!amount || amount <= 0 || !category || !date) {
      return res.status(400).json({
        message: "Enter valid amount, category and date",
      });
    }

    const nt = note || "";

    const [result] = await db.query(
      "INSERT INTO expenses (user_id, amount, category, date, note) VALUES (?, ?, ?, ?, ?)",
      [userId, amount, category, date, nt],
    );

    res.status(201).json({
      message: "Expense added",
      expense: {
        id: result.insertId,
        user_id: userId,
        amount,
        category,
        date,
        note: nt,
      },
    });
  } catch (err) {
    console.error("Add expense error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

//  DELETE EXPENSE
async function deleteExpense(req, res) {
  try {
    const userId = req.userId;
    const expenseId = req.params.id;

    const [rows] = await db.query(
      "SELECT id FROM expenses WHERE id = ? AND user_id = ?",
      [expenseId, userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await db.query("DELETE FROM expenses WHERE id = ?", [expenseId]);

    res.json({ message: "Expense deleted" });
  } catch (err) {
    console.error("Delete expense error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

module.exports = {
  getExpenses,
  addExpense,
  deleteExpense,
};
