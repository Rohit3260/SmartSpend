// goals.js

var token = localStorage.getItem("token");

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

// Header helpers
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

//  Render goal cards
function renderGoals(goals) {
  var grid = document.getElementById("goalsGrid");
  var noMsg = document.getElementById("noGoals");

  if (!grid || !noMsg) return;

  if (!goals || goals.length === 0) {
    noMsg.style.display = "block";
    grid.innerHTML = "";
    return;
  }

  noMsg.style.display = "none";

  var html = "";

  for (var i = 0; i < goals.length; i++) {
    var goal = goals[i];

    var target = parseFloat(goal.target || 0);
    var saved = parseFloat(goal.saved || 0);

    if (saved > target) saved = target;

    var percent = target > 0 ? Math.round((saved / target) * 100) : 0;

    var barColor = "red";
    if (percent >= 30) barColor = "orange";
    if (percent >= 70) barColor = "green";

    var deadlineText = goal.deadline
      ? "Deadline: " + new Date(goal.deadline).toLocaleDateString("en-IN")
      : "No deadline";

    var addedText = goal.date
      ? "Added on: " + new Date(goal.date).toLocaleDateString("en-IN")
      : "";

    var completedBadge = percent >= 100 ? " (Completed)" : "";

    html += "<div class='goal-card'>";
    html += "<h3>" + (goal.name || "Goal") + completedBadge + "</h3>";

    html += "<button onclick='deleteGoal(" + goal.id + ")'>Delete</button>";

    html += "<p>" + (goal.note || "") + "</p>";

    html += "<p>Saved: " + toINR(saved) + "</p>";
    html += "<p>Target: " + toINR(target) + "</p>";

    // progress bar
    html += "<div style='background:#ddd;height:8px;margin:8px 0'>";
    html +=
      "<div style='width:" +
      percent +
      "%;background:" +
      barColor +
      ";height:8px'></div>";
    html += "</div>";

    html += "<p>" + percent + "% completed</p>";
    html += "<p>" + deadlineText + "</p>";
    html += "<p>" + addedText + "</p>";

    // Add money
    if (percent < 100) {
      html +=
        "<input type='number' id='addMoney_" +
        goal.id +
        "' placeholder='Add amount' />";
      html += "<button onclick='addMoney(" + goal.id + ")'>+ Add</button>";
    }

    html += "</div>";
  }

  grid.innerHTML = html;
}

//  Load goals
async function loadGoals() {
  try {
    var res = await fetch(BASE_URL + "/api/goals", {
      headers: authHeaders(),
    });

    var data = await res.json();

    if (res.ok) {
      renderGoals(data);
    } else {
      showAlert(data.message || "Could not load goals");
    }
  } catch (err) {
    showAlert("Server error.");
  }
}

//  Add money
async function addMoney(id) {
  var input = document.getElementById("addMoney_" + id);
  if (!input) return;

  var amount = parseFloat(input.value);

  if (!amount || amount <= 0) {
    showAlert("Enter valid amount");
    return;
  }

  try {
    var res = await fetch(BASE_URL + "/api/goals/" + id + "/add", {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify({ amount: amount }),
    });

    var data = await res.json();

    if (res.ok) {
      showAlert("Amount added!", "success");
      loadGoals();
    } else {
      showAlert(data.message || "Error");
    }
  } catch (err) {
    showAlert("Server error");
  }
}

//  Delete goal
async function deleteGoal(id) {
  if (!confirm("Delete this goal?")) return;

  try {
    var res = await fetch(BASE_URL + "/api/goals/" + id, {
      method: "DELETE",
      headers: authHeaders(),
    });

    var data = await res.json();

    if (res.ok) {
      showAlert("Goal deleted!", "success");
      loadGoals();
    } else {
      showAlert(data.message || "Error");
    }
  } catch (err) {
    showAlert("Server error");
  }
}

//  Add new goal
var addBtn = document.getElementById("addGoalBtn");

if (addBtn) {
  addBtn.onclick = async function () {
    clearErrors();

    var name = document.getElementById("goalName").value.trim();
    var target = document.getElementById("goalTarget").value.trim();
    var saved = document.getElementById("goalSaved").value.trim();
    var deadline = document.getElementById("goalDeadline").value;
    var note = document.getElementById("goalNote").value.trim();

    var hasError = false;

    if (!name) {
      showError("nameError", "Required");
      hasError = true;
    }

    if (!target) {
      showError("targetError", "Required");
      hasError = true;
    }

    if (hasError) return;

    try {
      var res = await fetch(BASE_URL + "/api/goals", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
          name: name,
          target: parseFloat(target),
          saved: parseFloat(saved) || 0,
          deadline: deadline || null,
          note: note,
        }),
      });

      var data = await res.json();

      if (res.ok) {
        showAlert("Goal added!", "success");
        loadGoals();

        document.getElementById("goalName").value = "";
        document.getElementById("goalTarget").value = "";
        document.getElementById("goalSaved").value = "0";
        document.getElementById("goalDeadline").value = "";
        document.getElementById("goalNote").value = "";
      } else {
        showAlert(data.message || "Error");
      }
    } catch (err) {
      showAlert("Server error");
    }
  };
}

// START
loadGoals();
