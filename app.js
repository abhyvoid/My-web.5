      // ===== Common =====
const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));

const goto = (page) => { window.location.href = page; };
const setTheme = (mode) => {
  document.body.classList.toggle('theme-dark', mode === 'dark');
  document.body.classList.toggle('theme-light', mode !== 'dark');
  localStorage.setItem('theme', mode);
};
const initTheme = () => setTheme(localStorage.getItem('theme') || 'light');

// ===== Index (Login) =====
async function initLoginPage() {
  initTheme();

  const email = qs('#email');
  const password = qs('#password');
  const togglePass = qs('#toggle-pass');
  const loginBtn = qs('#login-btn');
  const signupBtn = qs('#signup-btn');
  const err = qs('#error-msg');

  if (!email) return; // not on this page

  togglePass?.addEventListener('click', () => {
    const visible = password.type === 'text';
    password.type = visible ? 'password' : 'text';
    togglePass.classList.toggle('active', !visible);
  });

  loginBtn.addEventListener('click', async () => {
    err.textContent = '';
    const { data, error } = await sb.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value
    });
    if (error) { err.textContent = error.message; return; }
    goto('home.html');
  });

  signupBtn.addEventListener('click', async () => {
    err.textContent = '';
    const { error } = await sb.auth.signUp({
      email: email.value.trim(),
      password: password.value
    });
    if (error) { err.textContent = error.message; return; }
    err.textContent = 'Signup successful. Check your inbox to confirm, then Login.';
  });

  // If already logged in → go home
  const { data: { session } } = await sb.auth.getSession();
  if (session) goto('home.html');
}

// ===== Home =====
function renderPostItem(post, isAdmin, myId) {
  const li = document.createElement('li');
  li.className = 'post';
  li.dataset.id = post.id;

  const date = new Date(post.created_at).toLocaleString();
  li.innerHTML = `
    <div class="meta">
      <span>${post.username || 'user'}</span>
      <span>${date}</span>
    </div>
    ${post.image_url ? `<img src="${post.image_url}" alt="">` : ''}
    <div class="text">${(post.text || '').replace(/</g,'&lt;')}</div>
    <div class="actions">
      <button class="icon-btn like">❤ <span>${post.likes_count || 0}</span></button>
      ${isAdmin ? `<button class="icon-btn del">Delete</button>` : ''}
    </div>
    <div class="actions">
      <input class="input comment-input" placeholder="comment" />
      <button class="icon-btn send">Send</button>
    </div>
    <ul class="post-list comments"></ul>
  `;

  // Like
  li.querySelector('.like').addEventListener('click', async () => {
    const { error } = await sb.from('likes').upsert({
      post_id: post.id, user_id: myId
    }, { onConflict: 'post_id,user_id' });
    if (error) return;
    await refreshPosts(); // simple refresh
  });

  // Delete (admin)
  li.querySelector('.del')?.addEventListener('click', async () => {
    if (!confirm('Delete this post?')) return;
    await sb.from('posts').delete().eq('id', post.id);
    await refreshPosts();
  });

  // Comment
  li.querySelector('.send').addEventListener('click', async () => {
    const input = li.querySelector('.comment-input');
    const text = input.value.trim();
    if (!text) return;
    await sb.from('comments').insert({ post_id: post.id, text });
    input.value = '';
    await refreshPosts();
  });

  return li;
}

async function refreshPosts() {
  const postsUL = qs('#posts');
  if (!postsUL) return;

  const { data: sessionData } = await sb.auth.getSession();
  const user = sessionData?.session?.user;
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Fetch posts + counts
  const { data: posts, error } = await sb
    .from('posts')
    .select(`
      id, text, image_url, created_at, user_id,
      users:auth.users(email),
      likes:likes(count),
      comments:comments(id,text,created_at)
    `)
    .order('created_at', { ascending: false });

  // If the select with nested relations is restricted in your RLS, use the flat version below instead:
  // const { data: posts } = await sb.from('posts').select('*').order('created_at', { ascending:false });

  postsUL.innerHTML = '';
  if (!posts || error) return;

  // Massage data
  const simple = posts.map(p => ({
    id: p.id,
    text: p.text,
    image_url: p.image_url,
    created_at: p.created_at,
    username: (p.users?.email || '').split('@')[0],
    likes_count: Array.isArray(p.likes) ? p.likes[0]?.count ?? 0 : 0,
    comments: p.comments || []
  }));

  simple.forEach(p => {
    const li = renderPostItem(p, isAdmin, user?.id);
    // render comments
    const clist = li.querySelector('.comments');
    p.comments
      .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
      .forEach(c=>{
        const ci = document.createElement('li');
        ci.className='post';
        ci.innerHTML = `<div class="text" style="margin:0">${c.text.replace(/</g,'&lt;')}</div>`;
        clist.appendChild(ci);
      });
    postsUL.appendChild(li);
  });

  // FAB visibility
  qs('#fab')?.classList.toggle('show', isAdmin);
}

async function initHomePage() {
  initTheme();

  // redirect if not logged in
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { goto('index.html'); return; }

  const isAdmin = session.user?.email === ADMIN_EMAIL;

  // Menu
  const menuBtn = qs('#menu-btn');
  const side = qs('#side-menu');
  menuBtn?.addEventListener('click', () => side.classList.toggle('open'));
  side?.addEventListener('click', (e)=>{ if(e.target===side) side.classList.remove('open'); });

  // Logout
  qs('#logout-btn')?.addEventListener('click', async ()=>{
    await sb.auth.signOut();
    goto('index.html');
  });

  // Theme toggle
  const themeBtn = qs('#theme-toggle');
  const now = localStorage.getItem('theme') || 'light';
  if (now === 'dark') document.body.classList.add('theme-dark');
  themeBtn?.addEventListener('click', ()=>{
    const mode = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
    setTheme(mode);
  });

  // FAB + Editor (admin only)
  const fab = qs('#fab');
  const sheet = qs('#editor');
  const imgInput = qs('#image-input');
  const imgPrev = qs('#img-preview');
  const textEl = qs('#post-text');
  const submit = qs('#post-submit');
  const cancel = qs('#post-cancel');
  const perr = qs('#post-error');

  if (isAdmin) {
    fab.classList.add('show');
    fab.addEventListener('click', ()=> sheet.classList.add('open'));
    cancel.addEventListener('click', ()=> { sheet.classList.remove('open'); imgPrev.innerHTML=''; imgInput.value=''; textEl.value=''; perr.textContent=''; });

    imgInput.addEventListener('change', ()=>{
      imgPrev.innerHTML='';
      const f = imgInput.files?.[0];
      if (f) {
        const url = URL.createObjectURL(f);
        const im = new Image(); im.src = url; imgPrev.appendChild(im);
      }
    });

    submit.addEventListener('click', async ()=>{
      perr.textContent='';
      const text = textEl.value.trim();
      let image_url = '';

      // upload if image chosen
      const file = imgInput.files?.[0];
      if (file) {
        const ext = file.name.split('.').pop();
        const path = `images/${uuid()}.${ext}`;
        const { error: upErr } = await sb.storage.from('images').upload(path, file, { upsert:false });
        if (upErr) { perr.textContent = upErr.message; return; }
        const { data } = sb.storage.from('images').getPublicUrl(path);
        image_url = data.publicUrl;
      }

      const { error: insErr } = await sb.from('posts').insert({ text, image_url });
      if (insErr) { perr.textContent = insErr.message; return; }
      sheet.classList.remove('open');
      imgPrev.innerHTML=''; imgInput.value=''; textEl.value='';
      await refreshPosts();
    });
  }

  // Initial load
  await refreshPosts();
}

// ===== Router by page =====
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.login-card')) initLoginPage();
  else initHomePage();
});
