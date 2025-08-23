// =============== AUTH ===============
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    document.getElementById("error").innerText = error.message;
  } else {
    window.location.href = "home.html";
  }
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

// =============== POSTS ===============
async function fetchPosts() {
  const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
  const container = document.getElementById("postsContainer");
  container.innerHTML = "";

  data.forEach(post => {
    const div = document.createElement("div");
    div.className = "post";
    div.innerHTML = `
      <p>${post.text}</p>
      ${post.image_url ? `<img src="${post.image_url}" alt="post image">` : ""}
      <button onclick="deletePost('${post.id}')">Delete</button>
    `;
    container.appendChild(div);
  });
}

async function createPost() {
  const text = document.getElementById("postText").value;
  const file = document.getElementById("postImage").files[0];
  let imageUrl = null;

  if (file) {
    const { data, error } = await supabase.storage.from("images").upload(`public/${Date.now()}-${file.name}`, file);
    if (!error) {
      imageUrl = `${SUPABASE_URL}/storage/v1/object/public/images/${data.path}`;
    }
  }

  await supabase.from("posts").insert([{ text, image_url: imageUrl }]);
  closeEditor();
  fetchPosts();
}

async function deletePost(id) {
  await supabase.from("posts").delete().eq("id", id);
  fetchPosts();
}

// =============== UI HANDLING ===============
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("postsContainer")) {
    fetchPosts();
  }

  // menu toggle
  document.getElementById("menuBtn").addEventListener("click", () => {
    document.getElementById("sideMenu").classList.toggle("hidden");
  });

  // dark mode toggle
  const darkToggle = document.getElementById("darkToggle");
  if (darkToggle) {
    darkToggle.addEventListener("change", () => {
      document.body.classList.toggle("dark", darkToggle.checked);
    });
  }

  // add button
  const addBtn = document.getElementById("addBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      document.getElementById("editorModal").classList.remove("hidden");
    });
  }
});

function closeEditor() {
  document.getElementById("editorModal").classList.add("hidden");
}
  
