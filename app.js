// === LOGIN ===
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        document.getElementById("error-msg").innerText = error.message;
      } else {
        // Redirect to home
        window.location.href = "home.html";
      }
    });
  }

  // === HOME PAGE LOGIC ===
  if (window.location.pathname.includes("home.html")) {
    checkUser();
    fetchPosts();

    document.getElementById("logout-btn").addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "index.html";
    });

    const addBtn = document.getElementById("add-btn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        document.getElementById("editor").classList.remove("hidden");
      });
    }

    const postBtn = document.getElementById("post-btn");
    if (postBtn) {
      postBtn.addEventListener("click", createPost);
    }
  }
});

// === RESTRICT ADMIN FEATURES ===
async function checkUser() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const isAdmin = user.email === "abhayrangappanvat@gmail.com";

  if (!isAdmin) {
    document.getElementById("add-btn").style.display = "none"; // hide add button
  }
}

// === FETCH POSTS ===
async function fetchPosts() {
  const { data: posts, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
  const postsContainer = document.getElementById("posts");
  postsContainer.innerHTML = "";

  if (error) {
    postsContainer.innerHTML = `<p>Error: ${error.message}</p>`;
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user && user.email === "abhayrangappanvat@gmail.com";

  posts.forEach(post => {
    const div = document.createElement("div");
    div.className = "post";
    div.innerHTML = `
      <p>${post.text}</p>
      ${post.image_url ? `<img src="${post.image_url}" alt="Post image">` : ""}
      ${isAdmin ? `<button onclick="deletePost('${post.id}')">Delete</button>` : ""}
    `;
    postsContainer.appendChild(div);
  });
}

// === CREATE POST (only for admin) ===
async function createPost() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== "abhayrangappanvat@gmail.com") {
    alert("Only admin can post.");
    return;
  }

  const text = document.getElementById("post-text").value;
  const fileInput = document.getElementById("post-image");
  let imageUrl = null;

  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("images").upload(fileName, file);

    if (uploadError) {
      alert("Image upload failed: " + uploadError.message);
      return;
    }
    imageUrl = `https://kfgjkkprfppnewhehzfr.supabase.co/storage/v1/object/public/images/${fileName}`;
  }

  const { error } = await supabase.from("posts").insert([{ text, image_url: imageUrl }]);

  if (error) {
    alert("Post failed: " + error.message);
  } else {
    document.getElementById("editor").classList.add("hidden");
    fetchPosts();
  }
}

// === DELETE POST (only for admin) ===
async function deletePost(id) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== "abhayrangappanvat@gmail.com") {
    alert("Only admin can delete.");
    return;
  }

  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (!error) fetchPosts();
}
