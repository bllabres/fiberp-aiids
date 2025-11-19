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

  const salariBaseInput = document.getElementById("salari_base");
  const complementsInput = document.getElementById("complements");
  const irpfInput = document.getElementById("irpf_actual");
  const ssInput = document.getElementById("seguretat_social_actual");
  const statusDiv = document.getElementById("sou-status");

  function setStatus(msg, type = "info") {
    statusDiv.textContent = msg;
    statusDiv.className = "";
    statusDiv.classList.add("status-info");
    if (type === "success") statusDiv.classList.add("status-success");
    else if (type === "error") statusDiv.classList.add("status-error");
  }

  async function carregarSou() {
    try {
      const res = await fetch("/user/sou", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        salariBaseInput.value = data.salari_base || 0;
        complementsInput.value = data.complements || 0;
        irpfInput.value = data.irpf_actual || 0;
        ssInput.value = data.seguretat_social_actual || 0;
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
