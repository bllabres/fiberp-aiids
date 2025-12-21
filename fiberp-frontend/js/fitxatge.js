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

  const startBtn = document.getElementById("start");
  const stopBtn = document.getElementById("stop");
  const statusDiv = document.getElementById("fitxatge-status");
  const clockDiv = document.getElementById("clock");

  if (!startBtn || !stopBtn || !statusDiv || !clockDiv) {
    console.error("Els elements del DOM no existeixen");
    return;
  }

  function updateClock() {
    const now = new Date();
    clockDiv.textContent = now.toLocaleTimeString("ca-ES", { hour12: false });
  }
  setInterval(updateClock, 1000);
  updateClock();

  let fitxaActiva = false;

  function updateButtons() {
    startBtn.disabled = fitxaActiva;
    stopBtn.disabled = !fitxaActiva;

    startBtn.classList.toggle("disabled", fitxaActiva);
    stopBtn.classList.toggle("disabled", !fitxaActiva);
  }

  function setStatus(msg, type = "info") {
    statusDiv.textContent = msg;
    statusDiv.classList.remove("success", "error", "info");
    statusDiv.style.color =
      type === "success" ? "#22c55e" : type === "error" ? "#ef4444" : "#0f172a";
    statusDiv.style.fontWeight = "600";
    statusDiv.style.fontSize = "16px";
    statusDiv.style.marginBottom = "15px";
  }

  function formatTimePlusOneHour(isoString) {
    const d = new Date(isoString);
    d.setHours(d.getHours() + 1);
    return d.toLocaleTimeString("ca-ES", { hour12: false });
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

      if (fitxaActiva && data.history && data.history[0].hora_inici) {
        const horaInici = formatTimePlusOneHour(data.history[0].hora_inici);
        setStatus(`Fitxatge actiu des de: ${horaInici}`, "success");
      } else {
        setStatus("No hi ha fitxa activa", "info");
      }
    } catch (err) {
      console.error(err);
      setStatus("Error comprovant estat fitxa", "error");
    }
  }

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
      if (data.status) await checkFitxa();
      else setStatus(data.error || "Error iniciant fitxatge", "error");
    } catch (err) {
      console.error(err);
      setStatus("Error iniciant fitxatge", "error");
    }
  });

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

      if (data.status) setStatus("Fitxatge aturat", "success");
      else if (data.error) setStatus(data.error, "error");
      else
        setStatus(
          res.ok ? "Fitxatge aturat" : "Error aturant fitxatge",
          "info"
        );

      await checkFitxa();
    } catch (err) {
      console.error(err);
      setStatus("Error aturant fitxatge", "error");
    }
  });

  checkFitxa();
});
