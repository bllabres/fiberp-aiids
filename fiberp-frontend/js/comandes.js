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

  // 🔹 Logout
  document.querySelector(".logout-btn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });

  // 🔹 Marcar menú actiu
  const menuLinks = document.querySelectorAll(".menu a");
  const currentPage = window.location.pathname.split("/").pop();
  menuLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPage) link.classList.add("active");
  });

  const tbody = document.querySelector("#orders-table tbody");
  const detailsContainer = document.getElementById("orderDetailsContainer");

  let selectedOrderId = null;

  // 🔹 Funció per mostrar la llista de comandes
  function displayOrders(orders) {
    tbody.innerHTML = orders
      .map(
        (order) => `
        <tr data-order-id="${order.id}">
          <td>${order.id}</td>
          <td>${order.estat}</td>
          <td>${order.total}</td>
          <td>${order.albara || "—"}</td>
          <td>${order.num_products}</td>
        </tr>
      `
      )
      .join("");

    // Afegir click a cada fila
    tbody.querySelectorAll("tr").forEach((row) => {
      row.addEventListener("click", () => {
        tbody
          .querySelectorAll("tr")
          .forEach((r) => r.classList.remove("selected"));
        row.classList.add("selected");
        selectedOrderId = row.dataset.orderId; // Guardem la comanda seleccionada
        fetchOrderDetails(selectedOrderId);
      });
    });
  }

  // 🔹 Funció per obtenir comandes del backend
  async function fetchOrders() {
    try {
      const response = await fetch("http://10.4.41.69:8080/order", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("No s’han pogut carregar les comandes");

      const orders = await response.json();
      displayOrders(orders);
    } catch (error) {
      console.error("Error carregant comandes:", error);
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error carregant comandes: ${error.message}</td></tr>`;
    }
  }

  // 🔹 Funció per obtenir detalls d’una comanda
  async function fetchOrderDetails(orderId) {
    try {
      const response = await fetch(`http://10.4.41.69:8080/order/${orderId}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("No s’han pogut carregar els detalls");

      const order = await response.json();

      // Mostrar detalls dins el HTML
      detailsContainer.innerHTML = `
        <p><strong>ID:</strong> ${order.id}</p>
        <p><strong>Estat:</strong> ${order.estat}</p>
        <p><strong>Total:</strong> ${order.total} €</p>
        <p><strong>Albarà:</strong> ${order.albara || "—"}</p>
        <h3>Items:</h3>
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Preu</th>
              <th>Quantitat</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              .map((item) => {
                const preu = parseFloat(item.producte.preu) || 0;
                const total = parseFloat(item.total) || 0;
                return `
      <tr>
        <td>${item.producte.nom}</td>
        <td>${preu.toFixed(2)} €</td>
        <td>${item.quantitat}</td>
        <td>${total.toFixed(2)} €</td>
      </tr>
    `;
              })
              .join("")}
          </tbody>
        </table>
      `;
    } catch (error) {
      console.error("Error carregant detalls:", error);
      detailsContainer.innerHTML = `<p style="color:red;">Error carregant detalls: ${error.message}</p>`;
    }
  }

  // 🔹 Inicialment carreguem la llista de comandes
  fetchOrders();

  // 🔹 Botó pujar albarà
  const uploadBtn = document.getElementById("uploadAlbaraBtn");
  const fileInput = document.getElementById("inputAlbara");

  // Activar input quan cliques el botó
  uploadBtn.addEventListener("click", () => {
    if (!selectedOrderId) {
      alert("Selecciona una comanda primer!");
      return;
    }
    fileInput.click();
  });

  // Quan escull fitxer, el puja
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("albara_file", file); // Nom que espera Symfony

    try {
      const res = await fetch(
        `http://10.4.41.69:8080/order/${selectedOrderId}/albara`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // No posar 'Content-Type': FormData el gestiona
          },
          body: formData,
        }
      );

      if (res.ok) {
        alert("📄 Albarà pujat correctament!");
        fetchOrderDetails(selectedOrderId);
        fetchOrders();
      } else {
        const errorText = await res.text();
        alert(`❌ Error pujant l’albarà: ${errorText}`);
      }
    } catch (err) {
      alert("⚠️ Error amb la pujada");
      console.error(err);
    }
  });
});
