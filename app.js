// ── Estado global ────────────────────────────────────────────
const app = {
  session:         null,
  posts:           [],
  currentCategory: "Todos",
  currentView:     "tablon",
  chatReporteId:   null,
  chatInterval:    null,
};

// ── Helpers UI ───────────────────────────────────────────────
function $(id) { return document.getElementById(id); }

function setLoginError(msg) {
  const el = $("loginError");
  el.textContent = msg;
  el.classList.remove("hidden");
}
function clearLoginError() { $("loginError").classList.add("hidden"); }

// Estado → clase CSS y texto
function estadoInfo(estado) {
  switch (estado) {
    case "Resuelto":  return { cls: "resuelto",  label: "✅ Resuelto" };
    case "Pendiente": return { cls: "pendiente",  label: "⏳ Pendiente" };
    default:          return { cls: "perdido",    label: "🔴 Perdido" };
  }
}

// Siguiente estado en el ciclo (para el botón del dueño)
function siguienteEstado(actual) {
  if (actual === "Perdido")   return { estado: "Pendiente", label: "⏳ Marcar Pendiente" };
  if (actual === "Pendiente") return { estado: "Resuelto",  label: "✅ Marcar Resuelto" };
  return                              { estado: "Perdido",   label: "🔴 Marcar Perdido" };
}

// ── Comprimir imagen antes de subir (máx 800px / 70% calidad) ──
function comprimirImagen(file) {
  return new Promise((resolve) => {
    const MAX = 800;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > h && w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        else if (h > MAX)     { w = Math.round(w * MAX / h); h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.70));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

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
  if (app.chatInterval) { clearInterval(app.chatInterval); app.chatInterval = null; }
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
    $("vistaEstudiante").classList.add("hidden");
    $("vistaAdmin").classList.remove("hidden");
    loadAdminPanel();
    return;
  }

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

// ── Mostrar spinner en el contenedor de posts ────────────────
function showPostsLoading() {
  $("posts").innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Cargando...</p>
    </div>`;
}

// ── POSTS ────────────────────────────────────────────────────
async function loadPosts(soloMios = false) {
  showPostsLoading();
  const url = soloMios ? "php/get_posts.php?mis=1" : "php/get_posts.php";
  try {
    const res  = await fetch(url, { credentials: "include" });
    const text = await res.text();
    app.posts  = JSON.parse(text);
    renderPosts(soloMios);
  } catch (e) {
    $("posts").innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Error al cargar los reportes.</p></div>`;
    console.error("Error cargando posts:", e);
  }
}

function renderPosts(soloMios = false) {
  const container = $("posts");
  container.innerHTML = "";

  let filtered = app.posts;

  // Filtro por categoría (solo tablón)
  if (!soloMios && app.currentCategory !== "Todos") {
    filtered = app.posts.filter(p => p.cat && p.cat.includes(app.currentCategory));
  }

  // Filtro por búsqueda
  const searchVal = ($("searchInput") ? $("searchInput").value.trim().toLowerCase() : "");
  if (searchVal) {
    filtered = filtered.filter(p =>
      (p.descripcion && p.descripcion.toLowerCase().includes(searchVal)) ||
      (p.cat         && p.cat.toLowerCase().includes(searchVal)) ||
      (p.ubic        && p.ubic.toLowerCase().includes(searchVal))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>${searchVal ? "Sin resultados para tu búsqueda." : "No hay publicaciones aquí todavía."}</p>
      </div>`;
    return;
  }

  filtered.forEach(post => {
    const esAdmin = app.session && app.session.tipo === "administrador";
    const esMio   = !esAdmin && app.session && post.ID_Estudiante == app.session.ID;
    const info    = estadoInfo(post.estado);
    const sig     = siguienteEstado(post.estado);

    const div = document.createElement("div");
    div.className = "card";

    // Foto: puede ser base64 o URL normal
    const fotoHTML = (post.foto && post.foto.trim() !== "")
      ? `<img src="${post.foto}" class="card-img" alt="foto del objeto" onerror="this.parentElement.innerHTML='<div class=\\'no-photo\\'>📷</div>'">`
      : `<div class="no-photo">📷<br><span>Sin foto</span></div>`;

    div.innerHTML = `
      <div class="card-img-container">${fotoHTML}</div>
      <div class="card-body">
        <span class="estado-badge ${info.cls}">${info.label}</span>
        <h3>${escapeHtml(post.cat)}</h3>
        <p>${escapeHtml(post.descripcion)}</p>
        <small>📍 ${escapeHtml(post.ubic)}</small>
        <small>📅 ${post.fecha}</small>
        ${post.noControl ? `<small>👤 ${escapeHtml(post.noControl)}</small>` : ""}
      </div>
      <div class="card-actions">
        <button class="btn-responder" onclick="openChat(${post.id}, '${escapeAttr(post.cat)}')">
          ${esMio ? "💬 Ver respuestas" : "💬 Responder"}
        </button>

        ${(esMio || esAdmin) ? `
          <button class="btn-estado btn-estado-${info.cls}"
            onclick="${esAdmin
              ? `adminSetStatus(${post.id}, '${sig.estado}')`
              : `toggleStatus(${post.id})`}">
            ${sig.label}
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

// Escape helpers para evitar XSS en innerHTML
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function escapeAttr(str) {
  if (!str) return "";
  return String(str).replace(/'/g, "\\'");
}

async function createPost() {
  const cat         = $("postCat").value;
  const descripcion = $("postDesc").value.trim();
  const ubic        = $("postUbic").value.trim();
  const fotoInput   = $("postFoto");

  if (!descripcion || !ubic) {
    showToast("Llena todos los campos obligatorios", "error");
    return;
  }

  const saveBtn = $("savePostBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Publicando...";

  let foto = "";
  if (fotoInput.files && fotoInput.files[0]) {
    try {
      foto = await comprimirImagen(fotoInput.files[0]);
    } catch {
      foto = "";
    }
  }

  try {
    const res  = await fetch("php/save_post.php", {
      credentials: "include",
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ cat, descripcion, ubic, foto, fecha: new Date().toISOString().split("T")[0] }),
    });
    const data = await res.json();

    if (data.status !== "ok") {
      showToast("Error: " + (data.msg || "desconocido"), "error");
      return;
    }

    $("postDesc").value = "";
    $("postUbic").value = "";
    fotoInput.value = "";
    $("fotoPreview").style.display = "none";
    $("modalOverlay").classList.remove("active");
    showToast("¡Publicación creada con éxito!", "ok");
    loadPosts(app.currentView === "misreportes");
  } catch (e) {
    showToast("Error al conectar con el servidor", "error");
    console.error(e);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Publicar";
  }
}

async function deletePost(id) {
  if (!confirm("¿Eliminar esta publicación?")) return;
  const res  = await fetch("php/delete_post.php", {
    credentials: "include",
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ id }),
  });
  const data = await res.json();
  if (data.status !== "deleted") {
    showToast("Error: " + (data.msg || "no se pudo eliminar"), "error");
  } else {
    showToast("Reporte eliminado", "ok");
  }
  if (app.currentView === "admin") loadAdminPanel();
  else loadPosts(app.currentView === "misreportes");
}

async function toggleStatus(id) {
  const res  = await fetch("php/update_status.php", {
    credentials: "include",
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ id }),
  });
  const data = await res.json();
  if (data.status !== "updated") {
    showToast("Error: " + (data.msg || "no se pudo actualizar"), "error");
  } else {
    showToast(`Estado actualizado: ${data.nuevoEstado}`, "ok");
  }
  loadPosts(app.currentView === "misreportes");
}

// Cambio de estado directo desde el admin
async function adminSetStatus(id, estado) {
  const res  = await fetch("php/update_status.php", {
    credentials: "include",
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ id, estado }),
  });
  const data = await res.json();
  if (data.status !== "updated") {
    showToast("Error: " + (data.msg || "no se pudo actualizar"), "error");
  } else {
    showToast(`Estado → ${data.nuevoEstado}`, "ok");
    loadAdminPanel();
  }
}

// ── ADMIN PANEL ──────────────────────────────────────────────
async function loadAdminPanel() {
  const tbody = $("adminTableBody");
  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;"><div class="spinner" style="margin:0 auto;"></div></td></tr>`;

  try {
    const res  = await fetch("php/get_admin_post.php", { credentials: "include" });
    const data = await res.json();
    tbody.innerHTML = "";

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#aaa;padding:2rem;">No hay reportes registrados</td></tr>`;
      return;
    }

    data.forEach(r => {
      const info = estadoInfo(r.estado);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          ${r.foto ? `<img src="${r.foto}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;cursor:pointer;" onclick="verFotoAdmin('${encodeURIComponent(r.foto)}')" title="Ver foto" onerror="this.style.display='none'">` : '<span style="color:#bbb;font-size:0.8rem;">Sin foto</span>'}
        </td>
        <td>${escapeHtml(r.cat)}</td>
        <td style="max-width:200px;word-break:break-word;">${escapeHtml(r.descripcion)}</td>
        <td>${escapeHtml(r.noControl) || "-"}</td>
        <td>${escapeHtml(r.ubic)}</td>
        <td>${r.fecha}</td>
        <td>
          <select class="admin-estado-select estado-select-${info.cls}" onchange="adminSetStatus(${r.id}, this.value)">
            <option value="Perdido"   ${r.estado === 'Perdido'   ? 'selected' : ''}>🔴 Perdido</option>
            <option value="Pendiente" ${r.estado === 'Pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
            <option value="Resuelto"  ${r.estado === 'Resuelto'  ? 'selected' : ''}>✅ Resuelto</option>
          </select>
        </td>
        <td>
          <button class="btn-eliminar" style="width:auto;padding:5px 12px;"
            onclick="deletePost(${r.id})">🗑 Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#e74c3c;padding:1rem;">Error al cargar reportes</td></tr>`;
    console.error(e);
  }
}

function verFotoAdmin(encoded) {
  const src = decodeURIComponent(encoded);
  $("fotoAdminImg").src = src;
  $("fotoAdminOverlay").classList.add("active");
}

// ── CHAT ─────────────────────────────────────────────────────
function openChat(reporteId, titulo) {
  app.chatReporteId = reporteId;
  $("chatTitle").textContent = "💬 " + titulo;
  $("chatMessages").innerHTML = "";
  $("chatInput").value = "";
  $("chatOverlay").classList.add("active");
  loadChat(reporteId);

  // Refrescar chat cada 5 seg mientras está abierto
  if (app.chatInterval) clearInterval(app.chatInterval);
  app.chatInterval = setInterval(() => {
    if (app.chatReporteId) loadChat(app.chatReporteId);
  }, 2000);
}

async function loadChat(reporteId) {
  try {
    const res  = await fetch(`php/get_chat.php?reporte=${reporteId}`, { credentials: "include" });
    const msgs = await res.json();
    const container = $("chatMessages");

    // Guardar scroll position: si está abajo, volver a bajar tras actualizar
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 40;

    container.innerHTML = "";

    if (!msgs.length) {
      container.innerHTML = `<p style="color:#aaa;text-align:center;padding:1rem;font-size:0.85rem;">Sé el primero en responder</p>`;
      return;
    }

    msgs.forEach(m => {
      const esAdmin = app.session && app.session.tipo === "administrador";
      const mio = esAdmin ? m.es_admin : (app.session && m.ID_Estudiante == app.session.ID);
      const div = document.createElement("div");
      div.className = `chat-msg ${mio ? "mine" : ""}`;
      div.innerHTML = `
        <div class="msg-author">${escapeHtml(m.noControl)}</div>
        <div class="msg-text">${escapeHtml(m.mensaje)}</div>
        <div class="msg-time">${m.fecha ? m.fecha.substring(11, 16) : ""}</div>
      `;
      container.appendChild(div);
    });

    if (atBottom) container.scrollTop = container.scrollHeight;
  } catch (e) { console.error(e); }
}

async function sendChat() {
  const mensaje = $("chatInput").value.trim();
  if (!mensaje || !app.chatReporteId) return;

  $("sendChatBtn").disabled = true;

  try {
    const res  = await fetch("php/send_chat.php", {
      credentials: "include",
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
  finally { $("sendChatBtn").disabled = false; }
}

// ── NOTIFICACIONES ───────────────────────────────────────────
async function loadNotificaciones() {
  const container = $("posts");
  container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Cargando...</p></div>`;
  try {
    const res = await fetch("php/get_notifications.php?marcar=1", { credentials: "include" });
    if (!res.ok) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔔</div>
          <p>No tienes notificaciones.</p>
        </div>`;
      return;
    }
    const notis = await res.json();

    container.innerHTML = "";

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
        <div class="noti-icon">${n.leida ? "🔔" : "🔔"}</div>
        <div class="noti-body">
          <p>${escapeHtml(n.mensaje)}</p>
          <small>${n.fecha}</small>
        </div>
      `;
      list.appendChild(div);
    });

    container.appendChild(list);
  } catch (e) { console.error(e); }
}

// ── TOAST NOTIFICATIONS ──────────────────────────────────────
function showToast(msg, type = "ok") {
  let toast = $("toastMsg");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toastMsg";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast toast-${type} show`;
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove("show"), 3000);
}

// ── LOGIN / LOGOUT ────────────────────────────────────────────
async function doLogin(noControl) {
  let res  = await fetch("php/login.php", {
    credentials: "include",
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ noControl }),
  });
  let data = await res.json();

  if (res.status === 401) {
    // Auto-registro de nuevo estudiante
    const reg     = await fetch("php/register.php", {
      credentials: "include",
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ noControl, tipo: "estudiante" }),
    });
    const regData = await reg.json();
    if (regData.status !== "ok") return { error: regData.msg };

    res  = await fetch("php/login.php", {
      credentials: "include",
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

    $("loginBtn").disabled = true;
    $("loginBtn").textContent = "Entrando...";

    try {
      if (adminMode) {
        const password = $("passwordInput").value.trim();
        if (!password) {
          setLoginError("Ingresa la contraseña de administrador.");
          $("loginBtn").disabled = false;
          $("loginBtn").textContent = "Entrar";
          return;
        }

        const res  = await fetch("php/login.php", {
          credentials: "include",
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
    finally {
      $("loginBtn").disabled = false;
      $("loginBtn").textContent = "Entrar";
    }
  };

  $("loginInput").addEventListener("keydown", e => { if (e.key === "Enter") $("loginBtn").click(); });
  $("passwordInput").addEventListener("keydown", e => { if (e.key === "Enter") $("loginBtn").click(); });

  $("logoutBtn").onclick = async () => {
    await fetch("php/logout.php", { credentials: "include",
      method: "POST" });
    adminMode = false;
    if (app.chatInterval) { clearInterval(app.chatInterval); app.chatInterval = null; }
    // Limpiar estado del modal para que la siguiente sesión empiece limpia
    $("postCat").selectedIndex = 0;
    $("postDesc").value = "";
    $("postUbic").value = "";
    $("postFoto").value = "";
    $("fotoPreview").style.display = "none";
    $("fotoPreview").src = "";
    $("modalOverlay").classList.remove("active");
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

  $("openModalBtn").onclick  = () => {
    // Limpiar siempre el modal al abrirlo (evita que queden datos de otra sesión o reporte cancelado)
    $("postCat").selectedIndex = 0;
    $("postDesc").value = "";
    $("postUbic").value = "";
    $("postFoto").value = "";
    $("fotoPreview").style.display = "none";
    $("fotoPreview").src = "";
    $("modalOverlay").classList.add("active");
  };
  $("closeModalBtn").onclick = () => $("modalOverlay").classList.remove("active");
  $("savePostBtn").onclick   = () => createPost();

  // Preview de foto con compresión
  $("postFoto").addEventListener("change", async function () {
    const preview = $("fotoPreview");
    if (this.files && this.files[0]) {
      const base64 = await comprimirImagen(this.files[0]);
      preview.src = base64;
      preview.style.display = "block";
    } else {
      preview.style.display = "none";
    }
  });

  $("closeChatBtn").onclick = () => {
    $("chatOverlay").classList.remove("active");
    if (app.chatInterval) { clearInterval(app.chatInterval); app.chatInterval = null; }
    app.chatReporteId = null;
  };
  $("sendChatBtn").onclick  = () => sendChat();
  $("chatInput").addEventListener("keydown", e => { if (e.key === "Enter") sendChat(); });

  // Cerrar modal foto admin
  $("fotoAdminOverlay").onclick = (e) => {
    if (e.target === $("fotoAdminOverlay") || e.target.id === "closeFotoAdminBtn") {
      $("fotoAdminOverlay").classList.remove("active");
    }
  };

  // Búsqueda en tiempo real
  const searchInput = $("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderPosts(app.currentView === "misreportes");
    });
  }
};