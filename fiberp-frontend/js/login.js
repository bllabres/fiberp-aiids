const form = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const toggle = document.getElementById("togglePass");
const submitBtn = document.getElementById("submitBtn");
const emailError = document.getElementById("emailError");
const passError = document.getElementById("passError");

toggle.addEventListener("click", () => {
  const type = password.type === "password" ? "text" : "password";
  password.type = type;
  toggle.textContent = type === "password" ? "Mostrar" : "Ocultar";
  toggle.setAttribute(
    "aria-label",
    type === "password" ? "Mostrar contrasenya" : "Ocultar contrasenya"
  );
});

function showError(el, msg) {
  el.textContent = msg;
  el.style.display = "block";
}
function clearError(el) {
  el.textContent = "";
  el.style.display = "none";
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  let valid = true;
  clearError(emailError);
  clearError(passError);

  if (!email.value || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
    showError(emailError, "Introdueix un correu vàlid.");
    valid = false;
  }
  if (!password.value || password.value.length < 6) {
    showError(passError, "La contrasenya ha de tenir almenys 6 caràcters.");
    valid = false;
  }

  if (!valid) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Accedint...";

  console.log(email.value);
  console.log(password.value);

  try {
    const response = await fetch("http://10.4.41.69:8080/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Credencials incorrectes o error del servidor."
      );
    }

    const data = await response.json();
    console.log("Inici de sessió correcte:", data);
    localStorage.setItem("token", data.token);
    window.location.href = "../overview.html";
  } catch (error) {
    console.error("Error d'inici de sessió:", error);
    showError(passError, error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Entrar";
  }
});
