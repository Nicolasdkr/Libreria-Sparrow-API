const API_URL = "http://localhost:5000/api/productos"; // Cambia esto por tu IP si es necesario

fetch(API_URL)
  .then((res) => res.json())
  .then((productos) => {
    const disponibles = document.getElementById("libros-disponibles");
    const proximamente = document.getElementById("libros-proximamente");

    productos.forEach((p) => {
      // Solo mostrar si está disponible y tiene stock
      if (p.estado !== "Disponible" || p.stock <= 0) {
        return; // Salta este libro
      }

      const card = `
          <div class="col-md-4 mb-4">
            <div class="card h-100 shadow-sm">
              <img src="${p.imagen}" class="card-img-top img-libro" alt="${p.titulo}" style="height: 480px; object-fit: cover;" />
              <div class="card-body">
                <h5 class="card-title">${p.titulo}</h5>
                <p class="card-text"><strong>Autor:</strong> ${p.autor}</p>
                <p class="card-text text-muted">${p.descripcion}</p>
                <p class="card-text"><strong>Precio:</strong> $${p.precio}</p>
              </div>
              <div class="card-footer bg-transparent border-top-0">
                <a href="formulario.html?id=${p._id}" class="btn btn-danger w-100">
                  <i class="bi bi-cart-fill me-1"></i>Comprar
                </a>
              </div>
            </div>
          </div>
        `;

      disponibles.innerHTML += card;
    });
  })
  .catch((err) => {
    console.error("Error al cargar libros:", err);
  });
