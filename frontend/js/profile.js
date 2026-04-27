// profile.js

var API = BASE_URL + "/api/auth";
var token = localStorage.getItem("token");

// Check login
if (!token) window.location.href = "index.html";

// Show alert
function showAlert(msg, type) {
  var box = document.getElementById("alertBox");
  if (!box) return;

  box.textContent = msg;
  box.className = "alert " + (type || "error");
  box.classList.remove("hidden");

  setTimeout(function () {
    box.classList.add("hidden");
  }, 4000);
}

// Show field error
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

// Auto fill form
function autoFillForm() {
  var user = JSON.parse(localStorage.getItem("user") || "{}");

  var name = document.getElementById("profileName");
  var email = document.getElementById("profileEmail");
  var phone = document.getElementById("profilePhone");
  var gender = document.getElementById("profileGender");
  var dob = document.getElementById("profileDob");
  var city = document.getElementById("profileCity");
  var profession = document.getElementById("profileProfession");
  var salary = document.getElementById("profileSalary");

  if (user.name && name) name.value = user.name;
  if (user.email && email) email.value = user.email;
  if (user.phone && phone) phone.value = user.phone;
  if (user.gender && gender) gender.value = user.gender;
  if (user.dob && dob) dob.value = user.dob.split("T")[0];
  if (user.city && city) city.value = user.city;
  if (user.profession && profession) profession.value = user.profession;
  if (user.salary && salary) salary.value = user.salary;
}

// Save profile
var form = document.getElementById("profileForm");

if (form) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearErrors();

    var name = document.getElementById("profileName").value.trim();
    var email = document.getElementById("profileEmail").value.trim();
    var phone = document.getElementById("profilePhone").value.trim();
    var gender = document.getElementById("profileGender").value;
    var dob = document.getElementById("profileDob").value;
    var city = document.getElementById("profileCity").value.trim();
    var profession = document.getElementById("profileProfession").value;
    var salary = document.getElementById("profileSalary").value;

    var hasError = false;

    if (!name) {
      showError("nameError", "Name is required");
      hasError = true;
    }

    if (!email) {
      showError("emailError", "Email is required");
      hasError = true;
    }

    if (!gender) {
      showError("genderError", "Select gender");
      hasError = true;
    }

    if (!dob) {
      showError("dobError", "Required");
      hasError = true;
    }

    if (!city) {
      showError("cityError", "Required");
      hasError = true;
    }

    if (!profession) {
      showError("professionError", "Required");
      hasError = true;
    }

    if (!salary) {
      showError("salaryError", "Required");
      hasError = true;
    }

    if (phone && phone.length !== 10) {
      showError("phoneError", "Must be 10 digits");
      hasError = true;
    }

    if (hasError) return;

    try {
      var res = await fetch(API + "/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          name: name,
          email: email,
          phone: phone,
          gender: gender,
          dob: dob,
          city: city,
          profession: profession,
          salary: salary,
        }),
      });

      var result = await res.json();

      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(result.user));

        showAlert("Profile saved!", "success");

        setTimeout(function () {
          window.location.href = "dashboard.html";
        }, 1000);
      } else {
        showAlert(result.message || "Could not save profile");
      }
    } catch (err) {
      showAlert("Server error");
    }
  });
}

// On load
autoFillForm();
