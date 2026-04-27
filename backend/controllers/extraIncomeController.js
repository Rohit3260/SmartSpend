// extraIncomeController.js

const db = require("../db");

//  GET ALL
async function getAll(req, res) {
  try {
    const userId = req.userId;

    const [rows] = await db.query(
      "SELECT * FROM extra_income WHERE user_id = ? ORDER BY date DESC",
      [userId],
    );

    res.json(rows);
  } catch (err) {
    console.error("Get income error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

//  ADD
async function addOne(req, res) {
  try {
    const userId = req.userId;
    var { title, amount, source, date, note } = req.body;

    amount = parseFloat(amount);

    if (!title || !amount || amount <= 0 || !source || !date) {
      return res.status(400).json({
        message: "Enter valid title, amount, source and date",
      });
    }

    const nt = note || "";

    const [result] = await db.query(
      "INSERT INTO extra_income (user_id, title, amount, source, date, note) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, title, amount, source, date, nt],
    );

    res.status(201).json({
      message: "Income added",
      income: {
        id: result.insertId,
        user_id: userId,
        title,
        amount,
        source,
        date,
        note: nt,
      },
    });
  } catch (err) {
    console.error("Add income error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

//  DELETE
async function deleteOne(req, res) {
  try {
    const userId = req.userId;
    const id = req.params.id;

    const [rows] = await db.query(
      "SELECT id FROM extra_income WHERE id = ? AND user_id = ?",
      [id, userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Income not found" });
    }

    await db.query("DELETE FROM extra_income WHERE id = ?", [id]);

    res.json({ message: "Income deleted" });
  } catch (err) {
    console.error("Delete income error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

module.exports = {
  getAll,
  addOne,
  deleteOne,
};
