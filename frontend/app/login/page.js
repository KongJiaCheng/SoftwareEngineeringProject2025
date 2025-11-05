"use strict";

document.addEventListener("DOMContentLoaded", function () {
  // Create elements
  const container = document.createElement("div");
  container.style.backgroundImage = 'url("/picture/Background.jpg")';
  container.style.backgroundSize = "cover";
  container.style.minHeight = "100vh";
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";
  container.style.color = "white";

  const box = document.createElement("div");
  box.style.background = "rgba(0,0,0,0.7)";
  box.style.padding = "32px";
  box.style.borderRadius = "8px";
  box.style.width = "400px";

  // Username field
  const usernameLabel = document.createElement("label");
  usernameLabel.textContent = "Username";
  usernameLabel.style.display = "block";
  usernameLabel.style.marginBottom = "8px";

  const usernameInput = document.createElement("input");
  usernameInput.type = "text";
  usernameInput.placeholder = "Enter your email";
  usernameInput.style.width = "100%";
  usernameInput.style.marginBottom = "16px";
  usernameInput.style.padding = "8px";

  // Password field
  const passwordLabel = document.createElement("label");
  passwordLabel.textContent = "Password";
  passwordLabel.style.display = "block";
  passwordLabel.style.marginBottom = "8px";

  const passwordInput = document.createElement("input");
  passwordInput.type = "password";
  passwordInput.placeholder = "Enter your password";
  passwordInput.style.width = "100%";
  passwordInput.style.marginBottom = "16px";
  passwordInput.style.padding = "8px";

  // Login button
  const loginButton = document.createElement("button");
  loginButton.textContent = "Login";
  loginButton.style.width = "100%";
  loginButton.style.padding = "10px";
  loginButton.style.backgroundColor = "green";
  loginButton.style.color = "white";
  loginButton.style.border = "none";
  loginButton.style.cursor = "pointer";

  // Append elements
  box.appendChild(usernameLabel);
  box.appendChild(usernameInput);
  box.appendChild(passwordLabel);
  box.appendChild(passwordInput);
  box.appendChild(loginButton);
  container.appendChild(box);
  document.body.appendChild(container);

  // Toast message function
  function showToast(message, color = "orange") {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = color;
    toast.style.color = "white";
    toast.style.padding = "10px 20px";
    toast.style.borderRadius = "6px";
    toast.style.zIndex = "9999";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // Handle login
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