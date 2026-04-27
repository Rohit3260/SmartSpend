// income.js

var token = localStorage.getItem("token");
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

function authHeaders() {
  return { Authorization: "Bearer " + token };
}

function toINR(amount) {
  return "₹" + parseFloat(amount || 0).toLocaleString("en-IN");
}

// Alert
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

// Field error
function showError(id, msg) {
  var el = document.getElementById(id);
  if (el) el.textContent = msg;
}

// Clear errors
function clearErrors() {
  var list = document.querySelectorAll(".error");
  for (var i = 0; i < list.length; i++) {
    list[i].textContent = "";
  }
}

// Default date
var today = new Date().toISOString().split("T")[0];
var dateInput = document.getElementById("incDate");
if (dateInput) dateInput.value = today;

//  FETCH
async function getIncome() {
  try {
    var res = await fetch(BASE_URL + "/api/extra-income", {
      headers: authHeaders(),
    });
    return await res.json();
  } catch (err) {
    showAlert("Failed to load income");
    return [];
  }
}

//  RENDER
async function renderTable() {
  var incomes = await getIncome();

  var sortEl = document.getElementById("sortBy");
  var tbody = document.getElementById("incomeBody");
  var table = document.getElementById("incomeTable");
  var noMsg = document.getElementById("noIncome");

  if (!sortEl || !tbody || !table || !noMsg) return;

  var sortBy = sortEl.value;

  // Summary cards
  var total = 0;
  var thisMonth = 0;
  var now = new Date();

  for (var i = 0; i < incomes.length; i++) {
    var amt = parseFloat(incomes[i].amount || 0);
    total += amt;

    var d = new Date(incomes[i].date);

    if (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    ) {
      thisMonth += amt;
    }
  }

  var t1 = document.getElementById("totalIncome");
  var t2 = document.getElementById("monthIncome");
  var t3 = document.getElementById("totalEntries");

  if (t1) t1.textContent = toINR(total);
  if (t2) t2.textContent = toINR(thisMonth);
  if (t3) t3.textContent = incomes.length;

  if (!incomes || incomes.length === 0) {
    noMsg.style.display = "block";
    table.style.display = "none";
    return;
  }

  // Sort
  incomes.sort(function (a, b) {
    if (sortBy === "date-desc") return new Date(b.date) - new Date(a.date);
    if (sortBy === "date-asc") return new Date(a.date) - new Date(b.date);
    if (sortBy === "amount-desc") return b.amount - a.amount;
    if (sortBy === "amount-asc") return a.amount - b.amount;
  });

  var rows = "";

  for (var i = 0; i < incomes.length; i++) {
    var inc = incomes[i];

    rows += "<tr>";
    rows += "<td>" + (inc.title || "-") + "</td>";
    rows += "<td>" + toINR(inc.amount) + "</td>";
    rows += "<td>" + (inc.source || "-") + "</td>";
    rows += "<td>" + (inc.date ? inc.date.split("T")[0] : "-") + "</td>";
    rows += '<td class="hide-mobile">' + (inc.note || "-") + "</td>";
    rows +=
      '<td><button class="btn-sm btn-danger" onclick="deleteIncome(' +
      inc.id +
      ')">Delete</button></td>';
    rows += "</tr>";
  }

  tbody.innerHTML = rows;
  noMsg.style.display = "none";
  table.style.display = "table";
}

//  ADD
var addBtn = document.getElementById("addIncomeBtn");

if (addBtn) {
  addBtn.onclick = async function () {
    clearErrors();

    var title = document.getElementById("incTitle").value.trim();
    var amount = document.getElementById("incAmount").value.trim();
    var source = document.getElementById("incSource").value;
    var date = document.getElementById("incDate").value;
    var note = document.getElementById("incNote").value.trim();

    var hasError = false;

    if (!title) {
      showError("titleError", "Required");
      hasError = true;
    }
    if (!amount) {
      showError("amountError", "Required");
      hasError = true;
    }
    if (!source) {
      showError("sourceError", "Required");
      hasError = true;
    }
    if (!date) {
      showError("dateError", "Required");
      hasError = true;
    }

    if (hasError) return;

    try {
      var res = await fetch(BASE_URL + "/api/extra-income", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          title: title,
          amount: parseFloat(amount),
          source: source,
          date: date,
          note: note,
        }),
      });

      var data = await res.json();

      if (!res.ok) {
        showAlert(data.message || "Error adding income", "error");
        return;
      }

      showAlert("Income added!", "success");
      renderTable();

      document.getElementById("incTitle").value = "";
      document.getElementById("incAmount").value = "";
      document.getElementById("incSource").value = "";
      document.getElementById("incNote").value = "";
      document.getElementById("incDate").value = today;
    } catch (err) {
      showAlert("Server error");
    }
  };
}

//  DELETE
async function deleteIncome(id) {
  if (!confirm("Delete this income entry?")) return;

  try {
    await fetch(BASE_URL + "/api/extra-income/" + id, {
      method: "DELETE",
      headers: authHeaders(),
    });

    showAlert("Income deleted!", "success");
    renderTable();
  } catch (err) {
    showAlert("Server error");
  }
}

// Sort
var sortEl = document.getElementById("sortBy");
if (sortEl) {
  sortEl.onchange = function () {
    renderTable();
  };
}

// START
renderTable();
