  <script>
// ---------- CONFIG YOU CARE ABOUT ----------
const ADMIN_EMAIL = "abhayrangappanvat@gmail.com";  // only this email sees + and Delete

// ---------- PAGE ROUTING HELPERS ----------
const onIndex = location.pathname.endsWith("index.html") || location.pathname.endsWith("/") || location.pathname === "";
const onHome  = location.pathname.endsWith("home.html");

// ---------- COMMON: auth state guard on home ----------
async function ensureLoggedInForHome() {
  if (!onHome) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    location.href = "index.html";
    return;
  }
  // show admin UI if admin
  const isAdmin = session.user?.email === ADMIN_EMAIL;
  document.getElementById("add-btn").style.display = isAdmin ? "grid" : "none";
}

// ---------- INDEX PAGE (Login / Sign Up) ----------
async function handleLogin() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const msg = document.getElementById("auth-msg");
  msg.textContent = "Logging in...";
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { msg.textContent = error.message; return; }
  msg.textContent = "Success! Redirecting...";
  location.href = "home.html";
}

async function handleSignup() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const msg = document.getElementById("auth-msg");
  msg.textContent = "Creating account...";
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) { msg.textContent = error.message; return; }
  // If confirm-email is off, user is logged in immediately. If it’s on, they must verify email.
  msg.textContent = "Account created. Redirecting...";
  location.href = "home.html";
}

// password toggle circle
function wirePasswordToggle() {
  const btn = document.getElementById("toggle-pass");
  if (!btn) return;
  const input = document.getElementById("password");
  btn.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.classList.toggle("on", show);
  });
}

// ---------- HOME PAGE (UI + Data) ----------
function wireMenuAndDarkMode() {
  if (!onHome) return;
  const side = document.getElementById("side");
  const ham = document.getElementById("hamburger");
  const logoutBtn = document.getElementById("logout-btn");
  const dm = document.getElementById("dark-toggle");

  ham.addEventListener("click", () => side.classList.toggle("open"));
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    location.href = "index.html";
  });

  // Dark mode switch w/ sliding thumb animation
  const apply = (on) => {
    document.body.classList.toggle("dark", on);
    dm.classList.toggle("on", on);
    localStorage.setItem("mw-dark", on ? "1" : "0");
  };
  // initial
  apply(localStorage.getItem("mw-dark") === "1");
  dm.addEventListener("click", () => apply(!document.body.classList.contains("dark")));
}

async function loadPosts() {
  if (!onHome) return;
  const feed = document.getElementById("feed");
  feed.innerHTML = "Loading...";
  const { data: posts, error } = await supabase.from("posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { feed.innerHTML = error.message; return; }
  const { data: { session } } = await supabase.auth.getSession();
  const isAdmin = !!session && session.user.email === ADMIN_EMAIL;

  feed.innerHTML = posts.map(p => renderPost(p, isAdmin)).join("");
  // wire dynamic buttons
  posts.forEach(p => {
    const likeBtn = document.getElementById(`like-${p.id}`);
    likeBtn?.addEventListener("click", () => likePost(p.id, p.likes || 0));

    const delBtn = document.getElementById(`del-${p.id}`);
    delBtn?.addEventListener("click", () => deletePost(p.id));
  });
}

function renderPost(p, isAdmin) {
  return `
  <article class="post" id="post-${p.id}">
    <div class="text">${escapeHTML(p.text || "")}</div>
    ${p.image_url ? `<img src="${p.image_url}" alt="">` : ""}
    <div class="row">
      <button id="like-${p.id}" class="btn btn-white">♡ like</button>
      <span class="meta">${(p.likes ?? 0)} likes</span>
      ${isAdmin ? `<button id="del-${p.id}" class="btn btn-white del">Delete</button>` : ""}
    </div>
  </article>`;
}

// Like: optimistic + update
async function likePost(id, currentLikes) {
  // optimistic
  const meta = document.querySelector(`#post-${id} .meta`);
  if (meta) meta.textContent = `${currentLikes + 1} likes`;
  const { error } = await supabase.from("posts").update({ likes: (currentLikes + 1) }).eq("id", id);
  if (error) console.error(error);
}

// Delete (admin only)
async function deletePost(id) {
  const ok = confirm("Delete this post?");
  if (!ok) return;
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) { alert(error.message); return; }
  document.getElementById(`post-${id}`)?.remove();
}

// Admin “+” editor
function wireEditor() {
  if (!onHome) return;
  const addBtn = document.getElementById("add-btn");
  const editor = document.getElementById("editor");
  const cancel = document.getElementById("post-cancel");
  const submit = document.getElementById("post-submit");

  addBtn.addEventListener("click", () => editor.classList.remove("hidden"));
  cancel.addEventListener("click", () => editor.classList.add("hidden"));
  submit.addEventListener("click", createPost);
}

// Upload image to Storage bucket "images" (create bucket in dashboard if you don’t have it)
async function uploadImage(file) {
  if (!file) return null;
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split(".").pop()}`;
  const { data, error } = await supabase.storage.from("images").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false
  });
  if (error) throw error;
  const { data: publicUrl } = supabase.storage.from("images").getPublicUrl(data.path);
  return publicUrl.publicUrl;
}

async function createPost() {
  const txt = document.getElementById("post-text").value.trim();
  const file = document.getElementById("image-file").files[0];

  try {
    let imageUrl = null;
    if (file) imageUrl = await uploadImage(file);

    const { error } = await supabase.from("posts").insert({
      text: txt, image_url: imageUrl, likes: 0
    });
    if (error) throw error;

    document.getElementById("editor").classList.add("hidden");
    document.getElementById("post-text").value = "";
    document.getElementById("image-file").value = "";
    await loadPosts();
  } catch (e) {
    alert(e.message);
  }
}

// Small helper
function escapeHTML(s) {
  return s.replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[m]));
}

// ---------- WIRE UP PER PAGE ----------
document.addEventListener("DOMContentLoaded", async () => {
  if (onIndex) {
    document.getElementById("login-btn").addEventListener("click", handleLogin);
    document.getElementById("signup-btn").addEventListener("click", handleSignup);
    wirePasswordToggle();
  }
  if (onHome) {
    await ensureLoggedInForHome();
    wireMenuAndDarkMode();
    wireEditor();
    await loadPosts();
  }
});
</script>
