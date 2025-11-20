document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  const token = localStorage.getItem("token");
  if (!token) window.location = "login.html";

  /** 🔐 Comprovar que l’usuari és ADMIN */
  async function checkAdmin() {
    try {
      const res = await fetch("http://10.4.41.69:8080/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();

      const user = await res.json();
      if (!user.roles.includes("ROLE_ADMIN")) {
        alert("❌ No tens permisos per accedir a aquesta pàgina.");
        window.location = "overview.html";
      }
    } catch (e) {
      window.location = "login.html";
    }
  }

  checkAdmin();

  /** 📌 Variables UI */
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

  /** 🔹 1) Carregar usuaris */
  async function fetchUsers() {
    try {
      const res = await fetch("http://10.4.41.69:8080/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error carregant usuaris");
      const users = await res.json();
      renderUsers(users);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="9" style="color:red;text-align:center;">${e.message}</td></tr>`;
    }
  }

  /** 🔹 2) Renderitzar usuaris a la taula */
  function renderUsers(users) {
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
      row.addEventListener("click", () => openSalaryPanel(row.dataset.id));
    });
  }

  /** 🔹 3) Obrir panell sou */
  async function openSalaryPanel(id) {
    currentUser = id;

    try {
      const resUser = await fetch(`http://10.4.41.69:8080/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await resUser.json();
      nomEl.textContent = userData.name;

      const res = await fetch(`http://10.4.41.69:8080/user/${id}/sou`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        salariInput.value = "";
        complementsInput.value = "";
        irpfInput.value = "";
        ssInput.value = "";
      } else {
        const sou = await res.json();
        salariInput.value = sou.salari_base;
        complementsInput.value = sou.complements;
        irpfInput.value = sou.irpf_actual;
        ssInput.value = sou.seguretat_social_actual;
      }

      editPanel.classList.add("visible");
    } catch (e) {
      alert("Error carregant sou");
    }
  }

  /** 🔹 4) Guardar canvis */
  saveBtn.addEventListener("click", async () => {
    if (!currentUser) return;

    try {
      const res = await fetch(
        `http://10.4.41.69:8080/user/${currentUser}/sou`,
        {
          method: "PATCH",
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
        }
      );

      if (!res.ok) throw new Error("Error guardant sou");

      alert("Sou actualitzat correctament");
      editPanel.classList.remove("visible");
      fetchUsers();
    } catch (e) {
      alert(e.message);
    }
  });

  /** 🔹 5) Cancel·lar edició */
  cancelBtn.addEventListener("click", () => {
    editPanel.classList.remove("visible");
    currentUser = null;
  });

  /** 🚀 Inicialitzar llista */
  fetchUsers();
});
