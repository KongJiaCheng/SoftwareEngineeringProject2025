"use strict";

document.addEventListener("DOMContentLoaded", function () {
  // Create elements with beautiful design
  const container = document.createElement("div");
  container.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
  container.style.backgroundSize = "cover";
  container.style.minHeight = "100vh";
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";
  container.style.color = "white";
  container.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

  const box = document.createElement("div");
  box.style.background = "rgba(255, 255, 255, 0.95)";
  box.style.backdropFilter = "blur(10px)";
  box.style.padding = "40px";
  box.style.borderRadius = "20px";
  box.style.boxShadow = "0 15px 35px rgba(0, 0, 0, 0.1)";
  box.style.width = "400px";
  box.style.border = "1px solid rgba(255, 255, 255, 0.2)";

  // Username field - beautiful design
  const usernameLabel = document.createElement("label");
  usernameLabel.textContent = "Username";
  usernameLabel.style.display = "block";
  usernameLabel.style.marginBottom = "8px";
  usernameLabel.style.color = "#333";
  usernameLabel.style.fontWeight = "500";

  const usernameInput = document.createElement("input");
  usernameInput.type = "text";
  usernameInput.placeholder = "Enter your email";
  usernameInput.style.width = "100%";
  usernameInput.style.marginBottom = "20px";
  usernameInput.style.padding = "15px";
  usernameInput.style.border = "2px solid #e1e5e9";
  usernameInput.style.borderRadius = "10px";
  usernameInput.style.fontSize = "16px";
  usernameInput.style.boxSizing = "border-box";
  usernameInput.style.transition = "all 0.3s ease";

  usernameInput.addEventListener("focus", () => {
    usernameInput.style.borderColor = "#667eea";
    usernameInput.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
  });

  usernameInput.addEventListener("blur", () => {
    usernameInput.style.borderColor = "#e1e5e9";
    usernameInput.style.boxShadow = "none";
  });

  // Password field - beautiful design
  const passwordLabel = document.createElement("label");
  passwordLabel.textContent = "Password";
  passwordLabel.style.display = "block";
  passwordLabel.style.marginBottom = "8px";
  passwordLabel.style.color = "#333";
  passwordLabel.style.fontWeight = "500";

  const passwordInput = document.createElement("input");
  passwordInput.type = "password";
  passwordInput.placeholder = "Enter your password";
  passwordInput.style.width = "100%";
  passwordInput.style.marginBottom = "25px";
  passwordInput.style.padding = "15px";
  passwordInput.style.border = "2px solid #e1e5e9";
  passwordInput.style.borderRadius = "10px";
  passwordInput.style.fontSize = "16px";
  passwordInput.style.boxSizing = "border-box";
  passwordInput.style.transition = "all 0.3s ease";

  passwordInput.addEventListener("focus", () => {
    passwordInput.style.borderColor = "#667eea";
    passwordInput.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
  });

  passwordInput.addEventListener("blur", () => {
    passwordInput.style.borderColor = "#e1e5e9";
    passwordInput.style.boxShadow = "none";
  });

  // Login button - beautiful design
  const loginButton = document.createElement("button");
  loginButton.textContent = "Login";
  loginButton.style.width = "100%";
  loginButton.style.padding = "15px";
  loginButton.style.backgroundColor = "#667eea";
  loginButton.style.color = "white";
  loginButton.style.border = "none";
  loginButton.style.borderRadius = "10px";
  loginButton.style.cursor = "pointer";
  loginButton.style.fontSize = "16px";
  loginButton.style.fontWeight = "600";
  loginButton.style.transition = "all 0.3s ease";

  loginButton.addEventListener("mouseenter", () => {
    loginButton.style.backgroundColor = "#5a6fd8";
    loginButton.style.transform = "translateY(-2px)";
  });

  loginButton.addEventListener("mouseleave", () => {
    loginButton.style.backgroundColor = "#667eea";
    loginButton.style.transform = "translateY(0)";
  });

  // Append elements
  box.appendChild(usernameLabel);
  box.appendChild(usernameInput);
  box.appendChild(passwordLabel);
  box.appendChild(passwordInput);
  box.appendChild(loginButton);
  container.appendChild(box);
  document.body.appendChild(container);

  // Toast message function - same as original but with better design
  function showToast(message, color = "orange") {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = color;
    toast.style.color = "white";
    toast.style.padding = "12px 24px";
    toast.style.borderRadius = "8px";
    toast.style.zIndex = "9999";
    toast.style.fontWeight = "500";
    toast.style.boxShadow = "0 5px 15px rgba(0, 0, 0, 0.2)";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // Handle login - EXACT SAME FUNCTIONALITY AS ORIGINAL
  loginButton.addEventListener("click", async function () {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showToast("Please fill in all fields", "orange");
      return;
    }

    try {
      const res = await fetch("/api/auth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        showToast("Login failed - invalid credentials", "red");
        return;
      }

      const data = await res.json();
      
      if (data.success) {
        // Store user info (including role)
        sessionStorage.setItem("user", JSON.stringify(data.user));
        showToast("Logged in successfully", "green");
        
        // Redirect based on role
        if (data.user.role === 'admin') {
          window.location.href = "/admin";
        } else if (data.user.role === 'editor') {
          window.location.href = "/editor";
        } else {
          window.location.href = "/viewer";
        }
      } else {
        showToast(data.error, "red");
      }
      
    } catch (err) {
      console.error(err);
      showToast("An error occurred", "red");
    }
  });
});