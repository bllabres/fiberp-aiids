function runWithToken(callback) {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  callback(token);
}

runWithToken((token) => {
  lucide.createIcons();

  // Logout
  const logoutBtn = document.querySelector(".logout-btn");
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });

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

  // Elements on mostrar les dades de sou
  const salariBaseEl = document.getElementById("salari_base");
  const complementsEl = document.getElementById("complements");
  const irpfEl = document.getElementById("irpf_actual");
  const ssEl = document.getElementById("seguretat_social_actual");
  const statusDiv = document.getElementById("sou-status");

  // Funció per mostrar missatges d'estat
  function setStatus(msg, type = "info") {
    statusDiv.textContent = msg;
    statusDiv.className = "";
    statusDiv.classList.add(
      type === "success"
        ? "status-success"
        : type === "error"
        ? "status-error"
        : "status-info"
    );
  }

  // Funció per carregar dades del sou
  async function carregarSou() {
    try {
      const res = await fetch("http://10.4.41.69:8080/user/sou", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        salariBaseEl.textContent = data.salari_base ?? 0;
        complementsEl.textContent = data.complements ?? 0;
        irpfEl.textContent = data.irpf_actual ?? 0;
        ssEl.textContent = data.seguretat_social_actual ?? 0;
        setStatus("Dades de sou carregades", "success");
      } else {
        setStatus(
          data.error || "No es poden carregar les dades de sou",
          "error"
        );
      }
    } catch (err) {
      console.error(err);
      setStatus("Error carregant dades", "error");
    }
  }

  carregarSou();
});
