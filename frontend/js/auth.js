//  API
const API = BASE_URL + "/api/auth";

const jsonHeaders = () => {
  return { "Content-Type": "application/json" };
};

//  SAFE REDIRECT
const token = localStorage.getItem("token");

// only redirect if already on login page
if (token && window.location.pathname.includes("index.html")) {
  window.location.href = "dashboard.html";
}

//  HELPERS
const showAlert = (boxId, msg, type) => {
  const box = document.getElementById(boxId);
  if (!box) return;

  box.textContent = msg;
  box.className = "auth-alert " + (type || "error");

  setTimeout(() => {
    box.className = "auth-alert";
  }, 4000);
};

const clearErrors = (ids) => {
  for (let i = 0; i < ids.length; i++) {
    const el = document.getElementById(ids[i]);
    if (el) {
      el.textContent = "";
      el.style.display = "none";
    }
  }
};

const showError = (id, msg) => {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
    el.style.display = "block";
  }
};

//  GOOGLE BUTTONS
const googleLoginBtn = document.getElementById("googleLoginBtn");
if (googleLoginBtn) {
  googleLoginBtn.onclick = () => {
    showAlert("loginAlert", "Google login coming soon!", "success");
  };
}

const googleRegisterBtn = document.getElementById("googleRegisterBtn");
if (googleRegisterBtn) {
  googleRegisterBtn.onclick = () => {
    showAlert("registerAlert", "Google login coming soon!", "success");
  };
}

//  LOGIN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearErrors(["loginEmailError", "loginPasswordError"]);

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email) {
      showError("loginEmailError", "Email is required");
      return;
    }

    if (!password) {
      showError("loginPasswordError", "Password is required");
      return;
    }

    try {
      const res = await fetch(API + "/login", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ email: email, password: password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.profile_complete) {
          window.location.href = "dashboard.html";
        } else {
          window.location.href = "profile.html";
        }
      } else {
        showAlert("loginAlert", data.message || "Login failed");
      }
    } catch (err) {
      showAlert("loginAlert", "Server error. Make sure backend is running.");
    }
  });
}

//  REGISTER
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearErrors([
      "registerNameError",
      "registerEmailError",
      "registerPasswordError",
    ]);

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    if (!name) {
      showError("registerNameError", "Name is required");
      return;
    }

    if (!email) {
      showError("registerEmailError", "Email is required");
      return;
    }

    if (password.length < 8) {
      showError("registerPasswordError", "Min. 8 characters");
      return;
    }

    try {
      const res = await fetch(API + "/register", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ name: name, email: email, password: password }),
      });

      const data = await res.json();

      if (res.ok) {
        showAlert(
          "registerAlert",
          "Account created! Please log in.",
          "success",
        );

        setTimeout(() => {
          const container = document.getElementById("mainContainer");
          if (container) container.classList.remove("sign-up-mode");
        }, 1500);
      } else {
        showAlert("registerAlert", data.message || "Registration failed");
      }
    } catch (err) {
      showAlert("registerAlert", "Server error. Make sure backend is running.");
    }
  });
}

//  FORGOT PASSWORD (FIXED)
const forgotBtn = document.getElementById("forgotLink");

if (forgotBtn) {
  forgotBtn.onclick = () => {
    window.location.href = "forgot.html";
  };
}
