document.addEventListener("DOMContentLoaded", async () => {
  lucide.createIcons();
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "login.html");
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
  const tbody = document.querySelector("#sou-table tbody");

  const editPanel = document.getElementById("edit-panel");
  const nomEl = document.getElementById("empleat-nom");
  const salariInput = document.getElementById("edit-salari");
  const complementsInput = document.getElementById("edit-complements");
  const irpfInput = document.getElementById("edit-irpf");
  const ssInput = document.getElementById("edit-ss");
  const saveBtn = document.getElementById("save-btn");
  const cancelBtn = document.getElementById("cancel-btn");

  let currentUserId = null;

  /** 📌 Carregar tots els usuaris */
  async function loadUsers() {
    const res = await fetch("http://10.4.41.69:8080/users", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const users = await res.json();
    renderTable(users);
  }

  /** 📌 Mostrar la taula d’usuaris */
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
      row.addEventListener("click", () => selectUser(Number(row.dataset.id)));
    });
  }

  /** 📌 Quan seleccionem usuari ➝ carregar el sou */
  async function selectUser(id) {
    currentUserId = id;

    const res = await fetch(`http://10.4.41.69:8080/user/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = await res.json();

    // Mostrar nom
    nomEl.textContent = user.name;

    // Ara carreguem el sou
    const salaryRes = await fetch(`http://10.4.41.69:8080/user/${id}/sou`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!salaryRes.ok) {
      // Si no té sou, inicialitzar valors
      salariInput.value = 0;
      complementsInput.value = 0;
      irpfInput.value = 0;
      ssInput.value = 0;
    } else {
      const s = await salaryRes.json();
      salariInput.value = s.salari_base;
      complementsInput.value = s.complements;
      irpfInput.value = s.irpf_actual;
      ssInput.value = s.seguretat_social_actual;
    }

    editPanel.classList.add("visible");
  }

  /** 💾 Guardar canvis de sou */
  saveBtn.addEventListener("click", async () => {
    if (!currentUserId) return;

    await fetch(`http://10.4.41.69:8080/user/${currentUserId}/sou`, {
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

    editPanel.classList.remove("visible");
  });

  cancelBtn.addEventListener("click", () => {
    editPanel.classList.remove("visible");
    currentUserId = null;
  });

  /** ▶️ Inici */
  loadUsers();
});
