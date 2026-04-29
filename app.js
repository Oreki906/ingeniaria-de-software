const app = {
  posts: [],
  currentCategory: "Todos",
  isAdmin: false,

  async loadPosts() {
    try {
      const res = await fetch("php/get_posts.php");
      const text = await res.text();
      this.posts = JSON.parse(text);
      this.render();
    } catch (error) {
      console.error("Error cargando posts:", error);
    }
  },

  async createPost() {
    const cat = document.getElementById("postCat").value;
    const estado = "perdido";
    const descripcion = document.getElementById("postDesc").value;
    const ubic = document.getElementById("postUbic").value;
    const fotoInput = document.getElementById("postFoto");

    if (!descripcion || !ubic) {
      alert("Llena los campos");
      return;
    }

    let fotoBase64 = "";
    if (fotoInput.files && fotoInput.files[0]) {
      fotoBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject("");
        reader.readAsDataURL(fotoInput.files[0]);
      });
    }

    const newPost = {
      cat,
      estado,
      descripcion,
      ubic,
      foto: fotoBase64,
      fecha: new Date().toLocaleDateString(),
      resuelto: 0,
    };

    try {
      await fetch("php/save_post.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });

      document.getElementById("postDesc").value = "";
      document.getElementById("postUbic").value = "";
      fotoInput.value = "";
      document.getElementById("fotoPreview").style.display = "none";

      document.getElementById("modalOverlay").classList.remove("active");
      this.loadPosts();
    } catch (error) {
      console.error("Error creando post:", error);
    }
  },

  async deletePost(id) {
    await fetch("php/delete_post.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    this.loadPosts();
  },

  async toggleStatus(id) {
    await fetch("php/update_status.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
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
      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <div class="card-img-container">
          ${
            post.foto
              ? `<img src="${post.foto}" class="card-img" alt="Foto del objeto">`
              : `<div class="no-photo">Sin foto</div>`
          }
        </div>
        <div class="card-body">
          <span class="estado-badge ${post.resuelto == 1 ? "resuelto" : "perdido"}">
            ${post.resuelto == 1 ? "✅ Resuelto" : "🔴 Perdido"}
          </span>
          <h3>${post.cat}</h3>
          <p>${post.descripcion}</p>
          <small>📍 ${post.ubic}</small>
          <small>📅 ${post.fecha}</small>
        </div>
        <div class="card-actions">
          <button onclick="app.toggleStatus(${post.id})" class="btn-resuelto">
            ${post.resuelto == 1 ? "⏪ Pendiente" : "✅ Resuelto"}
          </button>
          <button onclick="app.deletePost(${post.id})" class="btn-eliminar">
            🗑 Eliminar
          </button>
        </div>
      `;

      container.appendChild(div);
    });
  },
};

window.onload = () => {
  const modal = document.getElementById("modalOverlay");
  const sidebar = document.getElementById("sidebar");
  const adminBtn = document.getElementById("adminBtn");

  app.loadPosts();

  //Hamburguesa: abre/cierra sidebar con animación
  document.getElementById("menuToggle").onclick = () => {
    sidebar.classList.toggle("collapsed");
  };

  adminBtn.onclick = () => {
    app.isAdmin = !app.isAdmin;
    document.body.classList.toggle("admin-mode", app.isAdmin);
    adminBtn.classList.toggle("active", app.isAdmin);
    adminBtn.textContent = app.isAdmin ? "Salir" : "Admin";
  };

  document.getElementById("openModalBtn").onclick = () => {
    modal.classList.add("active");
  };

  document.getElementById("closeModalBtn").onclick = () => {
    modal.classList.remove("active");
  };

  document.getElementById("savePostBtn").onclick = () => {
    app.createPost();
  };

  //Preview de imagen
  document.getElementById("postFoto").addEventListener("change", function () {
    const preview = document.getElementById("fotoPreview");
    if (this.files && this.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.src = e.target.result;
        preview.style.display = "block";
      };
      reader.readAsDataURL(this.files[0]);
    } else {
      preview.style.display = "none";
    }
  });

  //Categorías
  document.querySelectorAll("#categoryList li").forEach((li) => {
    li.onclick = () => {
      app.currentCategory = li.dataset.cat;
      app.render();
    };
  });
};
