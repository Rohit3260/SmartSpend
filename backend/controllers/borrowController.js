// borrowController.js

const db = require("../db");

//  GET BORROWS
async function getBorrows(req, res) {
  try {
    const userId = req.userId;

    const [rows] = await db.query(
      `
      SELECT 
        b.*,
        t.id as txn_id,
        t.amount as txn_amount,
        t.date as txn_date
      FROM borrows b
      LEFT JOIN borrow_transactions t 
      ON b.id = t.borrow_id
      WHERE b.user_id = ?
      ORDER BY b.date DESC
      `,
      [userId],
    );

    var map = {};

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];

      if (!map[r.id]) {
        map[r.id] = {
          id: r.id,
          user_id: r.user_id,
          person: r.person,
          amount: r.amount,
          type: r.type,
          due_date: r.due_date,
          note: r.note,
          date: r.date,
          settled: r.settled == 1,
          transactions: [],
        };
      }

      if (r.txn_id) {
        map[r.id].transactions.push({
          id: r.txn_id,
          amount: r.txn_amount,
          date: r.txn_date,
        });
      }
    }

    res.json(Object.values(map));
  } catch (err) {
    console.error("Get borrows error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

//  ADD BORROW
async function addBorrow(req, res) {
  try {
    const userId = req.userId;
    var { person, amount, type, due_date, note } = req.body;

    if (!person || !amount || !type) {
      return res.status(400).json({ message: "Enter all required fields" });
    }

    type = (type || "").toLowerCase();

    if (type !== "lent" && type !== "borrowed") {
      return res.status(400).json({ message: "Invalid type" });
    }

    const today = new Date().toISOString().split("T")[0];

    const [result] = await db.query(
      "INSERT INTO borrows (user_id, person, amount, type, due_date, note, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        userId,
        person,
        parseFloat(amount),
        type,
        due_date || null,
        note || "",
        today,
      ],
    );

    res.status(201).json({
      message: "Record added",
      borrow: {
        id: result.insertId,
        user_id: userId,
        person,
        amount,
        type,
        due_date,
        note,
        date: today,
        settled: false,
        transactions: [],
      },
    });
  } catch (err) {
    console.error("Add borrow error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

//  ADD TRANSACTION
async function addTransaction(req, res) {
  try {
    const userId = req.userId;
    const borrowId = req.params.id;
    var { amount } = req.body;

    amount = parseFloat(amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Enter valid amount" });
    }

    const [rows] = await db.query(
      "SELECT * FROM borrows WHERE id = ? AND user_id = ?",
      [borrowId, userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    const borrow = rows[0];

    const [txns] = await db.query(
      "SELECT SUM(amount) as total FROM borrow_transactions WHERE borrow_id = ?",
      [borrowId],
    );

    const alreadyReturned = parseFloat(txns[0].total || 0);
    const totalAmount = parseFloat(borrow.amount);
    const remaining = totalAmount - alreadyReturned;

    if (remaining <= 0) {
      return res.json({ message: "Already fully settled" });
    }

    if (amount > remaining) amount = remaining;

    const today = new Date().toISOString().split("T")[0];

    const [result] = await db.query(
      "INSERT INTO borrow_transactions (borrow_id, amount, date) VALUES (?, ?, ?)",
      [borrowId, amount, today],
    );

    var newTotal = alreadyReturned + amount;
    var settled = false;

    if (newTotal >= totalAmount) {
      await db.query("UPDATE borrows SET settled = TRUE WHERE id = ?", [
        borrowId,
      ]);
      settled = true;
    }

    res.status(201).json({
      message: settled ? "Fully settled" : "Transaction added",
      transaction: {
        id: result.insertId,
        borrow_id: borrowId,
        amount,
        date: today,
      },
      settled,
    });
  } catch (err) {
    console.error("Add transaction error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

//  DELETE TRANSACTION
async function deleteTransaction(req, res) {
  try {
    const userId = req.userId;
    const borrowId = req.params.id;
    const txnId = req.params.txnId;

    const [rows] = await db.query(
      "SELECT * FROM borrows WHERE id = ? AND user_id = ?",
      [borrowId, userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    await db.query(
      "DELETE FROM borrow_transactions WHERE id = ? AND borrow_id = ?",
      [txnId, borrowId],
    );

    // recalc settled
    const [txns] = await db.query(
      "SELECT SUM(amount) as total FROM borrow_transactions WHERE borrow_id = ?",
      [borrowId],
    );

    const returned = parseFloat(txns[0].total || 0);
    const total = parseFloat(rows[0].amount);

    await db.query("UPDATE borrows SET settled = ? WHERE id = ?", [
      returned >= total,
      borrowId,
    ]);

    res.json({ message: "Transaction deleted" });
  } catch (err) {
    console.error("Delete transaction error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

//  SETTLE
async function settleBorrow(req, res) {
  try {
    const userId = req.userId;
    const borrowId = req.params.id;

    const [rows] = await db.query(
      "SELECT * FROM borrows WHERE id = ? AND user_id = ?",
      [borrowId, userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    const borrow = rows[0];

    const [txns] = await db.query(
      "SELECT SUM(amount) as total FROM borrow_transactions WHERE borrow_id = ?",
      [borrowId],
    );

    const returned = parseFloat(txns[0].total || 0);
    const remaining = parseFloat(borrow.amount) - returned;

    if (remaining > 0) {
      const today = new Date().toISOString().split("T")[0];

      await db.query(
        "INSERT INTO borrow_transactions (borrow_id, amount, date) VALUES (?, ?, ?)",
        [borrowId, remaining, today],
      );
    }

    await db.query("UPDATE borrows SET settled = TRUE WHERE id = ?", [
      borrowId,
    ]);

    res.json({ message: "Marked as settled" });
  } catch (err) {
    console.error("Settle error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

//  UNSETTLE
async function unsettleBorrow(req, res) {
  try {
    const userId = req.userId;
    const borrowId = req.params.id;

    const [rows] = await db.query(
      "SELECT id FROM borrows WHERE id = ? AND user_id = ?",
      [borrowId, userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    await db.query("UPDATE borrows SET settled = FALSE WHERE id = ?", [
      borrowId,
    ]);

    res.json({ message: "Marked as pending" });
  } catch (err) {
    console.error("Unsettle error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

//  DELETE BORROW
async function deleteBorrow(req, res) {
  try {
    const userId = req.userId;
    const borrowId = req.params.id;

    const [rows] = await db.query(
      "SELECT id FROM borrows WHERE id = ? AND user_id = ?",
      [borrowId, userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    // delete transactions first
    await db.query("DELETE FROM borrow_transactions WHERE borrow_id = ?", [
      borrowId,
    ]);

    await db.query("DELETE FROM borrows WHERE id = ?", [borrowId]);

    res.json({ message: "Record deleted" });
  } catch (err) {
    console.error("Delete borrow error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

module.exports = {
  getBorrows,
  addBorrow,
  addTransaction,
  deleteTransaction,
  settleBorrow,
  unsettleBorrow,
  deleteBorrow,
};
