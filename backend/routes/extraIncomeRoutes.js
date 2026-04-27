// extraIncomeRoutes.js
const express = require("express");
const router = express.Router();
const protect = require("../utils/authMiddleware");
const {
  getAll,
  addOne,
  deleteOne,
} = require("../controllers/extraIncomeController");

router.get("/", protect, getAll);
router.post("/", protect, addOne);
router.delete("/:id", protect, deleteOne);

module.exports = router;
