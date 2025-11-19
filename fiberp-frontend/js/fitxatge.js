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

  document.querySelector(".logout-btn").addEventListener("click", () => {
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

  function updateClock() {
    const now = new Date();
    document.getElementById("clock").textContent = now.toLocaleTimeString(
      "ca-ES",
      { hour12: false }
    );
  }
  setInterval(updateClock, 1000);
  updateClock();

  let fitxaActiva = false;
  const startBtn = document.getElementById("start");
  const stopBtn = document.getElementById("stop");

  function updateButtons() {
    if (fitxaActiva) {
      startBtn.disabled = true;
      stopBtn.disabled = false;
    } else {
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
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
    } catch (err) {
      console.error("No s'ha pogut comprovar la fitxa:", err);
    }
  }
  checkFitxa();

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
        fitxaActiva = true;
        updateButtons();
      } else {
        alert(data.error || "Error iniciant fitxatge");
      }
    } catch (err) {
      console.error(err);
      alert("Error iniciant fitxatge");
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
      const data = await res.json();

      if (res.ok) {
        alert("Fitxatge aturat!");
        fitxaActiva = false;
        updateButtons();
      } else {
        alert(data.error || "Error aturant fitxatge");
      }
    } catch (err) {
      console.error(err);
      alert("Error aturant fitxatge");
    }
  });
});
