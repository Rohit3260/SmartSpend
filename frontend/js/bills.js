// bills.js

var token = localStorage.getItem("token");
var today = new Date().toISOString().split("T")[0];

// Check login
if (!token) window.location.href = "index.html";

// Show user name
var user = JSON.parse(localStorage.getItem("user") || "{}");
var sidebarName = document.getElementById("sidebarName");
if (sidebarName) sidebarName.textContent = user.name || "User";

// Logout
var logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.onclick = function () {
    localStorage.clear();
    window.location.href = "index.html";
  };
}

// Set default due date
var dueInput = document.getElementById("billDueDate");
if (dueInput) dueInput.value = today;

// Headers helpers
function authHeaders() {
  return { Authorization: "Bearer " + token };
}
function jsonHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  };
}

// Show alert
function showAlert(msg, type) {
  var box = document.getElementById("alertBox");
  if (!box) return;

  box.textContent = msg;
  box.className = "alert " + (type || "error");
  box.style.display = "block";

  setTimeout(function () {
    box.style.display = "none";
  }, 4000);
}

// Show field error
function showError(id, msg) {
  var el = document.getElementById(id);
  if (el) el.textContent = msg;
}

// Clear all errors
function clearErrors() {
  var list = document.querySelectorAll(".error");
  for (var i = 0; i < list.length; i++) {
    list[i].textContent = "";
  }
}

// Format ₹
function toINR(amount) {
  return "₹" + parseFloat(amount || 0).toLocaleString("en-IN");
}

// Format date
function formatDate(dateStr) {
  var d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

//  Render table
function renderTable(bills) {
  var filterEl = document.getElementById("filterBills");
  var tbody = document.getElementById("billBody");
  var table = document.getElementById("billTable");
  var noMsg = document.getElementById("noBills");

  if (!filterEl || !tbody || !table || !noMsg) return;

  var filter = filterEl.value;
  var filtered = bills;

  if (filter === "paid") {
    filtered = bills.filter(function (b) {
      return b.paid;
    });
  }

  if (filter === "unpaid") {
    filtered = bills.filter(function (b) {
      return !b.paid;
    });
  }

  if (filtered.length === 0) {
    noMsg.style.display = "block";
    table.style.display = "none";
    return;
  }

  filtered.sort(function (a, b) {
    if (a.paid !== b.paid) return a.paid ? 1 : -1;
    return new Date(a.due_date) - new Date(b.due_date);
  });

  var rows = "";

  for (var i = 0; i < filtered.length; i++) {
    var bill = filtered[i];

    var overdue = !bill.paid && new Date(bill.due_date) < new Date();

    var badge = "";
    if (bill.paid) badge = '<span class="badge paid">✅ Paid</span>';
    else if (overdue) badge = '<span class="badge overdue">⚠️ Overdue</span>';
    else badge = '<span class="badge unpaid">🕐 Unpaid</span>';

    var payBtn = bill.paid
      ? '<button onclick="markUnpaid(' + bill.id + ')">Unpaid</button>'
      : '<button onclick="markPaid(' + bill.id + ')">Paid</button>';

    rows += "<tr" + (overdue ? ' class="row-overdue"' : "") + ">";
    rows += "<td>" + bill.name + "</td>";
    rows += "<td>" + toINR(bill.amount) + "</td>";
    rows += "<td>" + bill.category + "</td>";
    rows += "<td>" + formatDate(bill.due_date) + "</td>";
    rows += "<td>" + (bill.recurring || "-") + "</td>";
    rows += "<td>" + (bill.note || "-") + "</td>";
    rows += "<td>" + badge + "</td>";
    rows +=
      "<td>" +
      payBtn +
      ' <button onclick="deleteBill(' +
      bill.id +
      ')">Delete</button></td>';
    rows += "</tr>";
  }

  tbody.innerHTML = rows;
  noMsg.style.display = "none";
  table.style.display = "table";
}

//  Load bills
async function loadBills() {
  try {
    var res = await fetch(BASE_URL + "/api/bills", {
      headers: authHeaders(),
    });

    var data = await res.json();

    if (res.ok) renderTable(data);
    else showAlert(data.message || "Could not load bills");
  } catch (err) {
    showAlert("Server error.");
  }
}

//  Mark paid
async function markPaid(id) {
  try {
    var res = await fetch(BASE_URL + "/api/bills/" + id, {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify({ paid: true }),
    });

    if (res.ok) {
      showAlert("Bill marked paid!", "success");
      loadBills();
    }
  } catch (err) {
    showAlert("Server error.");
  }
}

//  Mark unpaid
async function markUnpaid(id) {
  try {
    var res = await fetch(BASE_URL + "/api/bills/" + id, {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify({ paid: false }),
    });

    if (res.ok) {
      showAlert("Bill marked unpaid!", "success");
      loadBills();
    }
  } catch (err) {
    showAlert("Server error.");
  }
}

//  Delete
async function deleteBill(id) {
  if (!confirm("Delete this bill?")) return;

  try {
    var res = await fetch(BASE_URL + "/api/bills/" + id, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (res.ok) {
      showAlert("Deleted!", "success");
      loadBills();
    }
  } catch (err) {
    showAlert("Server error.");
  }
}

//  Add bill
var addBtn = document.getElementById("addBillBtn");

if (addBtn) {
  addBtn.onclick = async function () {
    clearErrors();

    var name = document.getElementById("billName").value.trim();
    var amount = document.getElementById("billAmount").value.trim();
    var category = document.getElementById("billCategory").value;
    var dueDate = document.getElementById("billDueDate").value;
    var recurring = document.getElementById("billRecurring").value;
    var note = document.getElementById("billNote").value.trim();

    var hasError = false;

    if (!name) {
      showError("nameError", "Required");
      hasError = true;
    }
    if (!amount) {
      showError("amountError", "Required");
      hasError = true;
    }
    if (!category) {
      showError("categoryError", "Required");
      hasError = true;
    }
    if (!dueDate) {
      showError("dueDateError", "Required");
      hasError = true;
    }

    if (hasError) return;

    try {
      var res = await fetch(BASE_URL + "/api/bills", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
          name: name,
          amount: parseFloat(amount),
          category: category,
          due_date: dueDate,
          recurring: recurring,
          note: note,
        }),
      });

      if (res.ok) {
        showAlert("Bill added!", "success");
        loadBills();
      }
    } catch (err) {
      showAlert("Server error.");
    }
  };
}

// Filter
var filterEl = document.getElementById("filterBills");
if (filterEl) {
  filterEl.onchange = function () {
    loadBills();
  };
}

// Start
loadBills();
