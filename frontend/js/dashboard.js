//  AUTH
var token = localStorage.getItem("token");
if (!token) window.location.href = "index.html";

var user = JSON.parse(localStorage.getItem("user") || "{}");

var sidebarName = document.getElementById("sidebarName");
if (sidebarName) sidebarName.textContent = user.name || "User";

var welcomeName = document.getElementById("welcomeName");
if (welcomeName) welcomeName.textContent = user.name || "User";

// logout
var logoutBtn = document.getElementById("logoutBtnDesktop");
if (logoutBtn) {
  logoutBtn.onclick = function () {
    localStorage.clear();
    window.location.href = "index.html";
  };
}

//  HEADERS
function authHeaders() {
  return { Authorization: "Bearer " + token };
}

//  HELPERS
function toINR(x) {
  return "₹" + parseFloat(x || 0).toLocaleString("en-IN");
}

//  CHART
var barChart = null;
var pieChart = null;

function drawBar(labels, data) {
  var el = document.getElementById("barChart");
  if (!el) return;

  if (barChart) barChart.destroy();

  barChart = new Chart(el, {
    type: "bar",
    data: { labels: labels, datasets: [{ data: data }] },
  });
}

function drawPie(labels, data) {
  var el = document.getElementById("pieChart");
  if (!el) return;

  if (pieChart) pieChart.destroy();

  pieChart = new Chart(el, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{ data: data }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

//  MAIN
async function loadDashboard() {
  try {
    var r1 = await fetch(BASE_URL + "/api/expenses", {
      headers: authHeaders(),
    });
    var r2 = await fetch(BASE_URL + "/api/bills", { headers: authHeaders() });
    var r3 = await fetch(BASE_URL + "/api/extra-income", {
      headers: authHeaders(),
    });
    var r4 = await fetch(BASE_URL + "/api/borrows", { headers: authHeaders() });
    var r5 = await fetch(BASE_URL + "/api/goals", { headers: authHeaders() });

    var expenses = await r1.json();
    var bills = await r2.json();
    var income = await r3.json();
    var borrows = await r4.json();
    var goals = await r5.json();

    //  TOTAL + MONTH
    var totalExp = 0;
    var monthExp = 0;
    var totalInc = 0;

    var now = new Date();

    for (var i = 0; i < expenses.length; i++) {
      var e = expenses[i];
      var amt = parseFloat(e.amount || 0);

      totalExp += amt;

      var d = new Date(e.date);
      if (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      ) {
        monthExp += amt;
      }
    }

    for (var i = 0; i < income.length; i++) {
      totalInc += parseFloat(income[i].amount || 0);
    }

    //  BORROW
    var pendingReceive = 0;
    var pendingReturn = 0;

    for (var i = 0; i < borrows.length; i++) {
      var r = borrows[i];

      var total = parseFloat(r.amount || 0);
      var returned = 0;

      var txns = r.transactions || [];

      for (var j = 0; j < txns.length; j++) {
        returned += parseFloat(txns[j].amount || txns[j].txn_amount || 0);
      }

      var remaining = total - returned;
      var settled = r.settled === true || r.settled === 1;
      var type = (r.type || "").toLowerCase();

      if (!settled) {
        if (type === "lent") pendingReceive += remaining;
        else pendingReturn += remaining;
      }
    }

    //  GOALS
    var goalTotal = 0;
    for (var i = 0; i < goals.length; i++) {
      goalTotal += parseFloat(goals[i].target || 0);
    }

    //  FINAL
    var totalBalance = totalInc - totalExp + pendingReceive - pendingReturn;
    var remaining = totalBalance - goalTotal;

    document.getElementById("totalIncome").textContent = toINR(totalBalance);
    document.getElementById("totalExpenses").textContent = toINR(totalExp);
    document.getElementById("monthSpent").textContent = toINR(monthExp);
    document.getElementById("savingsGoal").textContent = toINR(goalTotal);
    document.getElementById("remaining").textContent = toINR(remaining);

    //  BILLS
    var billsDue = 0;

    // sort by due date
    bills.sort(function (a, b) {
      return new Date(a.due_date) - new Date(b.due_date);
    });

    for (var i = 0; i < bills.length; i++) {
      if (!(bills[i].paid === true || bills[i].paid === 1)) {
        billsDue += parseFloat(bills[i].amount || 0);
      }
    }

    document.getElementById("billsDue").textContent = toINR(billsDue);

    //  UPCOMING BILLS LIST
    var upcomingHtml = "";

    for (var i = 0; i < bills.length; i++) {
      var b = bills[i];

      var paid = b.paid === true || b.paid === 1;

      if (!paid) {
        upcomingHtml +=
          "<div>" +
          (b.name || "Bill") +
          " - ₹" +
          b.amount +
          " (Due: " +
          (b.due_date ? b.due_date.split("T")[0] : "N/A") +
          ")" +
          "</div>";
      }
    }

    var upcomingEl = document.getElementById("upcomingBills");

    if (upcomingEl) {
      upcomingEl.innerHTML = upcomingHtml || "<p>No upcoming bills.</p>";
    }

    //  CHART
    var map = {};

    for (var i = 0; i < expenses.length; i++) {
      var c = expenses[i].category || "Other";
      if (!map[c]) map[c] = 0;
      map[c] += parseFloat(expenses[i].amount || 0);
    }

    var labels = Object.keys(map);
    var data = Object.values(map);

    drawBar(labels, data);

    var barBtn = document.getElementById("showBar");
    var pieBtn = document.getElementById("showPie");

    var barCanvas = document.getElementById("barChart");
    var pieCanvas = document.getElementById("pieChart");

    if (barBtn && pieBtn && barCanvas && pieCanvas) {
      barCanvas.style.display = "block";
      pieCanvas.style.display = "none";

      barBtn.onclick = function () {
        barCanvas.style.display = "block";
        pieCanvas.style.display = "none";
      };

      pieBtn.onclick = function () {
        barCanvas.style.display = "none";
        pieCanvas.style.display = "block";
        drawPie(labels, data);
      };
    }

    //  RECENT TRANSACTIONS
    try {
      var all = [];

      // Expenses
      // Expenses
      for (var i = 0; i < expenses.length; i++) {
        all.push({
          type: "Expense",
          name: expenses[i].category || "Expense", // ✅ FIX HERE
          amount: parseFloat(expenses[i].amount || 0),
          date: expenses[i].date || new Date().toISOString(),
        });
      }

      // Income
      for (var i = 0; i < income.length; i++) {
        all.push({
          type: "Income",
          name: income[i].title || "Income",
          amount: parseFloat(income[i].amount || 0),
          date: income[i].date || new Date().toISOString(),
        });
      }

      // Borrow
      for (var i = 0; i < borrows.length; i++) {
        var r = borrows[i];

        all.push({
          type: (r.type || "").toLowerCase() === "lent" ? "Lent" : "Borrowed",
          name: r.person || "Borrow",
          amount: parseFloat(r.amount || 0),
          date: r.created_at || r.date || new Date().toISOString(),
        });
      }

      // Sort
      all.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
      });

      var list = all.slice(0, 20);

      function makeCell(item) {
        if (!item) return "<td></td>";

        var color =
          item.type === "Expense"
            ? "red"
            : item.type === "Income"
              ? "green"
              : "blue";

        return (
          "<td>" +
          item.type +
          " - " +
          item.name +
          " <b style='color:" +
          color +
          "'>₹" +
          item.amount +
          "</b></td>"
        );
      }

      if (list.length === 0) {
        document.getElementById("recentList").innerHTML =
          "<p>No transactions yet.</p>";
      } else {
        var html = "<table style='width:100%'>";

        for (var i = 0; i < 10; i++) {
          html += "<tr>";
          html += makeCell(list[i]);
          html += makeCell(list[i + 10]);
          html += "</tr>";
        }

        html += "</table>";

        document.getElementById("recentList").innerHTML = html;
      }
    } catch (err) {
      console.log("recent transaction error", err);
    }
  } catch (err) {
    console.log("dashboard error", err);
  }
}

//  START
loadDashboard();
