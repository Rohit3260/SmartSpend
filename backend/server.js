const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// middleware
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// api routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/expenses", require("./routes/expenseRoutes"));
app.use("/api/bills", require("./routes/billRoutes"));
app.use("/api/goals", require("./routes/goalRoutes"));
app.use("/api/borrows", require("./routes/borrowRoutes"));
app.use("/api/extra-income", require("./routes/extraIncomeRoutes"));

// fallback
app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

// start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});
