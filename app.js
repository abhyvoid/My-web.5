(function () {
  const sb = window.supabase; // client from supabase.js
  const $ = (id) => document.getElementById(id);
  const emailEl = $("email");
  const passwordEl = $("password");
  const errorEl = $("error-msg");

  // guard: make sure client exists
  if (!sb || !sb.auth) {
    console.error("Supabase client not found. Check supabase.js load order.");
    if (errorEl) errorEl.textContent = "Client error. Check supabase.js is loaded before app.js.";
    return;
  }

  // Show/hide password toggle (blue circle behavior)
  const toggle = $("toggle-pw");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const isHidden = passwordEl.type === "password";
      passwordEl.type = isHidden ? "text" : "password";
      toggle.classList.toggle("on", isHidden);
    });
  }

  function showError(msg) {
    console.error(msg);
    if (errorEl) errorEl.textContent = msg;
  }

  async function doLogin() {
    const email = (emailEl.value || "").trim();
    const password = passwordEl.value || "";

    if (!email || !password) return showError("Please enter email and password.");
    if (password.length < 6) return showError("Password must be at least 6 characters.");

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return showError(error.message || "Login failed.");

    // success
    window.location.href = "home.html";
  }

  async function doSignup() {
    const email = (emailEl.value || "").trim();
    const password = passwordEl.value || "";

    if (!email || !password) return showError("Please enter email and password to sign up.");
    if (password.length < 6) return showError("Password must be at least 6 characters.");

    const { data, error } = await sb.auth.signUp({ email, password });

    if (error) return showError(error.message || "Signup failed.");

    // If Confirm Email is OFF, session exists → go straight to home.
    if (data && data.session) {
      window.location.href = "home.html";
      return;
    }

    // If Confirm Email is ON, tell them to check inbox.
    errorEl.textContent = "Signup successful! Check your email to confirm, then log in.";
  }

  // wire up buttons
  const loginBtn = $("login-btn");
  const signupBtn = $("signup-btn");

  if (loginBtn) loginBtn.addEventListener("click", (e) => { e.preventDefault(); doLogin(); });
  if (signupBtn) signupBtn.addEventListener("click", (e) => { e.preventDefault(); doSignup(); });

  // Optional: if already logged in, jump to home.
  sb.auth.getSession().then(({ data }) => {
    if (data?.session) window.location.href = "home.html";
  });
})();
