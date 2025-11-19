// fitxatge.js
// Integració amb els endpoints Symfony:
// POST   /user/fitxa  -> iniciar
// DELETE /user/fitxa  -> acabar
// Utilitza autenticació basada en sessió (cookies) -> fetch(..., { credentials: 'include' })

const START_KEY = "fitxatge_start_ts";

// UI elements
const clockEl = document.getElementById("clock");
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");

// Add a small status badge element if not present
let statusEl = document.getElementById("fitxatge-status");
if (!statusEl) {
  statusEl = document.createElement("div");
  statusEl.id = "fitxatge-status";
  statusEl.style.marginTop = "12px";
  statusEl.style.fontWeight = "600";
  document
    .querySelector(".fitxatge-container")
    .insertBefore(statusEl, document.querySelector(".button-row"));
}

// Helper: format duration ms -> HH:MM:SS
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// Clock + elapsed updater
let intervalId = null;
function updateClockAndElapsed() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString("ca-ES", { hour12: false });

  const ts = localStorage.getItem(START_KEY);
  if (ts) {
    const elapsedMs = Date.now() - Number(ts);
    statusEl.textContent = `Actiu — Temps transcorregut: ${formatDuration(
      elapsedMs
    )}`;
  } else {
    statusEl.textContent = "Inactiu";
  }
}

function startIntervalIfNeeded() {
  if (intervalId) return;
  intervalId = setInterval(updateClockAndElapsed, 1000);
  updateClockAndElapsed();
}

// UI state helpers
function setUIActive(isActive) {
  if (isActive) {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    startBtn.classList.add("disabled");
    stopBtn.classList.remove("disabled");
  } else {
    startBtn.disabled = false;
    stopBtn.disabled = true;
    startBtn.classList.remove("disabled");
    stopBtn.classList.add("disabled");
  }
  startIntervalIfNeeded();
}

// Show transient messages (simple toast)
function showMessage(msg, type = "info") {
  // simple alert-like toast in top-right
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.style.position = "fixed";
  toast.style.right = "20px";
  toast.style.top = "20px";
  toast.style.padding = "10px 14px";
  toast.style.borderRadius = "10px";
  toast.style.boxShadow = "0 6px 18px rgba(16,24,40,0.12)";
  toast.style.zIndex = 9999;
  toast.style.color = "#fff";
  toast.style.fontWeight = "600";
  toast.style.opacity = "0";
  toast.style.transition = "opacity .2s ease, transform .2s ease";
  if (type === "error") {
    toast.style.background = "#ef4444";
  } else if (type === "success") {
    toast.style.background = "#16a34a";
  } else {
    toast.style.background = "#2563eb";
  }
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Start fitxatge
async function iniciarFitxatge() {
  startBtn.disabled = true;
  try {
    const resp = await fetch("/user/fitxa", {
      method: "POST",
      credentials: "include", // important: send session cookie
      headers: { Accept: "application/json" },
    });

    const data = await safeJson(resp);

    if (!resp.ok) {
      // if server says 'Fitxa activa' we reflect that
      const err = data && data.error ? data.error : `Error: ${resp.status}`;
      showMessage(err, "error");

      // if server reports there's already an active fitxa, we set local active flag to sync
      if (data && data.error && data.error.toLowerCase().includes("fitxa")) {
        // we don't have the exact start time — set start ts now as best-effort
        localStorage.setItem(START_KEY, String(Date.now()));
        setUIActive(true);
      } else {
        setUIActive(false);
      }
      return;
    }

    // success
    // server returns [[{status:'succcess'}]] in your controller; we don't need it
    localStorage.setItem(START_KEY, String(Date.now()));
    setUIActive(true);
    showMessage("Fitxatge iniciat", "success");
  } catch (e) {
    console.error("Error iniciar fitxatge:", e);
    showMessage("No s'ha pogut iniciar fitxatge", "error");
    setUIActive(false);
  } finally {
    startBtn.disabled = false;
  }
}

// Stop fitxatge
async function acabarFitxatge() {
  stopBtn.disabled = true;
  try {
    const resp = await fetch("/user/fitxa", {
      method: "DELETE",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    const data = await safeJson(resp);

    if (!resp.ok) {
      const err = data && data.error ? data.error : `Error: ${resp.status}`;
      showMessage(err, "error");
      stopBtn.disabled = false;
      return;
    }

    // success -> compute elapsed if we had stored start ts
    const ts = localStorage.getItem(START_KEY);
    if (ts) {
      const elapsedMs = Date.now() - Number(ts);
      const nice = formatDuration(elapsedMs);
      showMessage(`Fitxatge aturat — Temps treballat: ${nice}`, "success");
      localStorage.removeItem(START_KEY);
    } else {
      showMessage("Fitxatge aturat", "success");
    }

    setUIActive(false);
  } catch (e) {
    console.error("Error acabar fitxatge:", e);
    showMessage("No s'ha pogut aturar fitxatge", "error");
    stopBtn.disabled = false;
  }
}

// Helper: safe JSON parse
async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// Attach events
startBtn.addEventListener("click", (e) => {
  e.preventDefault();
  iniciarFitxatge();
});
stopBtn.addEventListener("click", (e) => {
  e.preventDefault();
  acabarFitxatge();
});

// Init UI using localStorage (if user started earlier in this browser)
(function init() {
  const stored = localStorage.getItem(START_KEY);
  if (stored) {
    setUIActive(true);
  } else {
    setUIActive(false);
  }
  startIntervalIfNeeded();
})();
