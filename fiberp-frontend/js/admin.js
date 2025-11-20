document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  const tbody = document.querySelector("#sou-table tbody");

  // 🔹 Dades d'exemple (TOTS amb telèfon i rol)
  const empleats = [
    {
      id: 1,
      nom: "Joan Pérez",
      email: "joan.perez@test.local",
      telefon: "634 456 789",
      rol: "ROLE_USER",
    },
    {
      id: 2,
      nom: "Maria López",
      email: "maria.lopez@test.local",
      telefon: "611 298 456",
      rol: "ROLE_USER",
    },
    {
      id: 3,
      nom: "Carlos Sánchez",
      email: "carlos.sanchez@test.local",
      telefon: "622 788 801",
      rol: "ROLE_ADMIN",
    },
  ];

  // 🔹 Elements panell edició
  const editPanel = document.getElementById("edit-panel");
  const nomEl = document.getElementById("empleat-nom");
  const salariInput = document.getElementById("edit-salari");
  const complementsInput = document.getElementById("edit-complements");
  const irpfInput = document.getElementById("edit-irpf");
  const ssInput = document.getElementById("edit-ss");
  const saveBtn = document.getElementById("save-btn");
  const cancelBtn = document.getElementById("cancel-btn");

  let currentEmpleat = null;

  // 🔹 Renderitzar taula
  function renderTable() {
    tbody.innerHTML = empleats
      .map(
        (emp) => `
      <tr data-id="${emp.id}">
        <td>${emp.id}</td>
        <td>${emp.nom}</td>
        <td>${emp.email}</td>
        <td>${emp.telefon}</td>
        <td>${emp.rol}</td>
        
      </tr>
    `
      )
      .join("");

    // Afegir click per editar
    tbody.querySelectorAll("tr").forEach((row) => {
      row.addEventListener("click", () => {
        const id = Number(row.dataset.id);
        currentEmpleat = empleats.find((e) => e.id === id);
        if (!currentEmpleat) return;

        nomEl.textContent = currentEmpleat.nom;
        salariInput.value = currentEmpleat.salari_base;
        complementsInput.value = currentEmpleat.complements;
        irpfInput.value = currentEmpleat.irpf;
        ssInput.value = currentEmpleat.ss;

        editPanel.classList.add("visible");
      });
    });
  }

  renderTable();

  // 🔹 Guardar canvis al panell
  saveBtn.addEventListener("click", () => {
    if (!currentEmpleat) return;

    currentEmpleat.salari_base = Number(salariInput.value);
    currentEmpleat.complements = Number(complementsInput.value);
    currentEmpleat.irpf = Number(irpfInput.value);
    currentEmpleat.ss = Number(ssInput.value);

    renderTable();
    editPanel.classList.remove("visible");
  });

  // 🔹 Cancel·lar edició
  cancelBtn.addEventListener("click", () => {
    editPanel.classList.remove("visible");
    currentEmpleat = null;
  });
});
