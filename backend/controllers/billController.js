// billController.js

const db = require("../db");

//  GET ALL BILLS
async function getBills(req, res) {
  try {
    const userId = req.userId;

    const [rows] = await db.query(
      "SELECT * FROM bills WHERE user_id = ? ORDER BY due_date ASC",
      [userId],
    );

    res.json(rows);
  } catch (err) {
    console.error("Get bills error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

//  ADD BILL
async function addBill(req, res) {
  try {
    const userId = req.userId;
    const { name, amount, category, due_date, recurring, note } = req.body;

    if (!name || !amount || !category || !due_date) {
      return res.status(400).json({
        message: "Name, amount, category and due date are required",
      });
    }

    const rec = recurring || "none";
    const nt = note || "";

    const [result] = await db.query(
      "INSERT INTO bills (user_id, name, amount, category, due_date, recurring, note) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, name, amount, category, due_date, rec, nt],
    );

    res.status(201).json({
      message: "Bill added",
      bill: {
        id: result.insertId,
        user_id: userId,
        name,
        amount,
        category,
        due_date,
        recurring: rec,
        note: nt,
        paid: false,
      },
    });
  } catch (err) {
    console.error("Add bill error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

//  UPDATE BILL
async function updateBill(req, res) {
  try {
    const userId = req.userId;
    const billId = req.params.id;

    const paid =
      req.body.paid === true || req.body.paid === "true" || req.body.paid === 1;

    // Check bill exists
    const [rows] = await db.query(
      "SELECT * FROM bills WHERE id = ? AND user_id = ?",
      [billId, userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const bill = rows[0];

    // Update paid status
    await db.query("UPDATE bills SET paid = ? WHERE id = ?", [paid, billId]);

    //  MARK AS PAID
    if (paid) {
      const noteKey = "bill_expense_" + billId;

      // prevent duplicate expense
      const [existing] = await db.query(
        "SELECT id FROM expenses WHERE user_id = ? AND note = ?",
        [userId, noteKey],
      );

      if (existing.length === 0) {
        await db.query(
          "INSERT INTO expenses (user_id, amount, category, date, note) VALUES (?, ?, ?, CURDATE(), ?)",
          [userId, bill.amount, "Bills", noteKey],
        );
      }

      return res.json({
        message: "Bill marked as paid",
      });
    }

    //  MARK AS UNPAID
    await db.query("DELETE FROM expenses WHERE user_id = ? AND note = ?", [
      userId,
      "bill_expense_" + billId,
    ]);

    return res.json({
      message: "Bill marked as unpaid",
    });
  } catch (err) {
    console.error("Update bill error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

//  DELETE BILL
async function deleteBill(req, res) {
  try {
    const userId = req.userId;
    const billId = req.params.id;

    const [rows] = await db.query(
      "SELECT * FROM bills WHERE id = ? AND user_id = ?",
      [billId, userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const bill = rows[0];

    // remove linked expense if exists
    if (bill.paid) {
      await db.query("DELETE FROM expenses WHERE user_id = ? AND note = ?", [
        userId,
        "bill_expense_" + billId,
      ]);
    }

    await db.query("DELETE FROM bills WHERE id = ?", [billId]);

    res.json({ message: "Bill deleted" });
  } catch (err) {
    console.error("Delete bill error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

module.exports = {
  getBills,
  addBill,
  updateBill,
  deleteBill,
};
