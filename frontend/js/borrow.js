// borrow.js

var token = localStorage.getItem("token");
if (!token) window.location.href = "index.html";

var user = JSON.parse(localStorage.getItem("user") || "{}");

var sidebarName = document.getElementById("sidebarName");
if (sidebarName) sidebarName.textContent = user.name || "User";

// logout safe
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

function jsonHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  };
}

function toINR(amount) {
  return "₹" + parseFloat(amount || 0).toLocaleString("en-IN");
}

//  FIXED RETURN CALCULATION
function calcReturned(record) {
  var txns = record.transactions || [];
  var total = 0;

  for (var i = 0; i < txns.length; i++) {
    total += parseFloat(txns[i].amount || txns[i].txn_amount || 0);
  }

  return total;
}

function isSettled(r) {
  return r.settled === true || r.settled === 1;
}

//  ADD RETURN
async function addReturn(id) {
  var input = document.getElementById("returnInput_" + id);
  if (!input) return;

  var amount = input.value;

  if (!amount) {
    alert("Enter amount");
    return;
  }

  try {
    var res = await fetch(BASE_URL + "/api/borrows/" + id + "/transactions", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        amount: parseFloat(amount),
      }),
    });

    if (res.ok) {
      input.value = "";

      // small delay for DB update
      setTimeout(function () {
        loadBorrows();
      }, 200);
    }
  } catch (err) {
    alert("Error");
  }
}

//  DELETE
async function deleteRecord(id) {
  if (!confirm("Delete this record?")) return;

  try {
    var res = await fetch(BASE_URL + "/api/borrows/" + id, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (res.ok) loadBorrows();
  } catch (err) {
    alert("Error");
  }
}

//  SUMMARY FIXED
function updateSummary(records) {
  var totalLent = 0;
  var totalBorrowed = 0;
  var pendingReceive = 0;
  var pendingReturn = 0;

  for (var i = 0; i < records.length; i++) {
    var r = records[i];

    var type = (r.type || "").toLowerCase();

    var amount = parseFloat(r.amount || 0);
    var returned = calcReturned(r);
    var remaining = amount - returned;

    var settled = isSettled(r);

    if (type === "lent") {
      totalLent += amount;

      if (!settled) {
        pendingReceive += remaining;
      }
    } else if (type === "borrowed") {
      totalBorrowed += amount;

      if (!settled) {
        pendingReturn += remaining;
      }
    }
  }

  var el1 = document.getElementById("totalLent");
  var el2 = document.getElementById("totalBorrowed");
  var el3 = document.getElementById("pendingReceive");
  var el4 = document.getElementById("pendingReturn");

  if (el1) el1.textContent = toINR(totalLent);
  if (el2) el2.textContent = toINR(totalBorrowed);
  if (el3) el3.textContent = toINR(pendingReceive);
  if (el4) el4.textContent = toINR(pendingReturn);
}

//  RENDER
function renderCards(records) {
  var grid = document.getElementById("borrowGrid");
  var noMsg = document.getElementById("noRecords");

  if (!grid || !noMsg) return;

  if (records.length === 0) {
    noMsg.style.display = "block";
    grid.innerHTML = "";
    updateSummary(records);
    return;
  }

  noMsg.style.display = "none";

  var html = "";

  for (var i = 0; i < records.length; i++) {
    var r = records[i];

    var amount = parseFloat(r.amount || 0);
    var returned = calcReturned(r);
    var remaining = amount - returned;

    var percent = amount > 0 ? Math.round((returned / amount) * 100) : 0;

    var settled = isSettled(r);

    var color = "red";
    if (percent > 30) color = "orange";
    if (percent > 70) color = "green";

    html += "<div class='goal-card'>";
    html += "<h3>" + r.person + "</h3>";

    html += "<p>" + (r.type === "lent" ? "Lent" : "Borrowed") + " ";
    html += settled ? "Settled" : "Pending";
    html += "</p>";

    html += "<p>Total: " + toINR(amount) + "</p>";
    html += "<p>Returned: " + toINR(returned) + "</p>";
    html += "<p>Remaining: " + toINR(remaining) + "</p>";

    // progress bar
    html +=
      "<div style='background:#ddd;height:8px;border-radius:5px;margin:8px 0'>";
    html +=
      "<div style='width:" +
      percent +
      "%;background:" +
      color +
      ";height:8px;border-radius:5px'></div>";
    html += "</div>";

    html += "<p>" + percent + "% completed</p>";

    if (!settled) {
      html +=
        "<input type='number' placeholder='Add amount' id='returnInput_" +
        r.id +
        "' />";
      html += "<button onclick='addReturn(" + r.id + ")'>+ Add</button>";
    }

    html += "<button onclick='deleteRecord(" + r.id + ")'>Delete</button>";
    html += "</div>";
  }

  grid.innerHTML = html;

  // 🔥 IMPORTANT
  updateSummary(records);
}

//  LOAD
async function loadBorrows() {
  try {
    var res = await fetch(BASE_URL + "/api/borrows", {
      headers: authHeaders(),
    });

    var data = await res.json();

    console.log("BORROWS DATA:", data); // debug

    if (res.ok) renderCards(data);
  } catch (err) {
    alert("Server error");
  }
}

//  ADD RECORD
var addBtn = document.getElementById("addBorrowBtn");

if (addBtn) {
  addBtn.onclick = async function () {
    var person = document.getElementById("personName").value.trim();
    var amount = document.getElementById("borrowAmount").value.trim();
    var type = document.getElementById("borrowType").value;

    if (!person || !amount || !type) {
      alert("Fill all fields");
      return;
    }

    try {
      var res = await fetch(BASE_URL + "/api/borrows", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
          person: person,
          amount: parseFloat(amount),
          type: type,
        }),
      });

      if (res.ok) {
        loadBorrows();
      }
    } catch (err) {
      alert("Error");
    }
  };
}

// START
loadBorrows();
