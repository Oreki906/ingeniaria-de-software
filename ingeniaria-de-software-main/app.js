const app = {
  posts: [],
  currentCategory: "Todos",
  isAdmin: false,
  session: null,

  async loadPosts() {
    try {
      const res  = await fetch("php/get_posts.php");
      const text = await res.text();
      this.posts = JSON.parse(text);
      this.render();
    } catch (error) {
      console.error("Error cargando posts:", error);
    }
  },

  async createPost() {
    const cat         = document.getElementById("postCat").value;
    const descripcion = document.getElementById("postDesc").value;
    const ubic        = document.getElementById("postUbic").value;
    const fotoInput   = document.getElementById("postFoto");

    if (!descripcion || !ubic) {
      alert("Llena todos los campos obligatorios");
      return;
    }

    let fotoBase64 = "";
    if (fotoInput.files && fotoInput.files[0]) {
      fotoBase64 = await new Promise((resolve, reject) => {
        const reader   = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = () => reject("");
        reader.readAsDataURL(fotoInput.files[0]);
      });
    }

    try {
      const res  = await fetch("php/save_post.php", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          cat,
          descripcion,
          ubic,
          foto:  fotoBase64,
          fecha: new Date().toISOString().split("T")[0],
        }),
      });
      const data = await res.json();

      if (data.status !== "ok") {
        alert("Error al publicar: " + (data.msg || "desconocido"));
        return;
      }

      document.getElementById("postDesc").value            = "";
      document.getElementById("postUbic").value            = "";
      fotoInput.value                                       = "";
      document.getElementById("fotoPreview").style.display = "none";
      document.getElementById("modalOverlay").classList.remove("active");
      this.loadPosts();
    } catch (error) {
      console.error("Error creando post:", error);
    }
  },

  async deletePost(id) {
    if (!confirm("¿Eliminar esta publicación?")) return;
    const res  = await fetch("php/delete_post.php", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.status !== "deleted") alert("Error: " + (data.msg || "no se pudo eliminar"));
    this.loadPosts();
  },

  async toggleStatus(id) {
    const res  = await fetch("php/update_status.php", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.status !== "updated") alert("Error: " + (data.msg || "no se pudo actualizar"));
    this.loadPosts();
  },

  render() {
    const container = document.getElementById("posts");
    container.innerHTML = "";

    const filtered =
      this.currentCategory === "Todos"
        ? this.posts
        : this.posts.filter((p) => p.cat.includes(this.currentCategory));

    if (filtered.length === 0) {
      container.innerHTML = `<p style="color:#aaa; padding:1rem;">No hay publicaciones en esta categoría.</p>`;
      return;
    }

    filtered.forEach((post) => {
      const div     = document.createElement("div");
      div.className = "card";

      const esMio   = this.session && post.ID_Estudiante == this.session.ID;
      const esAdmin = this.isAdmin;

      div.innerHTML = `
        <div class="card-img-container">
          ${post.foto
            ? `<img src="${post.foto}" class="card-img" alt="Foto del objeto">`
            : `<div class="no-photo">Sin foto</div>`}
        </div>
        <div class="card-body">
          <span class="estado-badge ${post.resuelto ? "resuelto" : "perdido"}">
            ${post.resuelto ? "✅ Resuelto" : "🔴 Perdido"}
          </span>
          <h3>${post.cat}</h3>
          <p>${post.descripcion}</p>
          <small>📍 ${post.ubic}</small>
          <small>📅 ${post.fecha}</small>
          ${post.noControl ? `<small>👤 ${post.noControl}</small>` : ""}
        </div>
        <div class="card-actions">
          ${esMio ? `
            <button onclick="app.toggleStatus(${post.id})" class="btn-resuelto">
              ${post.resuelto ? "⏪ Pendiente" : "✅ Resuelto"}
            </button>` : ""}
          ${(esMio || esAdmin) ? `
            <button onclick="app.deletePost(${post.id})" class="btn-eliminar">
              🗑 Eliminar
            </button>` : ""}
        </div>
      `;

      container.appendChild(div);
    });
  },
};

// ── Helpers UI ──────────────────────────────────────────────
function showApp(sessionData) {
  app.session = sessionData;
  app.isAdmin = sessionData.tipo === "administrador";

  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("appSection").classList.remove("hidden");
  document.getElementById("userLabel").textContent = sessionData.noControl;

  if (app.isAdmin) {
    document.getElementById("adminBtn").classList.remove("hidden");
    document.body.classList.add("admin-mode");
  }

  app.loadPosts();
}

function setLoginError(msg) {
  const el = document.getElementById("loginError");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function clearLoginError() {
  document.getElementById("loginError").classList.add("hidden");
}

// ── window.onload ───────────────────────────────────────────
window.onload = () => {
  const modal    = document.getElementById("modalOverlay");
  const sidebar  = document.getElementById("sidebar");

  // Hamburguesa
  document.getElementById("menuToggle").onclick = () => {
    sidebar.classList.toggle("collapsed");
  };

  // Modal nueva publicación
  document.getElementById("openModalBtn").onclick  = () => modal.classList.add("active");
  document.getElementById("closeModalBtn").onclick = () => modal.classList.remove("active");
  document.getElementById("savePostBtn").onclick   = () => app.createPost();

  // Preview imagen
  document.getElementById("postFoto").addEventListener("change", function () {
    const preview = document.getElementById("fotoPreview");
    if (this.files && this.files[0]) {
      const reader   = new FileReader();
      reader.onload  = (e) => { preview.src = e.target.result; preview.style.display = "block"; };
      reader.readAsDataURL(this.files[0]);
    } else {
      preview.style.display = "none";
    }
  });

  // Categorías
  document.querySelectorAll("#categoryList li").forEach((li) => {
    li.onclick = () => { app.currentCategory = li.dataset.cat; app.render(); };
  });

  // ── LOGIN ────────────────────────────────────────────────
  document.getElementById("loginBtn").onclick = async () => {
    clearLoginError();
    const noControl = document.getElementById("loginInput").value.trim();
    if (!noControl) { setLoginError("Ingresa tu número de control."); return; }

    try {
      // 1. Intentar login
      let res  = await fetch("php/login.php", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ noControl }),
      });
      let data = await res.json();

      // 2. Si no existe, crear automáticamente como estudiante
      if (res.status === 401) {
        const reg     = await fetch("php/register.php", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ noControl, tipo: "estudiante" }),
        });
        const regData = await reg.json();
        if (regData.status !== "ok") { setLoginError(regData.msg); return; }

        // 3. Login con el usuario recién creado
        res  = await fetch("php/login.php", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ noControl }),
        });
        data = await res.json();
      }

      if (data.status === "ok") showApp(data);
      else setLoginError(data.msg || "Error al iniciar sesión.");

    } catch {
      setLoginError("Error al conectar con el servidor.");
    }
  };

  // ── LOGOUT ───────────────────────────────────────────────
  document.getElementById("logoutBtn").onclick = async () => {
    await fetch("php/logout.php", { method: "POST" });
    app.session = null;
    app.isAdmin = false;
    document.getElementById("appSection").classList.add("hidden");
    document.getElementById("loginScreen").classList.remove("hidden");
    document.getElementById("loginInput").value = "";
    document.body.classList.remove("admin-mode");
    document.getElementById("adminBtn").classList.add("hidden");
  };
};