function runWithToken(callback) {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  callback(token);
}

runWithToken((token) => {
  // Inicialitza les icones
  lucide.createIcons();

  // Logout
  document.querySelector(".logout-btn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });

  // Marcatge de la pàgina activa al menú
  const menuLinks = document.querySelectorAll(".menu a");
  const currentPage = window.location.pathname.split("/").pop();

  menuLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === "#") {
      link.addEventListener("click", (e) => e.preventDefault());
      return;
    }
    if (href === currentPage) {
      link.classList.add("active");
    }
  });

  // ------------------------
  // Fetch real del backend
  // ------------------------
  function displayOrders(orders) {
    const tbody = document.querySelector("#orders-table tbody");
    tbody.innerHTML = orders
      .map(
        (order) => `
      <tr>
        <td>${order.id}</td>
        <td>${order.estat}</td>
        <td>${order.total}</td>
        <td>${order.albara || "—"}</td>
        <td>${order.num_products}</td>
      </tr>
    `
      )
      .join("");
  }

  async function fetchOrders() {
    try {
      const response = await fetch("http://10.4.41.69:8080/order", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`, // si el backend requereix token
        },
      });

      if (!response.ok) {
        throw new Error("No s’han pogut carregar les comandes");
      }

      const orders = await response.json();
      displayOrders(orders);
    } catch (error) {
      console.error("Error carregant les comandes:", error);
      const tbody = document.querySelector("#orders-table tbody");
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; color:red;">
            Error carregant les comandes: ${error.message}
          </td>
        </tr>`;
    }
  }

  // Executa la crida real al backend
  fetchOrders();
});
