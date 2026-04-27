// reports.js

var token = localStorage.getItem("token");
if (!token) window.location.href = "index.html";

var user = JSON.parse(localStorage.getItem("user") || "{}");

// Sidebar
var sidebarName = document.getElementById("sidebarName");
if (sidebarName) sidebarName.textContent = user.name || "User";

// Logout
function doLogout() {
  localStorage.clear();
  window.location.href = "index.html";
}

var logoutBtn = document.getElementById("logoutBtnDesktop");
if (logoutBtn) logoutBtn.onclick = doLogout;

// Headers
function authHeaders() {
  return { Authorization: "Bearer " + token };
}

// Alert
function showAlert(msg, type) {
  var box = document.getElementById("alertBox");
  if (!box) return;

  box.textContent = msg;
  box.className = "alert " + (type || "error");
  box.classList.remove("hidden");

  setTimeout(function () {
    box.classList.add("hidden");
  }, 3000);
}

// Format date
function formatDate(d) {
  if (!d) return "-";
  try {
    return d.split("T")[0];
  } catch {
    return d;
  }
}

//  FETCH
async function fetchAll() {
  try {
    var res = await Promise.all([
      fetch(BASE_URL + "/api/extra-income", { headers: authHeaders() }),
      fetch(BASE_URL + "/api/expenses", { headers: authHeaders() }),
      fetch(BASE_URL + "/api/bills", { headers: authHeaders() }),
      fetch(BASE_URL + "/api/goals", { headers: authHeaders() }),
      fetch(BASE_URL + "/api/borrows", { headers: authHeaders() }),
    ]);

    return {
      income: await res[0].json(),
      expenses: await res[1].json(),
      bills: await res[2].json(),
      goals: await res[3].json(),
      borrows: await res[4].json(),
    };
  } catch (err) {
    showAlert("Server error");
    return null;
  }
}

//  BUILD DATA

function getIncomeRows(data) {
  var rows = [["Title", "Amount", "Source", "Date"]];
  for (var i = 0; i < data.length; i++) {
    var e = data[i];
    rows.push([e.title, e.amount, e.source, formatDate(e.date)]);
  }
  return rows;
}

function getExpenseRows(data) {
  var rows = [["Amount", "Category", "Date"]];
  for (var i = 0; i < data.length; i++) {
    var e = data[i];
    rows.push([e.amount, e.category, formatDate(e.date)]);
  }
  return rows;
}

function getBillRows(data) {
  var rows = [["Name", "Amount", "Due Date", "Status"]];
  for (var i = 0; i < data.length; i++) {
    var b = data[i];
    rows.push([
      b.name,
      b.amount,
      formatDate(b.due_date),
      b.paid ? "Paid" : "Pending",
    ]);
  }
  return rows;
}

function getGoalRows(data) {
  var rows = [["Goal", "Target", "Saved"]];
  for (var i = 0; i < data.length; i++) {
    var g = data[i];
    rows.push([g.name, g.target, g.saved]);
  }
  return rows;
}

function getBorrowRows(data) {
  var rows = [["Person", "Type", "Total", "Returned", "Remaining"]];

  for (var i = 0; i < data.length; i++) {
    var r = data[i];

    var returned = 0;
    var txns = r.transactions || [];

    for (var j = 0; j < txns.length; j++) {
      returned += parseFloat(txns[j].amount || txns[j].txn_amount || 0);
    }

    rows.push([r.person, r.type, r.amount, returned, r.amount - returned]);
  }

  return rows;
}

//  HELPERS

function downloadExcel(rows, fileName) {
  if (!rows || rows.length === 0) {
    showAlert("No data");
    return;
  }

  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.aoa_to_sheet(rows);

  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, fileName);

  showAlert("Downloaded!", "success");
}

function downloadPDF(title, rows) {
  if (!rows || rows.length <= 1) {
    showAlert("No data");
    return;
  }

  var html = "<h2>" + title + "</h2>";
  html += "<table border='1' style='width:100%;border-collapse:collapse'>";

  for (var i = 0; i < rows.length; i++) {
    html += "<tr>";
    for (var j = 0; j < rows[i].length; j++) {
      html += "<td>" + rows[i][j] + "</td>";
    }
    html += "</tr>";
  }

  html += "</table>";

  var win = window.open("");
  win.document.write(html);
  win.print();
}

//  EXPORTS

// Income
async function exportIncomeExcel() {
  var d = await fetchAll();
  downloadExcel(getIncomeRows(d.income), "income.xlsx");
}

async function exportIncomePDF() {
  var d = await fetchAll();
  downloadPDF("Income Report", getIncomeRows(d.income));
}

// Expenses
async function exportExpensesExcel() {
  var d = await fetchAll();
  downloadExcel(getExpenseRows(d.expenses), "expenses.xlsx");
}

async function exportExpensesPDF() {
  var d = await fetchAll();
  downloadPDF("Expenses Report", getExpenseRows(d.expenses));
}

// Bills
async function exportBillsExcel() {
  var d = await fetchAll();
  downloadExcel(getBillRows(d.bills), "bills.xlsx");
}

async function exportBillsPDF() {
  var d = await fetchAll();
  downloadPDF("Bills Report", getBillRows(d.bills));
}

// Goals
async function exportGoalsExcel() {
  var d = await fetchAll();
  downloadExcel(getGoalRows(d.goals), "goals.xlsx");
}

async function exportGoalsPDF() {
  var d = await fetchAll();
  downloadPDF("Goals Report", getGoalRows(d.goals));
}

// Borrow
async function exportBorrowsExcel() {
  var d = await fetchAll();
  downloadExcel(getBorrowRows(d.borrows), "borrow.xlsx");
}

async function exportBorrowsPDF() {
  var d = await fetchAll();
  downloadPDF("Borrow Report", getBorrowRows(d.borrows));
}

//  FULL REPORT

async function downloadFullExcel() {
  var d = await fetchAll();

  var rows = [];

  rows.push(["=== EXTRA INCOME ==="]);
  rows.push([]);
  rows = rows.concat(getIncomeRows(d.income));
  rows.push([]);

  rows.push(["=== EXPENSES ==="]);
  rows.push([]);
  rows = rows.concat(getExpenseRows(d.expenses));
  rows.push([]);

  rows.push(["=== BILLS ==="]);
  rows.push([]);
  rows = rows.concat(getBillRows(d.bills));
  rows.push([]);

  rows.push(["=== GOALS ==="]);
  rows.push([]);
  rows = rows.concat(getGoalRows(d.goals));
  rows.push([]);

  rows.push(["=== BORROW / LEND ==="]);
  rows.push([]);
  rows = rows.concat(getBorrowRows(d.borrows));

  downloadExcel(rows, "full_report.xlsx");
}

async function downloadFullPDF() {
  var d = await fetchAll();

  var html = "<h2>Full Report</h2>";

  function makeTable(title, rows) {
    var t = "<h3>" + title + "</h3>";
    t += "<table border='1' style='width:100%;margin-bottom:20px'>";

    for (var i = 0; i < rows.length; i++) {
      t += "<tr>";
      for (var j = 0; j < rows[i].length; j++) {
        t += "<td>" + rows[i][j] + "</td>";
      }
      t += "</tr>";
    }

    t += "</table>";
    return t;
  }

  html += makeTable("Income", getIncomeRows(d.income));
  html += makeTable("Expenses", getExpenseRows(d.expenses));
  html += makeTable("Bills", getBillRows(d.bills));
  html += makeTable("Goals", getGoalRows(d.goals));
  html += makeTable("Borrow", getBorrowRows(d.borrows));

  var win = window.open("");
  win.document.write(html);
  win.print();
}
