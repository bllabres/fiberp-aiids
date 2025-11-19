runWithToken((token) => {
  lucide.createIcons();

  const startBtn = document.getElementById("start");
  const stopBtn = document.getElementById("stop");
  const statusDiv = document.getElementById("fitxatge-status");

  if (!startBtn || !stopBtn || !statusDiv) {
    console.error("Els elements del DOM no existeixen");
    return;
  }

  let fitxaActiva = false;
  let fitxatgeStartTime = null;

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
  }

  function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
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
        fitxatgeStartTime = new Date(data.history[0].hora_inici);
        if (!isNaN(fitxatgeStartTime)) {
          setStatus(
            `Fitxatge actiu des de: ${formatTime(fitxatgeStartTime)}`,
            "success"
          );
        } else {
          setStatus("Fitxatge actiu, hora no vàlida", "error");
        }
      } else {
        setStatus("No hi ha fitxa activa", "info");
      }
    } catch (err) {
      console.error(err);
      setStatus("Error comprovant estat fitxa", "error");
    }
  }

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
        setStatus("Fitxatge aturat", "success");
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

  // Comprovació inicial
  checkFitxa();
});
