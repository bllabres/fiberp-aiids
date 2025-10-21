lucide.createIcons();

document.querySelector(".logout-btn").addEventListener("click", () => {
  window.location.href = "login.html";
});

const menuLinks = document.querySelectorAll(".menu a");
const currentPage = window.location.pathname.split("/").pop(); // ex: "perfil.html"

menuLinks.forEach((link) => {
  const href = link.getAttribute("href");

  // Evita que "#" facin res
  if (href === "#") {
    link.addEventListener("click", (e) => e.preventDefault());
    return;
  }

  // Marca com a active el link corresponent
  if (href === currentPage) {
    link.classList.add("active");
  }
});
