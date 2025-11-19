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
  const statusDiv = document.getElementById("fitxatge-status");

  if (!startBtn || !stopBtn || !statusDiv) {
    console.error("Els elements del DOM no existeixen");
    return;
  }

  function updateButtons() {
    startBtn.disabled = fitxaActiva;
    stopBtn.disabled = !fitxaActiva;

    startBtn.classList.toggle("disabled", fitxaActiva);
    stopBtn.classList.toggle("disabled", !fitxaActiva);
  }

  function setStatus(msg, type = "info") {
    statusDiv.textContent = msg;
    statusDiv.style.color =
      type === "success" ? "#22c55e" : type === "error" ? "#ef4444" : "#0f172a";
    console.log(msg);
  }

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
      setStatus(data.active ? "Fitxa activa" : "No hi ha fitxa activa", "info");
    } catch (err) {
      console.error(err);
      setStatus("Error comprovant estat fitxa", "error");
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

      if (data.status) {
        setStatus("Fitxatge iniciat!", "success");
        await checkFitxa();
      } else {
        setStatus(data.error || "Error iniciant fitxatge", "error");
      }
    } catch (err) {
      console.error(err);
      setStatus("Error iniciant fitxatge", "error");
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
      let data;
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (data.status) {
        setStatus("Fitxatge aturat!", "success");
      } else if (data.error) {
        setStatus(data.error, "error");
      } else {
        setStatus(
          res.ok ? "Fitxatge aturat" : "Error aturant fitxatge",
          "info"
        );
      }

      await checkFitxa();
    } catch (err) {
      console.error(err);
      setStatus("Error aturant fitxatge", "error");
    }
  });
});
