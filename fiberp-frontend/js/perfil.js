const token = localStorage.getItem("token"); // agafem el token real
if (!token) {
  window.location.href = "../login.html";
} else {
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

  // Funció per carregar dades de l'usuari
  async function loadUser() {
    try {
      const response = await fetch("http://10.4.41.69:8080/user", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok)
        throw new Error("No s'han pogut carregar les dades de l'usuari");

      const user = await response.json();
      const parts = user.name ? user.name.trim().split(/\s+/) : [];
      const nomUsuari = parts[0] || "";
      const cognomsUsuari = parts.length > 1 ? parts.slice(1).join(" ") : "";

      // Omplir vista lateral
      document.getElementById("perfil-nombre").textContent = user.name || "";
      document.getElementById("perfil-email").textContent = user.email || "";
      document.getElementById("perfil-rol").textContent =
        user.roles?.join(", ") || "";
      // document.getElementById("perfil-empresa").textContent = user.empresa || ""; // si tens camp empresa

      // Omplir formulari
      document.getElementById("nom").value = nomUsuari;
      document.getElementById("cognom").value = cognomsUsuari;
      document.getElementById("telefon").value = user.telefon || "";
      // La contrasenya queda buida per seguretat
      document.getElementById("password").value = "";
      document.getElementById("confirmar").value = "";
    } catch (error) {
      console.error("Error carregant usuari:", error);
      alert("Error carregant les dades del teu perfil");
    }
  }
  loadUser();
  // Seleccionem el formulari
  const form = document.querySelector(".perfil-card form");

  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // Evitem que la pàgina es recarregui

    // Recollim valors dels inputs
    const nom = document.getElementById("nom").value.trim();
    const cognom = document.getElementById("cognom").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefon = document.getElementById("telefon").value.trim();
    const password = document.getElementById("password").value;
    const confirmar = document.getElementById("confirmar").value;

    // Validació simple de contrasenyes
    if (password && password !== confirmar) {
      alert("Les contrasenyes no coincideixen.");
      return;
    }
    if (password && password.length < 6) {
      alert("La contrasenya ha de tenir un mínim de 6 caràcters.");
      return;
    }
    // Preparació de l'objecte a enviar
    // El backend espera 'name', així que unim nom i cognom si cal
    const fullName = `${nom} ${cognom}`.trim().replace(/\s+/g, " ");
    const dadesAEnviar = {
      name: fullName,
      email: email,
      telefon: telefon,
    };

    // Només afegim la contrasenya si l'usuari n'ha escrit una de nova
    if (password) {
      dadesAEnviar.password = password;
    }

    try {
      const response = await fetch("http://10.4.41.69:8080/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dadesAEnviar),
      });

      if (response.ok) {
        const result = await response.json();
        alert("Dades actualitzades correctament!");

        loadUser();

        document.getElementById("password").value = "";
        document.getElementById("confirmar").value = "";
      } else {
        const errorData = await response.json();
        alert(
          "Error: " + (errorData.error || "No s'han pogut guardar els canvis.")
        );
      }
    } catch (error) {
      console.error("Error de connexió:", error);
      alert("Hi ha hagut un error de connexió amb el servidor.");
    }
  });
}
