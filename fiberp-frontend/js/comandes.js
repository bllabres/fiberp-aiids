function runWithToken(callback) {
  //const token = localStorage.getItem("token");
  const token = 1; // Simulació de token
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
  // Comandes locals de prova
  // ------------------------
  const mockOrders = [
    {
      id: 101,
      estat: "Pendents",
      total: 120.5,
      albara: "ALB-001",
      num_products: 3,
    },
    {
      id: 102,
      estat: "Enviades",
      total: 75.0,
      albara: "ALB-002",
      num_products: 2,
    },
    {
      id: 103,
      estat: "Cancel·lades",
      total: 0.0,
      albara: null,
      num_products: 0,
    },
    {
      id: 104,
      estat: "Completades",
      total: 200.99,
      albara: "ALB-004",
      num_products: 5,
    },
  ];

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

  // Mostrar primer les comandes locals
  displayOrders(mockOrders);

  // ------------------------
  // Fetch real del backend
  // ------------------------
  async function fetchOrders() {
    try {
      const response = await fetch("http://10.4.41.69:8080/order", {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error("No s’han pogut carregar les comandes");
      }

      const orders = await response.json();
      displayOrders(orders); // Reemplaça les dades locals amb les reals
    } catch (error) {
      console.warn(error.message);
      // Les comandes locals continuen mostrant-se si el fetch falla
    }
  }

  // Executa la crida real al backend
  //fetchOrders();
});
