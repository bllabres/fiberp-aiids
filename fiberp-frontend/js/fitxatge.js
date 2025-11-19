function runWithToken(callback) {
  //const token = localStorage.getItem("token");
  const token = 1;
  if (!token) {
    window.location.href = "http://10.4.41.69:8080/login";
    return;
  }

  callback(token);
}

runWithToken((token) => {
  lucide.createIcons();

  // Logout
  document.querySelector(".logout-btn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "http://10.4.41.69:8080/login";
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

  // Estat i hora d’inici
  const statusEl = document.createElement("div");
  statusEl.id = "fitxatge-status";
  document.querySelector(".fitxatge-container").prepend(statusEl);

  const horaIniciEl = document.createElement("div");
  horaIniciEl.id = "fitxatge-hora-inici";
  document.querySelector(".fitxatge-container").prepend(horaIniciEl);

  function updateStatus(fitxaActiva, horaInici = null) {
    statusEl.textContent = fitxaActiva ? "Fitxa activa" : "Fitxa inactiva";
    horaIniciEl.textContent = horaInici ? `Hora d'inici: ${horaInici}` : "";
    document.getElementById("start").disabled = fitxaActiva;
    document.getElementById("stop").disabled = !fitxaActiva;
  }

  // Comprovar fitxa activa al carregar la pàgina
  async function checkFitxa() {
    try {
      const res = await fetch("http://10.4.41.69:8080/user/fitxa", {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        updateStatus(false);
        return;
      }

      const data = await res.json();
      if (data && data.horaInici) {
        updateStatus(
          true,
          new Date(data.horaInici).toLocaleTimeString("ca-ES", {
            hour12: false,
          })
        );
      } else {
        updateStatus(false);
      }
    } catch (err) {
      console.warn("No s'ha pogut comprovar fitxa:", err);
      updateStatus(false);
    }
  }

  checkFitxa();

  // Iniciar fitxatge
  document.getElementById("start").addEventListener("click", async () => {
    try {
      const res = await fetch("http://10.4.41.69:8080/user/fitxa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Error iniciant fitxatge");
        return;
      }

      const now = new Date().toLocaleTimeString("ca-ES", { hour12: false });
      updateStatus(true, now);
    } catch (err) {
      console.error(err);
      alert("No s'ha pogut iniciar fitxatge");
    }
  });

  // Aturar fitxatge
  document.getElementById("stop").addEventListener("click", async () => {
    try {
      const res = await fetch("http://10.4.41.69:8080/user/fitxa", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Error aturant fitxatge");
        return;
      }

      updateStatus(false);
    } catch (err) {
      console.error(err);
      alert("No s'ha pogut aturar fitxatge");
    }
  });
});
