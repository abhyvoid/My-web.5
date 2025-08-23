  // app.js
// Uses global `window.supabase` from supabase.js
const BUCKET = 'images';

// ---------- helpers ----------
const $ = (sel) => document.querySelector(sel);
const el = (tag, props = {}, kids = []) => {
  const n = Object.assign(document.createElement(tag), props);
  kids.forEach(k => n.appendChild(k));
  return n;
};
const fmtTime = (iso) =>
  new Date(iso).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });

// ---------- theme ----------
const body = document.body;
const themeToggle = $('#themeToggle');
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') { body.classList.add('dark'); themeToggle.checked = true; }
themeToggle.addEventListener('change', () => {
  body.classList.toggle('dark', themeToggle.checked);
  localStorage.setItem('theme', themeToggle.checked ? 'dark' : 'light');
});

// ---------- menu ----------
const sideMenu = $('#sideMenu');
const sideMask = $('#sideMask');
$('#menuBtn').onclick = () => { sideMenu.classList.add('open'); sideMask.classList.add('show'); };
$('#closeMenu').onclick = () => { sideMenu.classList.remove('open'); sideMask.classList.remove('show'); };
sideMask.onclick = () => { sideMenu.classList.remove('open'); sideMask.classList.remove('show'); };

// ---------- auth modal ----------
const authModal = $('#authModal');
const authMask = $('#authMask');
const openAuth = () => { authModal.classList.add('show'); authMask.classList.add('show'); };
const closeAuth = () => { authModal.classList.remove('show'); authMask.classList.remove('show'); $('#authError').textContent=''; };
$('#loginOpen').onclick = openAuth;
$('#authClose').onclick = closeAuth;
authMask.onclick = closeAuth;

$('#authSubmit').onclick = async () => {
  const email = $('#authEmail').value.trim();
  const password = $('#authPassword').value;
  const createNew = $('#authNew').checked;
  $('#authError').textContent = '';
  try {
    let res;
    if (createNew) {
      res = await supabase.auth.signUp({ email, password });
      if (res.error) throw res.error;
    }
    res = await supabase.auth.signInWithPassword({ email, password });
    if (res.error) throw res.error;
    closeAuth();
  } catch (e) {
    $('#authError').textContent = e.message || 'Auth failed';
  }
};

$('#logoutBtn').onclick = async () => {
  await supabase.auth.signOut();
};

// ---------- editor modal ----------
const editor = $('#editor');
const editorMask = $('#editorMask');
const openEditor = () => { editor.classList.add('show'); editorMask.classList.add('show'); $('#editorError').textContent=''; };
const closeEditor = () => { editor.classList.remove('show'); editorMask.classList.remove('show'); $('#postText').value=''; $('#postImage').value=''; };
$('#editorClose').onclick = closeEditor;
editorMask.onclick = closeEditor;

$('#addBtn').onclick = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // force login first
    sideMenu.classList.add('open'); sideMask.classList.add('show'); openAuth();
    return;
  }
  openEditor();
};

// ---------- state / UI ----------
const feed = $('#feed');
const empty = $('#emptyState');
const profileRow = $('#profileRow');
const profileEmail = $('#profileEmail');
const loginOpen = $('#loginOpen');
const logoutBtn = $('#logoutBtn');
const addBtn = $('#addBtn');

async function refreshSessionUI() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    profileRow.classList.remove('hidden');
    profileEmail.textContent = user.email || user.id;
    loginOpen.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    addBtn.style.display = 'inline-flex';
  } else {
    profileRow.classList.add('hidden');
    loginOpen.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    addBtn.style.display = 'none';
  }
}

supabase.auth.onAuthStateChange((_event, _session) => {
  refreshSessionUI();
  loadPosts();
});

// ---------- load & render posts ----------
async function loadPosts() {
  feed.innerHTML = '';
  const { data, error } = await supabase.from('posts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    empty.classList.remove('hidden');
    empty.textContent = error.message;
    return;
  }
  if (!data || data.length === 0) {
    empty.classList.remove('hidden');
    empty.textContent = 'No posts yet';
    return;
  }
  empty.classList.add('hidden');
  const { data: { user } } = await supabase.auth.getUser();
  data.forEach(p => feed.appendChild(renderCard(p, user)));
}

function renderCard(post, currentUser) {
  const isOwner = currentUser && post.user_id === currentUser.id;

  const head = el('div', { className: 'card-head' }, [
    el('div', { textContent: 'my web' }),
    el('div', { className: 'card-time', textContent: fmtTime(post.created_at) })
  ]);

  const text = el('div', { className: 'card-text', textContent: post.text || '' });
  const img = post.image_url ? el('img', { src: post.image_url, alt: 'image' }) : null;

  const actions = el('div', { className: 'post-actions' });
  if (isOwner) {
    const del = el('button', { className: 'btn danger', textContent: 'Delete' });
    del.onclick = () => deletePost(post.id);
    actions.appendChild(del);
  }

  const card = el('article', { className: 'card' }, [head, text]);
  if (img) card.appendChild(img);
  card.appendChild(actions);
  return card;
}

// ---------- upload + create post ----------
$('#postSubmit').onclick = async () => {
  $('#editorError').textContent = '';
  const text = $('#postText').value.trim();
  const file = $('#postImage').files[0];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { $('#editorError').textContent = 'Please log in'; return; }

  let publicUrl = null;
  try {
    if (file) {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext || 'jpg'}`;
      const up = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      if (up.error) throw up.error;
      const urlRes = supabase.storage.from(BUCKET).getPublicUrl(path);
      if (urlRes.error) throw urlRes.error;
      publicUrl = urlRes.data.publicUrl;
    }

    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      text,
      image_url: publicUrl
    });
    if (error) throw error;

    closeEditor();
    loadPosts();
  } catch (e) {
    $('#editorError').textContent = e.message || 'Failed to post';
  }
};

// ---------- delete post ----------
async function deletePost(id) {
  const ok = confirm('Delete this post?');
  if (!ok) return;
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) {
    alert(error.message);
    return;
  }
  loadPosts();
}

// init
refreshSessionUI();
loadPosts();
