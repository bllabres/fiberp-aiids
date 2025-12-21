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
      const greeting = document.querySelector(".page-header h1");
      if (greeting) {
        greeting.textContent = `Hola ${user.name}!`;
      }
    } catch (err) {
      console.error("Error obtenint el nom de l’usuari:", err);
    }
  })();
});
