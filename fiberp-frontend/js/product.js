function runWithToken(callback) {
  // const token = localStorage.getItem("token");
  const token = 1; // per proves locals
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  callback(token);
}

// 🔹 Funció per obtenir productes del servidor (mantinguda)
async function fetchProducts(token) {
  try {
    const response = await fetch("http://10.4.41.69:8080/product", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error HTTP: ${response.status}`);
    }

    const products = await response.json();
    console.log("📦 Productes del servidor:", products);

    const listContainer = document.getElementById("productList");
    if (!listContainer) return;

    listContainer.innerHTML = products
      .map(
        (p) => `
      <div class="product-card" data-product-id="${p.id}">
        <h3>${p.nom}</h3>
        <p>Preu: ${p.preu} €</p>
        <p>Descripció: ${p.descripcio}</p>
        <p>Quantitat disponible: ${p.quantitat}</p>
        <div class="quantity-control">
          <button class="qty-btn minus">−</button>
          <input type="number" min="1" value="1" class="qty-input" />
          <button class="qty-btn plus">+</button>
        </div>
        <button class="btn">Afegir a la comanda</button>
      </div>
    `
      )
      .join("");

    document.querySelectorAll(".product-card .btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const card = e.target.closest(".product-card");
        const nom = card.querySelector("h3").textContent;
        const preuText = card.querySelector("p").textContent.match(/[\d.,]+/);
        const preu = preuText ? parseFloat(preuText[0].replace(",", ".")) : 0;
        const producte = { nom, preu, quantitat: 1 };
        afegirAComanda(producte, btn);
      });
    });
  } catch (error) {
    console.error("Error al obtenir productes:", error);
    const listContainer = document.getElementById("productList");
    if (listContainer)
      listContainer.innerHTML = `<p class="error">No s'han pogut carregar els productes: ${error.message}</p>`;
  }
}

runWithToken((token) => {
  lucide.createIcons();

  // Botó de logout
  document.querySelector(".logout-btn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });

  // Marcar el menú actiu
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

  // 🔹 Estructura de dades: comanda
  const comanda = [];

  const scrollBtn = document.getElementById("scrollToOrderBtn");
  if (scrollBtn) {
    scrollBtn.addEventListener("click", () => {
      const orderSection = document.querySelector(".order-section");
      if (!orderSection) return;

      orderSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function renderComanda() {
    const orderList = document.getElementById("orderList");
    if (!orderList) return;

    if (comanda.length === 0) {
      orderList.innerHTML = "<p>Encara no hi ha productes a la comanda.</p>";
      return;
    }

    orderList.innerHTML = comanda
      .map(
        (p) => `
        <div class="order-item">
          <span>${p.nom}</span>
          <span>${p.quantitat} × ${p.preu.toFixed(2)} €</span>
        </div>
      `
      )
      .join("");

    const total = comanda.reduce((sum, p) => sum + p.preu * p.quantitat, 0);
    orderList.innerHTML += `
      <hr>
      <p><strong>Total:</strong> ${total.toFixed(2)} €</p>
    `;
  }

  // 🔹 Funció per afegir producte
  function afegirAComanda(producte, btn) {
    const existent = comanda.find((p) => p.nom === producte.nom);
    if (existent) {
      existent.quantitat += producte.quantitat;
    } else {
      comanda.push(producte);
    }
    console.log("🛒 Comanda actualitzada:", comanda);
    renderComanda();

    const textOriginal = btn.textContent;
    btn.textContent = "Afegit";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = textOriginal;
      btn.disabled = false;
    }, 1000);
  }

  // 🔹 Mostrar producte de mostra
  const listContainer = document.getElementById("productList");
  if (listContainer) {
    listContainer.innerHTML = `
      <div class="product-card">
        <img src="img/p.png" alt="Producte de mostra" />
        <h3>Producte de mostra</h3>
        <p>Exemple de producte local per visualitzar el disseny.</p>
        <span class="price">99,99 €</span>
        <div class="quantity-control">
          <button class="qty-btn minus">−</button>
          <input type="number" min="1" value="1" class="qty-input" />
          <button class="qty-btn plus">+</button>
        </div>
        <button class="btn">Afegir a la comanda</button>
      </div>
    `;

    // Controls +/− i Afegir
    document.querySelectorAll(".product-card").forEach((card) => {
      const minusBtn = card.querySelector(".minus");
      const plusBtn = card.querySelector(".plus");
      const input = card.querySelector(".qty-input");
      const addBtn = card.querySelector(".btn");

      minusBtn.addEventListener("click", () => {
        let val = parseInt(input.value) || 1;
        if (val > 1) input.value = val - 1;
      });

      plusBtn.addEventListener("click", () => {
        let val = parseInt(input.value) || 1;
        input.value = val + 1;
      });

      addBtn.addEventListener("click", () => {
        const nom = card.querySelector("h3").textContent;
        const preu = parseFloat(
          card
            .querySelector(".price")
            .textContent.replace("€", "")
            .trim()
            .replace(",", ".")
        );
        const quantitat = parseInt(input.value);
        const producte = {
          id: card.dataset.productId,
          nom,
          preu,
          quantitat,
        };
        afegirAComanda(producte, addBtn);
      });
    });

    const confirmBtn = document.getElementById("confirmOrderBtn");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", async () => {
        if (comanda.length === 0) {
          alert("No hi ha cap producte a la comanda!");
          return;
        }

        confirmBtn.disabled = true;
        confirmBtn.textContent = "Enviant comanda...";

        try {
          const payload = {
            estat: "pendent",
            albara: `ALB-${Date.now()}`,
            items: comanda.map((p) => ({
              producteId: p.id,
              quantitat: p.quantitat,
            })),
          };

          const response = await fetch("http://10.4.41.69:8080/order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error || `Error HTTP: ${response.status}`
            );
          }

          const result = await response.json();
          console.log("✅ Comanda enviada amb èxit:", result);
          alert(`Comanda creada! ID: ${result.id}, total: ${result.total} €`);

          // Reset de la comanda
          comanda.length = 0;
          renderComanda();
        } catch (error) {
          console.error("Error en enviar la comanda:", error);
          alert(`Error al enviar la comanda: ${error.message}`);
        } finally {
          confirmBtn.disabled = false;
          confirmBtn.textContent = "Confirmar comanda";
        }
      });
    }
  }

  // fetchProducts(token); // Descomenta quan vulguis provar l'API
});
