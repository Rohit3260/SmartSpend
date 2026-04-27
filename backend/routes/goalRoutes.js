// goalRoutes.js
const express = require("express");
const router = express.Router();
const protect = require("../utils/authMiddleware");
const {
  getGoals,
  addGoal,
  addMoneyToGoal,
  deleteGoal,
} = require("../controllers/goalController");

router.get("/", protect, getGoals);
router.post("/", protect, addGoal);
router.put("/:id/add", protect, addMoneyToGoal);
router.delete("/:id", protect, deleteGoal);

module.exports = router;
