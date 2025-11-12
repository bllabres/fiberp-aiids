document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const name = document.getElementById("name");
  const telefon = document.getElementById("telefon");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");
  const togglePass1 = document.getElementById("togglePass1");
  const togglePass2 = document.getElementById("togglePass2");
  const submitBtn = document.getElementById("submitBtn");

  const nameError = document.getElementById("nameError");
  const telefonError = document.getElementById("telefonError");
  const emailError = document.getElementById("emailError");
  const passError = document.getElementById("passError");
  const confirmPassError = document.getElementById("confirmPassError");

  function togglePassword(input, button) {
    const type = input.type === "password" ? "text" : "password";
    input.type = type;
    button.textContent = type === "password" ? "Mostrar" : "Amagar";
  }

  togglePass1.addEventListener("click", () =>
    togglePassword(password, togglePass1)
  );
  togglePass2.addEventListener("click", () =>
    togglePassword(confirmPassword, togglePass2)
  );

  function showError(el, msg) {
    el.textContent = msg;
    el.style.display = "block";
  }

  function clearError(el) {
    el.textContent = "";
    el.style.display = "none";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    [nameError, telefonError, emailError, passError, confirmPassError].forEach(
      clearError
    );

    let valid = true;

    if (!name.value.trim()) {
      showError(nameError, "Introdueix el teu nom.");
      valid = false;
    }

    if (!telefon.value || telefon.value.length < 9) {
      showError(telefonError, "Introdueix un número de telèfon vàlid.");
      valid = false;
    }

    if (!email.value || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
      showError(emailError, "Introdueix un correu electrònic vàlid.");
      valid = false;
    }

    if (!password.value || password.value.length < 6) {
      showError(passError, "La contrasenya ha de tenir almenys 6 caràcters.");
      valid = false;
    }

    if (confirmPassword.value !== password.value) {
      showError(confirmPassError, "Les contrasenyes no coincideixen.");
      valid = false;
    }

    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Creant compte...";
    try {
      const response = await fetch("http://10.4.41.69:8080/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.value,
          password: password.value,
          name: name.value,
          telefon: telefon.value,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Error en crear l'usuari. Torna-ho a provar."
        );
      }

      const data = await response.json();
      console.log("✅ Usuari creat correctament:", data);
      alert("Compte creat correctament! Ara pots iniciar sessió.");
      window.location.href = "../overview.html";
    } catch (error) {
      console.error("Error al registrar:", error);
      showError(confirmPassError, error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Registrar-se";
    }
  });
});
