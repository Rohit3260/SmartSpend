// goalController.js
// Handles: Get all, Add, Add money, Delete goals

const db = require("../db");

//  GET ALL GOALS
async function getGoals(req, res) {
  try {
    const userId = req.userId;

    const [rows] = await db.query(
      "SELECT * FROM goals WHERE user_id = ? ORDER BY date DESC",
      [userId],
    );

    res.json(rows);
  } catch (err) {
    console.error("Get goals error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

//  ADD GOAL
async function addGoal(req, res) {
  try {
    const userId = req.userId;
    var { name, target, saved, deadline, note } = req.body;

    target = parseFloat(target);
    saved = parseFloat(saved || 0);

    if (!name || !target || target <= 0) {
      return res.status(400).json({
        message: "Enter valid name and target",
      });
    }

    const today = new Date().toISOString().split("T")[0];

    const [result] = await db.query(
      "INSERT INTO goals (user_id, name, target, saved, deadline, note, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, name, target, saved, deadline || null, note || "", today],
    );

    res.status(201).json({
      message: "Goal added",
      goal: {
        id: result.insertId,
        user_id: userId,
        name,
        target,
        saved,
        deadline,
        note: note || "",
        date: today,
      },
    });
  } catch (err) {
    console.error("Add goal error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

//  ADD MONEY TO GOAL
async function addMoneyToGoal(req, res) {
  try {
    const userId = req.userId;
    const goalId = req.params.id;
    var { amount } = req.body;

    amount = parseFloat(amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Enter valid amount" });
    }

    const [rows] = await db.query(
      "SELECT * FROM goals WHERE id = ? AND user_id = ?",
      [goalId, userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Goal not found" });
    }

    const goal = rows[0];

    const target = parseFloat(goal.target);
    const saved = parseFloat(goal.saved || 0);
    const remaining = target - saved;

    if (remaining <= 0) {
      return res.json({ message: "Goal already completed" });
    }

    var addAmount = amount;
    if (addAmount > remaining) addAmount = remaining;

    const newSaved = saved + addAmount;

    await db.query("UPDATE goals SET saved = ? WHERE id = ?", [
      newSaved,
      goalId,
    ]);

    res.json({
      message: addAmount < amount ? "Amount adjusted" : "Amount added",
      saved: newSaved,
    });
  } catch (err) {
    console.error("Add money error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

//  DELETE GOAL
async function deleteGoal(req, res) {
  try {
    const userId = req.userId;
    const goalId = req.params.id;

    const [rows] = await db.query(
      "SELECT id FROM goals WHERE id = ? AND user_id = ?",
      [goalId, userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Goal not found" });
    }

    await db.query("DELETE FROM goals WHERE id = ?", [goalId]);

    res.json({ message: "Goal deleted" });
  } catch (err) {
    console.error("Delete goal error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

module.exports = {
  getGoals,
  addGoal,
  addMoneyToGoal,
  deleteGoal,
};
