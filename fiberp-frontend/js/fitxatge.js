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

  // Estat de fitxatge
  let fitxaActiva = false;

  function updateStatus(activa, hora = null) {
    fitxaActiva = activa;
    const startBtn = document.getElementById("start");
    const stopBtn = document.getElementById("stop");
    startBtn.disabled = activa;
    stopBtn.disabled = !activa;

    let statusEl = document.getElementById("fitxatge-status");
    if (!statusEl) {
      statusEl = document.createElement("p");
      statusEl.id = "fitxatge-status";
      statusEl.style.fontWeight = "600";
      statusEl.style.marginTop = "12px";
      document.querySelector(".fitxatge-container").prepend(statusEl);
    }

    if (activa) {
      statusEl.textContent = `Fitxatge iniciat a les ${
        hora || new Date().toLocaleTimeString("ca-ES", { hour12: false })
      }`;
      statusEl.style.color = "#22c55e";
    } else {
      statusEl.textContent = "Fitxatge aturat";
      statusEl.style.color = "#ef4444";
    }
  }

  // Comprovar fitxa activa al carregar la pàgina
  async function checkFitxa() {
    try {
      const res = await fetch("http://10.4.41.69:8080/user/fitxa", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.activa) {
          updateStatus(true, data.horaInici);
        } else {
          updateStatus(false);
        }
      } else {
        updateStatus(false);
      }
    } catch (err) {
      console.error("Error comprovant fitxa:", err);
      updateStatus(false);
    }
  }

  checkFitxa();

  // Start fitxatge
  document.getElementById("start").addEventListener("click", async () => {
    if (fitxaActiva) return;

    try {
      const res = await fetch("http://10.4.41.69:8080/user/fitxa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Error iniciant fitxatge");
        return;
      }

      const now = new Date().toLocaleTimeString("ca-ES", { hour12: false });
      updateStatus(true, now);
    } catch (err) {
      console.error(err);
      alert("No s'ha pogut iniciar fitxatge");
    }
  });

  // Stop fitxatge
  document.getElementById("stop").addEventListener("click", async () => {
    if (!fitxaActiva) return;

    try {
      const res = await fetch("http://10.4.41.69:8080/user/fitxa", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Error aturant fitxatge");
        return;
      }

      updateStatus(false);
    } catch (err) {
      console.error(err);
      alert("No s'ha pogut aturar fitxatge");
    }
  });
});
