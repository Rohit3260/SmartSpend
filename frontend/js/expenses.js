// expenses.js

var token = localStorage.getItem("token");

// Check login
if (!token) window.location.href = "index.html";

// Show user name
var user = JSON.parse(localStorage.getItem("user") || "{}");
document.getElementById("sidebarName").textContent = user.name || "User";

// Logout
document.getElementById("logoutBtn").onclick = function () {
  localStorage.clear();
  window.location.href = "index.html";
};

// Header helper
function authHeaders() {
  return { Authorization: "Bearer " + token };
}

// Alert
function showAlert(msg, type) {
  var box = document.getElementById("alertBox");
  box.textContent = msg;
  box.className = "alert " + type;
  box.style.display = "block";
  setTimeout(function () {
    box.style.display = "none";
  }, 4000);
}

// Field error
function showError(id, msg) {
  var el = document.getElementById(id);
  if (el) el.textContent = msg;
}

// Clear errors
function clearErrors() {
  document.querySelectorAll(".error").forEach(function (e) {
    e.textContent = "";
  });
}

// Format ₹
function toINR(amount) {
  return "₹" + parseFloat(amount || 0).toLocaleString("en-IN");
}

// Default date
var today = new Date().toISOString().split("T")[0];
document.getElementById("expDate").value = today;

// FETCH EXPENSES

async function getExpenses() {
  var res = await fetch(BASE_URL + "/api/expenses", {
    headers: authHeaders(),
  });
  return await res.json();
}

// RENDER TABLE

async function renderTable() {
  var expenses = await getExpenses();

  var sortBy = document.getElementById("sortBy").value;
  var tbody = document.getElementById("expenseBody");
  var table = document.getElementById("expenseTable");
  var noMsg = document.getElementById("noExpenses");

  if (!expenses || expenses.length === 0) {
    noMsg.style.display = "block";
    table.style.display = "none";
    return;
  }

  expenses.sort(function (a, b) {
    if (sortBy === "date-desc") return new Date(b.date) - new Date(a.date);
    if (sortBy === "date-asc") return new Date(a.date) - new Date(b.date);
    if (sortBy === "amount-desc") return b.amount - a.amount;
    if (sortBy === "amount-asc") return a.amount - b.amount;
  });

  var rows = "";

  for (var i = 0; i < expenses.length; i++) {
    var e = expenses[i];

    rows += "<tr>";
    rows += "<td>" + toINR(e.amount) + "</td>";
    rows += "<td>" + e.category + "</td>";
    rows += "<td>" + e.date.split("T")[0] + "</td>";
    rows += "<td>" + (e.note || "-") + "</td>";
    rows +=
      '<td><button class="btn-sm btn-danger" onclick="deleteExpense(' +
      e.id +
      ')">Delete</button></td>';
    rows += "</tr>";
  }

  tbody.innerHTML = rows;
  noMsg.style.display = "none";
  table.style.display = "table";
}

// ADD EXPENSE

document.getElementById("addExpenseBtn").onclick = async function () {
  clearErrors();

  var amount = document.getElementById("expAmount").value.trim();
  var category = document.getElementById("expCategory").value;
  var date = document.getElementById("expDate").value;
  var note = document.getElementById("expNote").value.trim();

  var hasError = false;

  if (!amount) {
    showError("amountError", "Amount required");
    hasError = true;
  }

  if (!category) {
    showError("categoryError", "Select category");
    hasError = true;
  }

  if (!date) {
    showError("dateError", "Date required");
    hasError = true;
  }

  if (hasError) return;

  var res = await fetch(BASE_URL + "/api/expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({
      amount: amount,
      category: category,
      date: date,
      note: note,
    }),
  });

  var data = await res.json();

  if (!res.ok) {
    showAlert(data.message || "Error adding expense", "error");
    return;
  }

  showAlert("Expense added!", "success");

  renderTable();

  document.getElementById("expAmount").value = "";
  document.getElementById("expCategory").value = "";
  document.getElementById("expNote").value = "";
  document.getElementById("expDate").value = today;
};

// DELETE EXPENSE

async function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;

  await fetch(BASE_URL + "/api/expenses/" + id, {
    method: "DELETE",
    headers: authHeaders(),
  });

  showAlert("Expense deleted!", "success");
  renderTable();
}

// Sort change
document.getElementById("sortBy").onchange = function () {
  renderTable();
};

// Run
renderTable();
