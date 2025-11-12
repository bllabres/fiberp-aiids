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

      // Omplir vista lateral
      document.getElementById("perfil-nombre").textContent = user.name || "";
      document.getElementById("perfil-email").textContent = user.email || "";
      document.getElementById("perfil-rol").textContent =
        user.roles?.join(", ") || "";
      // document.getElementById("perfil-empresa").textContent = user.empresa || ""; // si tens camp empresa

      // Omplir formulari
      document.getElementById("nom").value = user.name || "";
      document.getElementById("email").value = user.email || "";
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
}
