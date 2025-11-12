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

  // Obtenir nom de l'usuari i substituir al h1
  (async () => {
    try {
      const res = await fetch("http://10.4.41.69:8080/user", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("No s’ha pogut obtenir el nom de l’usuari");

      const user = await res.json();

      // Seleccionem el h1 que conté "Hola @user!"
      const greeting = document.querySelector(".page-header h1");
      if (greeting) {
        greeting.textContent = `Hola ${user.name}!`;
      }
    } catch (err) {
      console.error("Error obtenint el nom de l’usuari:", err);
    }
  })();
});
