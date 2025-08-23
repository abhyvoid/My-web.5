  import { supabase } from "./supabase.js";

// ADMIN email
const ADMIN_EMAIL = "abhayrangappanvat@gmail.com";

// ====================== AUTH ======================

// Sign up
async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    alert("Signup failed: " + error.message);
  } else {
    alert("Signup successful! Check your email.");
  }
}

// Login
async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert("Login failed: " + error.message);
  } else {
    window.location.href = "home.html"; // go to home after login
  }
}

// Logout
async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html"; // back to login
}

// Watch auth state
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session) {
    console.log("Logged in:", session.user.email);
  } else {
    console.log("Logged out");
  }
});

// ====================== POSTS ======================

// Create a post
async function createPost(text, file) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert("Login first!");
    return;
  }

  let imageUrl = null;
  if (file) {
    imageUrl = await uploadImage(file);
  }

  const { error } = await supabase.from("posts").insert([
    { text, image_url: imageUrl, user_id: user.id, author: user.email }
  ]);

  if (error) {
    console.error("Post error:", error.message);
  } else {
    fetchPosts();
  }
}

// Fetch posts
async function fetchPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const postsDiv = document.getElementById("posts");
  postsDiv.innerHTML = "";
  data.forEach(post => {
    let div = document.createElement("div");
    div.className = "post";

    div.innerHTML = `
      <p>${post.text}</p>
      ${post.image_url ? `<img src="${post.image_url}" width="200">` : ""}
      <small>by ${post.author}</small>
      ${post.author === ADMIN_EMAIL ? `<button onclick="deletePost('${post.id}')">Delete</button>` : ""}
    `;
    postsDiv.appendChild(div);
  });
}

// Delete post (admin only)
async function deletePost(postId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user.email !== ADMIN_EMAIL) {
    alert("You cannot delete this post.");
    return;
  }

  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) {
    console.error(error);
  } else {
    fetchPosts();
  }
}

// ====================== STORAGE ======================

async function uploadImage(file) {
  const filePath = `public/${Date.now()}-${file.name}`;
  let { error } = await supabase.storage.from("images").upload(filePath, file);

  if (error) {
    alert("Upload failed: " + error.message);
    return null;
  }

  const { data } = supabase.storage.from("images").getPublicUrl(filePath);
  return data.publicUrl;
}

// ====================== MENU & DARK MODE ======================

function toggleMenu() {
  document.getElementById("menu").classList.toggle("open");
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

// ====================== EXPORT ======================

window.signUp = signUp;
window.signIn = signIn;
window.logout = logout;
window.createPost = createPost;
window.fetchPosts = fetchPosts;
window.deletePost = deletePost;
window.toggleMenu = toggleMenu;
window.toggleDarkMode = toggleDarkMode;
