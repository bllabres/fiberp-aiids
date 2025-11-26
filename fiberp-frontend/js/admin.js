document.addEventListener("DOMContentLoaded", async () => {
  lucide.createIcons();
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "login.html");

  /* 🔐 Validar usuari administrador */
  try {
    const me = await fetch("http://10.4.41.69:8080/user", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());

    if (!me.roles || !me.roles.includes("ROLE_ADMIN")) {
      alert("⚠️ No tens permisos per accedir a aquesta secció.");
      return (window.location.href = "overview.html");
    }
  } catch (e) {
    console.error("Error validant admin:", e);
    return (window.location.href = "login.html");
  }

  const menuLinks = document.querySelectorAll(".menu a");
  const currentPage = window.location.pathname.split("/").pop();
  menuLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === "#") {
      link.addEventListener("click", (e) => e.preventDefault());
      return;
    }
    if (href === currentPage) link.classList.add("active");
  });

  const tbody = document.querySelector("#sou-table tbody");

  const editPanel = document.getElementById("edit-panel");
  const nomEl = document.getElementById("empleat-nom");
  const salariInput = document.getElementById("edit-salari");
  const complementsInput = document.getElementById("edit-complements");
  const irpfInput = document.getElementById("edit-irpf");
  const ssInput = document.getElementById("edit-ss");
  const saveBtn = document.getElementById("save-btn");
  const cancelBtn = document.getElementById("cancel-btn");

  let currentUser = null;

  /** 📌 Carregar tots els usuaris (amb sou ja inclòs) */
  async function loadUsers() {
    const res = await fetch("http://10.4.41.69:8080/users", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const users = await res.json();
    renderTable(users);
  }

  /** 📌 Mostrar taula */
  function renderTable(users) {
    tbody.innerHTML = users
      .map(
        (u) => `
      <tr data-id="${u.id}">
        <td>${u.id}</td>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.telefon || "-"}</td>
        <td>${u.roles.join(", ")}</td>
      </tr>
    `
      )
      .join("");

    tbody.querySelectorAll("tr").forEach((row) => {
      row.addEventListener("click", () => {
        // Treu la classe 'selected' de totes les files
        tbody
          .querySelectorAll("tr")
          .forEach((r) => r.classList.remove("selected"));

        // Afegeix la classe 'selected' només a la fila clicada
        row.classList.add("selected");

        // Selecciona l'usuari corresponent
        selectUser(users.find((u) => u.id == row.dataset.id));
      });
    });
  }

  /** 📌 Seleccionar usuari i omplir sou directament del JSON */
  function selectUser(user) {
    currentUser = user;

    nomEl.textContent = user.name;

    // Si no té sou ➝ inicialitzar a zero
    const s = user.sou || {};
    salariInput.value = s.salari_base || 0;
    complementsInput.value = s.complements || 0;
    irpfInput.value = s.irpf_actual || 0;
    ssInput.value = s.seguretat_social_actual || 0;

    editPanel.classList.add("visible");
  }

  /** 💾 Guardar sou (PUT) */
  saveBtn.addEventListener("click", async () => {
    if (!currentUser) return;

    await fetch(`http://10.4.41.69:8080/user/${currentUser.id}/sou`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        salari_base: Number(salariInput.value),
        complements: Number(complementsInput.value),
        irpf_actual: Number(irpfInput.value),
        seguretat_social_actual: Number(ssInput.value),
      }),
    });
    showToast();
    editPanel.classList.remove("visible");
    loadUsers(); // 🔄 Actualitzar la taula
  });

  cancelBtn.addEventListener("click", () => {
    editPanel.classList.remove("visible");
    currentUser = null;
  });

  function showToast() {
    const toast = document.getElementById("save-toast");
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  /** ▶️ Inici */
  loadUsers();
});
