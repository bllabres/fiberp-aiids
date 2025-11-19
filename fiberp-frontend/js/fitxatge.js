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
  document.querySelector(".logout-btn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });

  // Marcar menú actiu
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

  // Rellotge digital
  function updateClock() {
    const now = new Date();
    document.getElementById("clock").textContent = now.toLocaleTimeString(
      "ca-ES",
      { hour12: false }
    );
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Fitxatge
  let fitxaActiva = false;
  const startBtn = document.getElementById("start");
  const stopBtn = document.getElementById("stop");
  const statusDiv = document.createElement("div");
  statusDiv.id = "fitxatge-status";
  startBtn.parentNode.parentNode.insertBefore(statusDiv, startBtn.parentNode);

  if (!startBtn || !stopBtn) {
    console.error("Els elements del DOM no existeixen");
    return;
  }

  function updateButtons() {
    startBtn.disabled = fitxaActiva;
    stopBtn.disabled = !fitxaActiva;
    startBtn.classList.toggle("disabled", startBtn.disabled);
    stopBtn.classList.toggle("disabled", stopBtn.disabled);
  }

  let fitxatgeStartTime = null;
  let fitxatgeTimer = null;

  function startFitxatgeTimer() {
    stopFitxatgeTimer();
    fitxatgeTimer = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now - fitxatgeStartTime) / 1000);
      const hours = String(Math.floor(diff / 3600)).padStart(2, "0");
      const minutes = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
      const seconds = String(diff % 60).padStart(2, "0");
      statusDiv.textContent = `Fitxatge actiu: ${hours}:${minutes}:${seconds}`;
    }, 1000);
  }

  function stopFitxatgeTimer() {
    if (fitxatgeTimer) clearInterval(fitxatgeTimer);
    fitxatgeTimer = null;
    fitxatgeStartTime = null;
  }

  // Comprovar fitxa activa al carregar
  async function checkFitxa() {
    try {
      const res = await fetch("http://10.4.41.69:8080/user/fitxa", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      fitxaActiva = data.active;
      updateButtons();

      if (fitxaActiva && data.history && data.history[0].hora_inici) {
        fitxatgeStartTime = new Date(data.history[0].hora_inici);
        startFitxatgeTimer();
      } else {
        stopFitxatgeTimer();
        statusDiv.textContent = "Fitxatge inactiu";
      }
    } catch (err) {
      console.error("No s'ha pogut comprovar la fitxa:", err);
      statusDiv.textContent = "Error carregant fitxatge";
    }
  }
  checkFitxa();

  // Iniciar fitxatge
  startBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("http://10.4.41.69:8080/user/fitxa", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        alert("Fitxatge iniciat!");
      } else {
        alert(data.error || "Error iniciant fitxatge");
      }
      await checkFitxa();
    } catch (err) {
      console.error(err);
      alert("Error iniciant fitxatge");
    }
  });

  // Aturar fitxatge
  stopBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("http://10.4.41.69:8080/user/fitxa", {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        alert("Fitxatge aturat!");
      } else {
        alert(data.error || "Error aturant fitxatge");
      }
      await checkFitxa();
    } catch (err) {
      console.error(err);
      alert("Error aturant fitxatge");
    }
  });
});
