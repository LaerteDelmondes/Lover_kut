// public/app.js
const api = {
  get: async (url) => (await fetch(url, { credentials: 'include' })).json(),
  post: async (url, body) => {
    return (await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })).json();
  },
  upload: async (url, formData) => {
    return (await fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: formData
    })).json();
  }
};

const app = document.getElementById('app');
const topActions = document.getElementById('top-actions');

async function init(){
  await renderHeader();
  const me = await api.get('/api/me');
  if (!me.user) renderAuth();
  else renderHome(me.user);
}

async function renderHeader(){
  const me = await api.get('/api/me');
  topActions.innerHTML = '';
  if (!me.user){
    topActions.innerHTML = `<button class="btn" id="btn-login">Entrar / Registrar</button>`;
    document.getElementById('btn-login').onclick = () => renderAuth();
  } else {
    topActions.innerHTML = `
      <span style="margin-right:12px">Olá, ${escapeHtml(me.user.name)}</span>
      <button class="btn ghost" id="btn-logout">Sair</button>
    `;
    document.getElementById('btn-logout').onclick = async () => {
      await api.post('/api/logout', {});
      init();
    }
  }
}

function escapeHtml(s = '') {
  return s.replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
}

/* ---------- Auth UI ---------- */
function renderAuth(){
  document.title = 'Entrar - Orkut-like';
  app.innerHTML = `
    <div style="max-width:520px;margin:0 auto">
      <div class="panel">
        <h2>Entrar</h2>
        <div style="margin-bottom:8px"><input id="email" placeholder="email" style="width:100%;padding:8px;border-radius:6px;border:1px solid #e4eef8"></div>
        <div style="margin-bottom:8px"><input id="password" type="password" placeholder="senha" style="width:100%;padding:8px;border-radius:6px;border:1px solid #e4eef8"></div>
        <div style="display:flex;gap:8px">
          <button class="btn" id="btn-do-login">Entrar</button>
          <button class="btn ghost" id="btn-show-register">Registrar</button>
        </div>
      </div>
      <div id="register-box" style="display:none;margin-top:12px" class="panel">
        <h2>Registrar</h2>
        <input id="reg-name" placeholder="nome" style="width:100%;padding:8px;border-radius:6px;border:1px solid #e4eef8;margin-bottom:8px">
        <input id="reg-email" placeholder="email" style="width:100%;padding:8px;border-radius:6px;border:1px solid #e4eef8;margin-bottom:8px">
        <input id="reg-pass" type="password" placeholder="senha" style="width:100%;padding:8px;border-radius:6px;border:1px solid #e4eef8;margin-bottom:8px">
        <div style="display:flex;gap:8px">
          <button class="btn" id="btn-do-register">Criar conta</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-do-login').onclick = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const res = await api.post('/api/login', { email, password });
    if (res.error) return alert('Falha ao entrar');
    await renderHeader();
    renderHome(res.user);
  };

  document.getElementById('btn-show-register').onclick = () => {
    document.getElementById('register-box').style.display = 'block';
  };

  document.getElementById('btn-do-register').onclick = async () => {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;
    const res = await api.post('/api/register', { name, email, password });
    if (res.error) return alert('Erro ao registrar: ' + res.error);
    await renderHeader();
    const me = await api.get('/api/me');
    renderHome(me.user);
  };
}

/* ---------- Home (feed) ---------- */
async function renderHome(me){
  document.title = 'Início - Orkut-like';
  const friends = await api.get('/api/friends');
  const communities = await api.get('/api/communities');
  app.innerHTML = `
    <aside>
      <div class="panel">
        <div class="profile-compact">
          <img src="${me.avatar || '/placeholder-avatar.png'}" alt="avatar" />
          <div>
            <div class="name">${escapeHtml(me.name)}</div>
            <div class="bio">${escapeHtml(me.bio||'')}</div>
          </div>
        </div>
        <div style="margin-top:8px">
          <label class="small">Alterar avatar</label>
          <input type="file" id="avatar-file" style="display:block;margin-top:6px">
          <button class="btn small" id="btn-upload-avatar">Enviar</button>
        </div>
      </div>

      <div class="panel" style="margin-top:12px">
        <h3>Amigos</h3>
        <div id="friends-list">
          ${friends.friends.map(f=>`
            <div class="list-item">
              <img src="${f.avatar||'/placeholder-avatar.png'}"><div>${escapeHtml(f.name)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="panel" style="margin-top:12px">
        <h3>Comunidades</h3>
        <div id="communities-list">
          ${communities.communities.map(c=>`
            <div class="list-item">
              <div style="flex:1">
                <div style="font-weight:700">${escapeHtml(c.name)}</div>
                <div style="color:var(--muted);font-size:0.9rem">${escapeHtml(c.description)}</div>
              </div>
              <button class="btn small" data-join="${c.id}">Abrir</button>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:8px">
          <input id="new-community-name" placeholder="nova comunidade..." style="width:100%;padding:8px;border-radius:6px;border:1px solid #e4eef8">
          <button class="btn small" id="btn-create-community" style="margin-top:6px">Criar</button>
        </div>
      </div>
    </aside>

    <section>
      <div class="panel">
        <div class="feed-header">
          <h2>Recados</h2>
        </div>
        <div class="card-post">
          <textarea id="post-content" placeholder="Escreva um recado..."></textarea>
          <div style="display:flex;justify-content:flex-end;margin-top:8px">
            <button class="btn" id="btn-post">Publicar</button>
          </div>
        </div>
        <div id="posts-list"></div>
      </div>

      <div class="panel" style="margin-top:12px">
        <h3>Depoimentos</h3>
        <div id="testimonials"></div>
        <div style="margin-top:8px">
          <select id="test-to" style="width:100%;padding:8px;border-radius:6px;border:1px solid #e4eef8">
            <option value="">Escolha um amigo...</option>
            ${friends.friends.map(f=>`<option value="${f.id}">${escapeHtml(f.name)}</option>`).join('')}
          </select>
          <textarea id="test-msg" placeholder="Escreva um depoimento..." style="margin-top:8px"></textarea>
          <button class="btn" id="btn-testimonial" style="margin-top:8px">Enviar depoimento</button>
        </div>
      </div>
    </section>
  `;

  // avatar upload
  document.getElementById('btn-upload-avatar').onclick = async () => {
    const file = document.getElementById('avatar-file').files[0];
    if (!file) return alert('Escolha um arquivo');
    const fd = new FormData();
    fd.append('avatar', file);
    const res = await api.upload('/api/upload-avatar', fd);
    if (res.ok) {
      await renderHeader();
      const me2 = await api.get('/api/me');
      renderHome(me2.user);
    } else alert('Erro upload');
  };

  // create community
  document.getElementById('btn-create-community').onclick = async () => {
    const name = document.getElementById('new-community-name').value;
    if (!name) return;
    await api.post('/api/communities', { name, description: '' });
    renderHome(await api.get('/api/me').then(r=>r.user));
  };

  // community open buttons
  document.querySelectorAll('[data-join]').forEach(btn => {
    btn.onclick = (e) => {
      const id = btn.getAttribute('data-join');
      renderCommunity(id);
    }
  });

  // post
  document.getElementById('btn-post').onclick = async () => {
    const content = document.getElementById('post-content').value;
    if (!content) return;
    await api.post('/api/posts', { target_user_id: me.id, content });
    document.getElementById('post-content').value = '';
    loadPosts(me.id);
  };

  // testimonials
  document.getElementById('btn-testimonial').onclick = async () => {
    const to = document.getElementById('test-to').value;
    const msg = document.getElementById('test-msg').value;
    if (!to || !msg) return alert('Escolha amigo e escreva depoimento');
    await api.post('/api/testimonials', { to_user: to, message: msg });
    document.getElementById('test-msg').value = '';
    loadTestimonials(me.id);
  };

  loadPosts(me.id);
  loadTestimonials(me.id);
}

async function loadPosts(userId){
  const posts = await api.get('/api/posts/' + userId);
  const el = document.getElementById('posts-list');
  el.innerHTML = posts.posts.map(p => `
    <div class="card-post">
      <div style="display:flex;gap:10px;align-items:center">
        <img src="${p.author_avatar || '/placeholder-avatar.png'}" style="width:48px;height:48px;border-radius:6px;object-fit:cover">
        <div>
          <div style="font-weight:700">${escapeHtml(p.author_name)}</div>
          <div style="color:var(--muted);font-size:0.85rem">${new Date(p.created_at).toLocaleString()}</div>
        </div>
      </div>
      <div style="margin-top:8px">${escapeHtml(p.content)}</div>
      <div style="display:flex;gap:8px;margin-top:8px;align-items:center">
        <button class="btn small like-btn" data-id="${p.id}">Curtir (${p.likes||0})</button>
      </div>
    </div>
  `).join('');
  document.querySelectorAll('.like-btn').forEach(b=>{
    b.onclick = async () => {
      await api.post('/api/posts/' + b.getAttribute('data-id') + '/like', {});
      loadPosts(userId);
    }
  });
}

async function loadTestimonials(userId){
  const res = await api.get('/api/testimonials/' + userId);
  const el = document.getElementById('testimonials');
  el.innerHTML = res.testimonials.map(t=>`
    <div style="padding:8px;border-bottom:1px dashed #eef6fb">
      <div style="display:flex;gap:8px;align-items:center">
        <img src="${t.from_avatar || '/placeholder-avatar.png'}" style="width:36px;height:36px;border-radius:6px;object-fit:cover">
        <div style="font-weight:700">${escapeHtml(t.from_name)}</div>
        <div style="color:var(--muted);font-size:0.85rem;margin-left:auto">${new Date(t.created_at).toLocaleString()}</div>
      </div>
      <div style="margin-top:6px">${escapeHtml(t.message)}</div>
    </div>
  `).join('');
}

/* ---------- Community view ---------- */
async function renderCommunity(id){
  const communityRes = await api.get('/api/communities');
  const com = communityRes.communities.find(c=>c.id === id);
  const postsRes = await api.get(`/api/communities/${id}/posts`);
  document.title = `${com.name} - Comunidade`;
  app.innerHTML = `
    <div class="panel">
      <button class="btn ghost" id="btn-back">Voltar</button>
      <h2>${escapeHtml(com.name)}</h2>
      <div style="color:var(--muted)">${escapeHtml(com.description)}</div>
      <div style="margin-top:12px">
        <textarea id="community-post" placeholder="Escreva na comunidade..."></textarea>
        <div style="display:flex;justify-content:flex-end;margin-top:8px">
          <button class="btn" id="btn-community-post">Publicar</button>
        </div>
      </div>
      <div id="community-posts" style="margin-top:12px">
        ${postsRes.posts.map(p=>`
          <div class="card-post">
            <div style="display:flex;gap:10px;align-items:center">
              <img src="${p.author_avatar || '/placeholder-avatar.png'}" style="width:44px;height:44px;border-radius:6px;object-fit:cover">
              <div>
                <div style="font-weight:700">${escapeHtml(p.author_name)}</div>
                <div style="color:var(--muted);font-size:0.85rem">${new Date(p.created_at).toLocaleString()}</div>
              </div>
            </div>
            <div style="margin-top:8px">${escapeHtml(p.content)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.getElementById('btn-back').onclick = init;
  document.getElementById('btn-community-post').onclick = async () => {
    const content = document.getElementById('community-post').value;
    if (!content) return;
    await api.post(`/api/communities/${id}/posts`, { content });
    renderCommunity(id);
  };
}

/* ---------- init ---------- */
init();
