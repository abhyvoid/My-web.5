import {
  auth, db, storage, onAuthStateChanged, signOut,
  collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc,
  serverTimestamp, query, orderBy, arrayUnion, arrayRemove,
  ref, uploadBytes, getDownloadURL, deleteObject, refFromURL
} from './firebase.js';

// ---------- Auth guard ----------
const ADMIN_EMAIL = "abhayrangappanvat@gmail.com";
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    // not logged in -> back to login
    location.replace('index.html');
    return;
  }
  currentUser = user;
  document.getElementById('youTag').hidden = false;
  initUIForUser(user);
  startPostsStream();
});

// ---------- UI wiring ----------
const drawer = document.getElementById('drawer');
const menuToggle = document.getElementById('menuToggle');
const closeDrawer = document.getElementById('closeDrawer');
const logoutBtn = document.getElementById('logoutBtn');
const darkToggle = document.getElementById('darkToggle');
const fab = document.getElementById('fab');
const dialog = document.getElementById('postDialog');
const postForm = document.getElementById('postForm');
const postText = document.getElementById('postText');
const postImage = document.getElementById('postImage');
const postsEl = document.getElementById('posts');

menuToggle.onclick = () => drawer.classList.add('open');
closeDrawer.onclick = () => drawer.classList.remove('open');

logoutBtn.onclick = async () => {
  await signOut(auth);
  // onAuthStateChanged will redirect
};

// Dark mode toggle + persist
const THEME_KEY = "mw-theme";
const applyTheme = (dark) => {
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
};
darkToggle.addEventListener('change', (e) => applyTheme(e.target.checked));
(() => {
  const isDark = localStorage.getItem(THEME_KEY) === 'dark';
  applyTheme(isDark);
  darkToggle.checked = isDark;
})();

function initUIForUser(user) {
  // Show FAB only for admin
  if (user.email === ADMIN_EMAIL) {
    fab.style.display = 'grid';
  } else {
    fab.style.display = 'none';
  }
}

// Dialog open/close
fab.onclick = () => dialog.showModal();
document.getElementById('cancelPost').onclick = () => dialog.close();

// Create post
postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (currentUser?.email !== ADMIN_EMAIL) { alert("Only admin can post."); return; }

  const text = postText.value.trim();
  const file = postImage.files[0] || null;
  if (!text && !file) { alert("Write something or select an image."); return; }

  let imageUrl = "";
  try {
    if (file) {
      const storageRef = ref(storage, `posts/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(storageRef);
    }

    await addDoc(collection(db, 'posts'), {
      text,
      imageUrl,
      email: currentUser.email,
      createdAt: serverTimestamp(),
      likes: [],          // array of emails
      comments: []        // array of {email, text, ts}
    });
    postText.value = "";
    postImage.value = "";
    dialog.close();
  } catch (err) {
    alert(err.message);
  }
});

// ---------- Realtime posts stream ----------
let unsubscribe = null;
function startPostsStream() {
  if (unsubscribe) unsubscribe();
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  unsubscribe = onSnapshot(q, (snap) => {
    postsEl.innerHTML = "";
    snap.forEach((docSnap) => {
      const p = { id: docSnap.id, ...docSnap.data() };
      postsEl.appendChild(renderPost(p));
    });
  });
}

// ---------- Post rendering & actions ----------
function renderPost(p) {
  const card = document.createElement('div');
  card.className = 'card post';

  // text
  if (p.text) {
    const t = document.createElement('div');
    t.className = 'post-text';
    t.textContent = p.text;
    card.appendChild(t);
  }

  // image
  if (p.imageUrl) {
    const img = document.createElement('img');
    img.className = 'post-img';
    img.src = p.imageUrl;
    img.alt = "post image";
    card.appendChild(img);
  }

  // actions row (like + count)
  const row = document.createElement('div');
  row.className = 'row';

  const likeBtn = document.createElement('button');
  likeBtn.className = 'icon-btn';
  likeBtn.textContent = hasLiked(p) ? '❤️' : '🤍';
  const count = document.createElement('span');
  count.textContent = ` ${p.likes?.length || 0}`;
  likeBtn.onclick = () => toggleLike(p);

  row.appendChild(likeBtn);
  row.appendChild(count);
  card.appendChild(row);

  // comment input
  const cWrap = document.createElement('div');
  cWrap.className = 'comment-wrap';
  const cInput = document.createElement('input');
  cInput.placeholder = "Write a comment…";
  cInput.className = 'input';
  cInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addComment(p.id, cInput.value.trim());
  });
  cWrap.appendChild(cInput);
  card.appendChild(cWrap);

  // comments list
  const list = document.createElement('div');
  list.className = 'comments';
  (p.comments || []).slice().reverse().forEach(c => {
    const item = document.createElement('div');
    item.className = 'comment';
    item.innerHTML = `<b>${c.email}</b> ${escapeHtml(c.text)}`;
    list.appendChild(item);
  });
  card.appendChild(list);

  // delete (only owner)
  if (currentUser && p.email === currentUser.email) {
    const del = document.createElement('button');
    del.className = 'btn danger small';
    del.textContent = "Delete";
    del.onclick = () => deletePost(p);
    card.appendChild(del);
  }

  return card;

  function hasLiked(post) {
    return (post.likes || []).includes(currentUser?.email);
  }
}

async function toggleLike(post) {
  try {
    const docRef = doc(db, 'posts', post.id);
    const you = currentUser?.email;
    const liked = (post.likes || []).includes(you);
    await updateDoc(docRef, {
      likes: liked ? arrayRemove(you) : arrayUnion(you)
    });
  } catch (e) {
    alert(e.message);
  }
}

async function addComment(postId, text) {
  if (!text) return;
  try {
    const docRef = doc(db, 'posts', postId);
    await updateDoc(docRef, {
      comments: arrayUnion({ email: currentUser.email, text, ts: Date.now() })
    });
  } catch (e) {
    alert(e.message);
  }
}

async function deletePost(post) {
  if (!confirm("Delete this post?")) return;
  try {
    if (post.imageUrl) {
      // delete by URL
      const imgRef = refFromURL(storage, post.imageUrl);
      await deleteObject(imgRef);
    }
    await deleteDoc(doc(db, 'posts', post.id));
  } catch (e) {
    alert(e.message);
  }
}

// basic escape for comments
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[s]));
}
