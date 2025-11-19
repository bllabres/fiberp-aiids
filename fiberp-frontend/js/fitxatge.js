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

  // Estat de la fitxa i hora d’inici
  const statusEl = document.createElement("div");
  statusEl.id = "fitxatge-status";
  statusEl.textContent = "Fitxa inactiva";

  const startTimeEl = document.createElement("div");
  startTimeEl.id = "fitxatge-inici";
  startTimeEl.style.fontSize = "16px";
  startTimeEl.style.marginTop = "6px";
  startTimeEl.textContent = "";

  const container = document.querySelector(".fitxatge-container");
  container.prepend(startTimeEl);
  container.prepend(statusEl);

  // Botons
  const startBtn = document.getElementById("start");
  const stopBtn = document.getElementById("stop");

  startBtn.classList.remove("disabled");
  stopBtn.classList.add("disabled");

  // Comprovar fitxa activa al carregar
  async function checkActiveFitxa() {
    try {
      const res = await fetch("/user/fitxa", { method: "GET" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.horaInici && !data.horaFi) {
        statusEl.textContent = "Fitxa activa";
        startBtn.classList.add("disabled");
        stopBtn.classList.remove("disabled");
        const hora = new Date(data.horaInici);
        startTimeEl.textContent = `Inici: ${hora.toLocaleTimeString("ca-ES", {
          hour12: false,
        })}`;
      }
    } catch (err) {
      console.error("No s'ha pogut comprovar la fitxa activa", err);
    }
  }

  checkActiveFitxa();

  // Funcions API
  async function startFitxa() {
    try {
      const res = await fetch("/user/fitxa", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        statusEl.textContent = "Fitxa activa";
        startBtn.classList.add("disabled");
        stopBtn.classList.remove("disabled");
        const now = new Date();
        startTimeEl.textContent = `Inici: ${now.toLocaleTimeString("ca-ES", {
          hour12: false,
        })}`;
      } else {
        alert(data.error || "Error en iniciar la fitxa");
      }
    } catch (err) {
      console.error(err);
      alert("No s'ha pogut connectar amb el servidor");
    }
  }

  async function stopFitxa() {
    try {
      const res = await fetch("/user/fitxa", { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        statusEl.textContent = "Fitxa inactiva";
        startBtn.classList.remove("disabled");
        stopBtn.classList.add("disabled");
        startTimeEl.textContent = "";
      } else {
        alert(data.error || "Error en aturar la fitxa");
      }
    } catch (err) {
      console.error(err);
      alert("No s'ha pogut connectar amb el servidor");
    }
  }

  // Assignar events
  startBtn.addEventListener("click", startFitxa);
  stopBtn.addEventListener("click", stopFitxa);
});
