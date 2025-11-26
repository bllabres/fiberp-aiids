document.addEventListener("DOMContentLoaded", async () => {
  lucide.createIcons();
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "login.html");

  const menuLinks = document.querySelectorAll(".menu a");
  const currentPage = window.location.pathname.split("/").pop();
  menuLinks.forEach((link) => {
    if (link.getAttribute("href") === currentPage) link.classList.add("active");
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

  let selectedUserId = null;
  let currentUser = null;

  // 🔹 Carregar tots els usuaris
  async function loadUsers(selectedId = null) {
    const res = await fetch("http://10.4.41.69:8080/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users = await res.json();
    displayUsers(users, selectedId);
  }

  function displayUsers(users, selectedId = null) {
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
      const id = row.dataset.id;

      // Afegir click
      row.addEventListener("click", () => {
        tbody
          .querySelectorAll("tr")
          .forEach((r) => r.classList.remove("selected"));
        row.classList.add("selected");
        selectedUserId = id;
        selectUser(users.find((u) => u.id == id));
      });

      // Selecció automàtica si coincideix amb l'ID
      if (selectedId && id == selectedId) {
        row.classList.add("selected");
        selectedUserId = id;
        selectUser(users.find((u) => u.id == id));
      }
    });
  }

  function selectUser(user) {
    currentUser = user;
    nomEl.textContent = user.name;

    const s = user.sou || {};
    salariInput.value = s.salari_base || 0;
    complementsInput.value = s.complements || 0;
    irpfInput.value = s.irpf_actual || 0;
    ssInput.value = s.seguretat_social_actual || 0;

    editPanel.classList.add("visible");
  }

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

    editPanel.classList.remove("visible");
    // 🔄 Recarregar taula mantenint fila seleccionada
    loadUsers(currentUser.id);
  });

  cancelBtn.addEventListener("click", () => {
    editPanel.classList.remove("visible");
    currentUser = null;
    tbody.querySelectorAll("tr").forEach((r) => r.classList.remove("selected"));
    selectedUserId = null;
  });

  // 🔹 Inici
  loadUsers();
});
