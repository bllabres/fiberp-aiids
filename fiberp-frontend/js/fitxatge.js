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

  // Estat fitxatge
  let fitxaActiva = false;
  const startBtn = document.getElementById("start");
  const stopBtn = document.getElementById("stop");

  // Funció per actualitzar botons segons l'estat
  function updateButtons() {
    startBtn.disabled = fitxaActiva;
    stopBtn.disabled = !fitxaActiva;
  }

  // -----------------------------
  // Comprovar fitxa activa al carregar
  // -----------------------------
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
    } catch (err) {
      console.error("No s'ha pogut comprovar la fitxa:", err);
    }
  }
  checkFitxa();

  // -----------------------------
  // Iniciar fitxatge
  // -----------------------------
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
        await checkFitxa(); // REFRESCA ESTAT I BOTONS
      } else {
        alert(data.error || "Error iniciant fitxatge");
      }
    } catch (err) {
      console.error(err);
      alert("Error iniciant fitxatge");
    }
  });

  // -----------------------------
  // Aturar fitxatge
  // -----------------------------
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
        alert(
          data.status ? "Fitxatge aturat!" : data.error || "Acció completada"
        );
        await checkFitxa(); // REFRESCA ESTAT I BOTONS
      } else {
        alert(data.error || "Error aturant fitxatge");
      }
    } catch (err) {
      console.error(err);
      alert("Error aturant fitxatge");
    }
  });
});
