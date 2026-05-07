// ── Estado global ────────────────────────────────────────────
const app = {
  session:         null,
  posts:           [],
  currentCategory: "Todos",
  currentView:     "tablon",   // tablon | misreportes | notificaciones | admin
  chatReporteId:   null,
};

// ── Helpers UI ───────────────────────────────────────────────
function $(id) { return document.getElementById(id); }

function setLoginError(msg) {
  const el = $("loginError");
  el.textContent = msg;
  el.classList.remove("hidden");
}
function clearLoginError() { $("loginError").classList.add("hidden"); }

// ── Mostrar app según tipo ────────────────────────────────────
function showApp(sessionData) {
  app.session = sessionData;
  $("loginScreen").classList.add("hidden");
  $("appSection").classList.remove("hidden");
  $("userLabel").textContent = sessionData.noControl;

  if (sessionData.tipo === "administrador") {
    document.body.classList.add("admin-mode");
  }

  $("navTabs").classList.remove("hidden");
  $("vistaEstudiante").classList.remove("hidden");
  showView("tablon");
}

function showLogin() {
  app.session = null;
  document.body.classList.remove("admin-mode");
  $("appSection").classList.add("hidden");
  $("loginScreen").classList.remove("hidden");
  $("loginInput").value = "";
  $("passwordInput").value = "";
  $("passwordWrap").classList.add("hidden");
  $("toggleAdminBtn").textContent = "🔐 Ingresar como administrador";
  $("loginSub").textContent = "Ingresa tu número de control";
  clearLoginError();
}

// ── Cambiar vistas ────────────────────────────────────────────
function showView(view) {
  app.currentView = view;

  document.querySelectorAll(".nav-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.view === view);
  });

  const sidebar      = $("sidebar");
  const sectionTitle = $("sectionTitle");

  if (view === "admin") {
    // Mostrar panel admin, ocultar vista estudiante
    $("vistaEstudiante").classList.add("hidden");
    $("vistaAdmin").classList.remove("hidden");
    loadAdminPanel();
    return;
  }

  // Para cualquier otra vista: ocultar panel admin, mostrar vista estudiante
  $("vistaAdmin").classList.add("hidden");
  $("vistaEstudiante").classList.remove("hidden");

  if (view === "tablon") {
    sidebar.style.display = "";
    sectionTitle.textContent = "Tablón de Objetos Perdidos";
    loadPosts(false);
  } else if (view === "misreportes") {
    sidebar.style.display = "none";
    sectionTitle.textContent = "Mis Reportes";
    loadPosts(true);
  } else if (view === "notificaciones") {
    sidebar.style.display = "none";
    sectionTitle.textContent = "Notificaciones";
    loadNotificaciones();
  }
}

// ── POSTS ────────────────────────────────────────────────────
async function loadPosts(soloMios = false) {
  const url = soloMios ? "php/get_posts.php?mis=1" : "php/get_posts.php";
  try {
    const res  = await fetch(url);
    const text = await res.text();
    app.posts  = JSON.parse(text);
    renderPosts(soloMios);
  } catch (e) { console.error("Error cargando posts:", e); }
}

function renderPosts(soloMios = false) {
  const container = $("posts");
  container.innerHTML = "";

  let filtered = app.posts;
  if (!soloMios && app.currentCategory !== "Todos") {
    filtered = app.posts.filter(p => p.cat.includes(app.currentCategory));
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>No hay publicaciones aquí todavía.</p>
      </div>`;
    return;
  }

  filtered.forEach(post => {
    const esMio   = app.session && post.ID_Estudiante == app.session.ID;
    const esAdmin = app.session && app.session.tipo === "administrador";

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div class="card-img-container">
        ${post.foto
          ? `<img src="${post.foto}" class="card-img" alt="foto">`
          : `<div class="no-photo">Sin foto</div>`}
      </div>
      <div class="card-body">
        <span class="estado-badge ${post.resuelto ? 'resuelto' : 'perdido'}">
          ${post.resuelto ? "✅ Resuelto" : "🔴 Perdido"}
        </span>
        <h3>${post.cat}</h3>
        <p>${post.descripcion}</p>
        <small>📍 ${post.ubic}</small>
        <small>📅 ${post.fecha}</small>
        ${post.noControl ? `<small>👤 ${post.noControl}</small>` : ""}
      </div>
        <div class="card-actions">
    <button class="btn-responder" onclick="openChat(${post.id}, '${post.cat}')">
      ${esMio ? "💬 Ver respuestas" : "💬 Responder"}
    </button>

    ${esMio ? `
      <button class="btn-resuelto" onclick="toggleStatus(${post.id})">
        ${post.resuelto ? "⏪ Pendiente" : "✅ Resuelto"}
      </button>
    ` : ""}

    ${(esMio || esAdmin) ? `
      <button class="btn-eliminar" onclick="deletePost(${post.id})">
        🗑 Eliminar
      </button>
    ` : ""}
  </div>
      `;
    container.appendChild(div);
  });
}

async function createPost() {
  const cat         = $("postCat").value;
  const descripcion = $("postDesc").value.trim();
  const ubic        = $("postUbic").value.trim();
  const fotoInput   = $("postFoto");

  if (!descripcion || !ubic) { alert("Llena todos los campos obligatorios"); return; }

  let foto = "";
  if (fotoInput.files && fotoInput.files[0]) {
    foto = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result);
      r.onerror = () => rej("");
      r.readAsDataURL(fotoInput.files[0]);
    });
  }

  try {
    const res  = await fetch("php/save_post.php", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ cat, descripcion, ubic, foto, fecha: new Date().toISOString().split("T")[0] }),
    });
    const data = await res.json();
    if (data.status !== "ok") { alert("Error: " + (data.msg || "desconocido")); return; }

    $("postDesc").value = ""; $("postUbic").value = ""; fotoInput.value = "";
    $("fotoPreview").style.display = "none";
    $("modalOverlay").classList.remove("active");
    loadPosts(app.currentView === "misreportes");
  } catch (e) { console.error(e); }
}

async function deletePost(id) {
  if (!confirm("¿Eliminar esta publicación?")) return;
  const res  = await fetch("php/delete_post.php", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ id }),
  });
  const data = await res.json();
  if (data.status !== "deleted") alert("Error: " + (data.msg || "no se pudo eliminar"));
  if (app.currentView === "admin") loadAdminPanel();
  else loadPosts(app.currentView === "misreportes");
}

async function toggleStatus(id) {
  const res  = await fetch("php/update_status.php", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ id }),
  });
  const data = await res.json();
  if (data.status !== "updated") alert("Error: " + (data.msg || "no se pudo actualizar"));
  loadPosts(app.currentView === "misreportes");
}

// ── ADMIN PANEL ──────────────────────────────────────────────
async function loadAdminPanel() {
  try {
    const res  = await fetch("php/get_admin_post.php");
    const data = await res.json();
    const tbody = $("adminTableBody");
    tbody.innerHTML = "";

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#aaa;padding:2rem;">No hay reportes registrados</td></tr>`;
      return;
    }

    data.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.cat}</td>
        <td>${r.descripcion}</td>
        <td>${r.noControl || "-"}</td>
        <td>${r.ubic}</td>
        <td>${r.fecha}</td>
        <td class="${r.estado === 'Resuelto' ? 'tag-resuelto' : 'tag-perdido'}">${r.estado}</td>
        <td>
          <button class="btn-eliminar" style="width:auto;padding:5px 12px;"
            onclick="deletePost(${r.id})">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) { console.error(e); }
}

// ── CHAT ─────────────────────────────────────────────────────
function openChat(reporteId, titulo) {
  app.chatReporteId = reporteId;
  $("chatTitle").textContent = "💬 " + titulo;
  $("chatMessages").innerHTML = "";
  $("chatInput").value = "";
  $("chatOverlay").classList.add("active");
  loadChat(reporteId);
}

async function loadChat(reporteId) {
  try {
    const res  = await fetch(`php/get_chat.php?reporte=${reporteId}`);
    const msgs = await res.json();
    const container = $("chatMessages");
    container.innerHTML = "";

    if (!msgs.length) {
      container.innerHTML = `<p style="color:#aaa;text-align:center;padding:1rem;font-size:0.85rem;">Sé el primero en responder</p>`;
      return;
    }

    msgs.forEach(m => {
      const mio = app.session && m.ID_Estudiante == app.session.ID;
      const div = document.createElement("div");
      div.className = `chat-msg ${mio ? "mine" : ""}`;
      div.innerHTML = `
        <div class="msg-author">${m.noControl}</div>
        <div class="msg-text">${m.mensaje}</div>
      `;
      container.appendChild(div);
    });

    container.scrollTop = container.scrollHeight;
  } catch (e) { console.error(e); }
}

async function sendChat() {
  const mensaje = $("chatInput").value.trim();
  if (!mensaje || !app.chatReporteId) return;

  try {
    const res  = await fetch("php/send_chat.php", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ reporte: app.chatReporteId, mensaje }),
    });
    const data = await res.json();
    if (data.status === "ok") {
      $("chatInput").value = "";
      loadChat(app.chatReporteId);
    }
  } catch (e) { console.error(e); }
}

// ── NOTIFICACIONES ───────────────────────────────────────────
async function loadNotificaciones() {
  const container = $("posts");
  container.innerHTML = "";
  try {
    const res   = await fetch("php/get_notifications.php?marcar=1");
    const notis = await res.json();

    if (!notis.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔔</div>
          <p>No tienes notificaciones.</p>
        </div>`;
      return;
    }

    const list = document.createElement("div");
    list.className = "noti-list";

    notis.forEach(n => {
      const div = document.createElement("div");
      div.className = `noti-item ${n.leida ? "" : "unread"}`;
      div.innerHTML = `
        <div class="noti-icon">🔔</div>
        <div class="noti-body">
          <p>${n.mensaje}</p>
          <small>${n.fecha}</small>
        </div>
      `;
      list.appendChild(div);
    });

    container.appendChild(list);
  } catch (e) { console.error(e); }
}

// ── LOGIN / LOGOUT ────────────────────────────────────────────
async function doLogin(noControl) {
  let res  = await fetch("php/login.php", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ noControl }),
  });
  let data = await res.json();

  if (res.status === 401) {
    const reg     = await fetch("php/register.php", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ noControl, tipo: "estudiante" }),
    });
    const regData = await reg.json();
    if (regData.status !== "ok") return { error: regData.msg };

    res  = await fetch("php/login.php", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ noControl }),
    });
    data = await res.json();
  }

  return data;
}

// ── INIT ──────────────────────────────────────────────────────
window.onload = () => {

  let adminMode = false;

  $("toggleAdminBtn").onclick = () => {
    adminMode = !adminMode;
    $("passwordWrap").classList.toggle("hidden", !adminMode);
    $("loginSub").textContent = adminMode
      ? "Ingresa las credenciales de administrador"
      : "Ingresa tu número de control";
    $("toggleAdminBtn").textContent = adminMode
      ? "👤 Ingresar como estudiante"
      : "🔐 Ingresar como administrador";
    clearLoginError();
  };

  $("loginBtn").onclick = async () => {
    clearLoginError();
    const noControl = $("loginInput").value.trim();
    if (!noControl) { setLoginError("Ingresa tu número de control."); return; }

    try {
      if (adminMode) {
        const password = $("passwordInput").value.trim();
        if (!password) { setLoginError("Ingresa la contraseña de administrador."); return; }

        const res  = await fetch("php/login.php", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ noControl, password, esAdmin: true }),
        });
        const data = await res.json();
        if (data.status === "ok") showApp(data);
        else setLoginError(data.msg || "Credenciales incorrectas.");
      } else {
        const data = await doLogin(noControl);
        if (data.status === "ok") showApp(data);
        else setLoginError(data.msg || "Error al iniciar sesión.");
      }
    } catch { setLoginError("Error al conectar con el servidor."); }
  };

  $("loginInput").addEventListener("keydown", e => {
    if (e.key === "Enter") $("loginBtn").click();
  });
  $("passwordInput").addEventListener("keydown", e => {
    if (e.key === "Enter") $("loginBtn").click();
  });

  $("logoutBtn").onclick = async () => {
    await fetch("php/logout.php", { method: "POST" });
    adminMode = false;
    showLogin();
  };

  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.onclick = () => showView(tab.dataset.view);
  });

  $("menuToggle").onclick = () => $("sidebar").classList.toggle("collapsed");

  document.querySelectorAll("#categoryList li").forEach(li => {
    li.onclick = () => {
      document.querySelectorAll("#categoryList li").forEach(l => l.classList.remove("active"));
      li.classList.add("active");
      app.currentCategory = li.dataset.cat;
      renderPosts(false);
    };
  });

  $("openModalBtn").onclick  = () => $("modalOverlay").classList.add("active");
  $("closeModalBtn").onclick = () => $("modalOverlay").classList.remove("active");
  $("savePostBtn").onclick   = () => createPost();

  $("postFoto").addEventListener("change", function () {
    const preview = $("fotoPreview");
    if (this.files && this.files[0]) {
      const r = new FileReader();
      r.onload = e => { preview.src = e.target.result; preview.style.display = "block"; };
      r.readAsDataURL(this.files[0]);
    } else { preview.style.display = "none"; }
  });

  $("closeChatBtn").onclick = () => $("chatOverlay").classList.remove("active");
  $("sendChatBtn").onclick  = () => sendChat();
  $("chatInput").addEventListener("keydown", e => { if (e.key === "Enter") sendChat(); });
};