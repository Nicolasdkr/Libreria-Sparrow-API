document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("btn-convertir")
    .addEventListener("click", convertirMoneda);
  document
    .getElementById("form-libro")
    .addEventListener("submit", agregarLibro);
  document
    .getElementById("form-cliente")
    .addEventListener("submit", guardarCliente);

  cargarAPI();
  cargarLibros();
  cargarPedidos();
  cargarClientes();
  calcularTop10();
});

let productoEditandoId = null;

// 🔐 Clave de acceso
function verificarClave() {
  const clave = document.getElementById("clave-admin").value;
  const mensaje = document.getElementById("mensaje-clave");

  if (clave.trim() === "admin123") {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";
  } else {
    mensaje.textContent = "⚠️ Clave incorrecta";
  }
}

// 💱 API moneda
let indicadores = {};
async function cargarAPI() {
  try {
    const res = await fetch("https://mindicador.cl/api");
    const data = await res.json();
    indicadores = {
      uf: data.uf.valor,
      utm: data.utm.valor,
      euro: data.euro.valor,
    };
    document.getElementById(
      "valor-uf"
    ).textContent = `$${indicadores.uf.toLocaleString()}`;
    document.getElementById(
      "valor-utm"
    ).textContent = `$${indicadores.utm.toLocaleString()}`;
    document.getElementById(
      "valor-euro"
    ).textContent = `$${indicadores.euro.toLocaleString()}`;
  } catch (error) {
    console.error("Error cargando API:", error);
  }
}

function convertirMoneda() {
  const monto = parseFloat(document.getElementById("convertir-monto").value);
  const tipo = document.getElementById("convertir-moneda").value;
  if (!monto || !indicadores[tipo]) return;
  const resultado = (monto / indicadores[tipo]).toFixed(2);
  document.getElementById(
    "resultado-conversion"
  ).textContent = `${resultado} ${tipo.toUpperCase()}`;
}

// 📚 Gestión de libros (conectado a API)
async function agregarLibro(e) {
  e.preventDefault();

  const libro = {
    titulo: document.getElementById("titulo").value.trim(),
    autor: document.getElementById("autor").value.trim(),
    categoria: document.getElementById("categoria").value.trim(),
    precio: parseInt(document.getElementById("precio").value),
    stock: parseInt(document.getElementById("stock").value),
    estado: document.getElementById("estado").value,
    proveedor_id: document.getElementById("proveedor").value.trim(),
  };

  if (!libro.titulo || !libro.autor || isNaN(libro.precio)) return;

  try {
    if (productoEditandoId) {
      await fetch(`http://localhost:5000/api/productos/${productoEditandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(libro),
      });
      productoEditandoId = null;
      document.querySelector("#form-libro button[type='submit']").textContent =
        "Agregar Libro";
    } else {
      await fetch("http://localhost:5000/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(libro),
      });
    }

    document.getElementById("form-libro").reset();
    cargarLibros();
  } catch (error) {
    console.error("Error al guardar el libro:", error);
  }
}

async function cargarLibros() {
  const tabla = document.getElementById("tabla-libros");
  tabla.innerHTML = "";

  try {
    const res = await fetch("http://localhost:5000/api/productos");
    const libros = await res.json();

    libros.forEach((libro) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${libro.titulo}</td>
        <td>${libro.autor}</td>
        <td>${libro.categoria}</td>
        <td>$${libro.precio.toLocaleString()}</td>
        <td>${libro.stock}</td>
        <td>${libro.estado}</td>
        <td>${libro.proveedor_nombre || "-"}</td>
        <td class="d-flex gap-2 justify-content-center">
          <button class="btn btn-sm btn-warning" onclick="editarLibro('${
            libro._id
          }')">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarLibro('${
            libro._id
          }')">Eliminar</button>
        </td>
      `;
      tabla.appendChild(fila);
    });
  } catch (error) {
    console.error("Error al cargar libros:", error);
  }
}

async function editarLibro(id) {
  try {
    const res = await fetch("http://localhost:5000/api/productos");
    const libros = await res.json();
    const libro = libros.find((l) => l._id === id);
    if (!libro) return;

    document.getElementById("titulo").value = libro.titulo;
    document.getElementById("autor").value = libro.autor;
    document.getElementById("categoria").value = libro.categoria;
    document.getElementById("precio").value = libro.precio;
    document.getElementById("stock").value = libro.stock;
    document.getElementById("estado").value = libro.estado;
    document.getElementById("proveedor").value = libro.proveedor_nombre;

    productoEditandoId = id;
    document.querySelector("#form-libro button[type='submit']").textContent =
      "Guardar Cambios";
  } catch (error) {
    console.error("Error al editar libro:", error);
  }
}

async function eliminarLibro(id) {
  if (!confirm("¿Seguro que deseas eliminar este libro?")) return;

  try {
    await fetch(`http://localhost:5000/api/productos/${id}`, {
      method: "DELETE",
    });
    cargarLibros();
  } catch (error) {
    console.error("Error al eliminar libro:", error);
  }
}

//SECCION DE PEDIDOS

let pedidos = [];

// 📦 Cargar pedidos desde la API
async function cargarPedidos() {
  const tabla = document.getElementById("tabla-pedidos");
  tabla.innerHTML = "";

  try {
    const res = await fetch("http://localhost:5000/api/pedidos");
    pedidos = await res.json();

    pedidos.forEach((pedido) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${pedido.nombre || pedido.cliente || "Cliente"}</td>
        <td>${pedido.productos[0]?.titulo || "-"}</td>
        <td>${pedido.productos[0]?.cantidad || 1}</td>
        <td>$${pedido.total_final?.toLocaleString() || "0"}</td>
        <td>
          <select onchange="actualizarEstadoPedido('${
            pedido._id
          }', this.value)" class="form-select form-select-sm">
            <option ${
              pedido.estado_envio === "Pendiente" ? "selected" : ""
            }>Pendiente</option>
            <option ${
              pedido.estado_envio === "Enviado" ? "selected" : ""
            }>Enviado</option>
            <option ${
              pedido.estado_envio === "Recibido" ? "selected" : ""
            }>Recibido</option>
          </select>
        </td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="eliminarPedido('${
            pedido._id
          }')">Eliminar</button>
        </td>
      `;
      tabla.appendChild(fila);
    });
  } catch (error) {
    console.error("Error al cargar pedidos:", error);
  }
}

// ✏️ Actualizar estado del pedido
async function actualizarEstadoPedido(id, nuevoEstado) {
  try {
    await fetch(`http://localhost:5000/api/pedidos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado_envio: nuevoEstado }),
    });
    cargarPedidos();
  } catch (error) {
    console.error("Error al actualizar estado:", error);
  }
}

// 🗑️ Eliminar pedido
async function eliminarPedido(id) {
  if (!confirm("¿Eliminar este pedido?")) return;

  try {
    await fetch(`http://localhost:5000/api/pedidos/${id}`, {
      method: "DELETE",
    });
    cargarPedidos();
  } catch (error) {
    console.error("Error al eliminar pedido:", error);
  }
}

// 👥 Cargar clientes desde la API
async function cargarClientes() {
  const tabla = document.getElementById("tabla-clientes");
  tabla.innerHTML = "";

  try {
    const res = await fetch("http://localhost:5000/api/clientes");
    const clientes = await res.json();

    clientes.forEach((cliente) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${cliente.nombre}</td>
        <td>${cliente.rut}</td>
        <td>${cliente.email}</td>
        <td>${cliente.telefono}</td>
        <td>${cliente.pedido_activo ? "✅" : "❌"}</td>
        <td class="d-flex gap-2 justify-content-center">
          <button class="btn btn-sm btn-warning" onclick="editarCliente('${
            cliente._id
          }')">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarCliente('${
            cliente._id
          }')">Eliminar</button>
        </td>
      `;
      tabla.appendChild(fila);
    });
  } catch (error) {
    console.error("Error al cargar clientes:", error);
  }
}

// 🗑️ Eliminar cliente
async function eliminarCliente(id) {
  if (!confirm("¿Eliminar este cliente?")) return;

  try {
    await fetch(`http://localhost:5000/api/clientes/${id}`, {
      method: "DELETE",
    });
    cargarClientes();
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
  }
}

// ✏️ Editar cliente (requiere formulario si lo implementas)
async function editarCliente(id) {
  try {
    const res = await fetch("http://localhost:5000/api/clientes");
    const clientes = await res.json();
    const cliente = clientes.find((c) => c._id === id);
    if (!cliente) return;

    // Aquí puedes poblar un formulario si decides agregar uno
    document.getElementById("nombre").value = cliente.nombre;
    document.getElementById("rut").value = cliente.rut;
    document.getElementById("email").value = cliente.email;
    document.getElementById("telefono").value = cliente.telefono;

    clienteEditandoId = id;
    document.querySelector("#form-cliente button[type='submit']").textContent =
      "Guardar Cambios";
  } catch (error) {
    console.error("Error al editar cliente:", error);
  }
}

// 🧾 Guardar cliente (nuevo o editado)
async function guardarCliente(e) {
  e.preventDefault();

  const cliente = {
    nombre: document.getElementById("nombre").value.trim(),
    rut: document.getElementById("rut").value.trim(),
    email: document.getElementById("email").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    pedido_activo: true, // o false según lógica
  };

  try {
    if (clienteEditandoId) {
      await fetch(`http://localhost:5000/api/clientes/${clienteEditandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cliente),
      });
      clienteEditandoId = null;
      document.querySelector(
        "#form-cliente button[type='submit']"
      ).textContent = "Agregar Cliente";
    } else {
      await fetch("http://localhost:5000/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cliente),
      });
    }

    document.getElementById("form-cliente").reset();
    cargarClientes();
  } catch (error) {
    console.error("Error al guardar cliente:", error);
  }
}

function calcularTop10() {
  const topEjemplo = [
    { titulo: "Harry Potter", autor: "J.K. Rowling", cantidad: 120 },
    { titulo: "El Nombre del Viento", autor: "Patrick Rothfuss", cantidad: 95 },
    { titulo: "Cementerio de Animales", autor: "Stephen King", cantidad: 78 },
    { titulo: "El Imperio Final", autor: "Brandon Sanderson", cantidad: 70 },
    { titulo: "Orgullo y Prejuicio", autor: "Jane Austen", cantidad: 66 },
    { titulo: "Lord of the Mysteries", autor: "Cuttlefish TLD", cantidad: 50 },
    { titulo: "Don Quijote", autor: "Miguel de Cervantes", cantidad: 48 },
    { titulo: "1984", autor: "George Orwell", cantidad: 42 },
    {
      titulo: "Crónica de una muerte anunciada",
      autor: "García Márquez",
      cantidad: 38,
    },
    { titulo: "La Metamorfosis", autor: "Franz Kafka", cantidad: 33 },
  ];

  const tbody = document.getElementById("top-productos");
  tbody.innerHTML = "";

  topEjemplo.forEach((libro, index) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${index + 1}</td>
      <td>${libro.titulo}</td>
      <td>${libro.autor}</td>
      <td>${libro.cantidad}</td>
    `;
    tbody.appendChild(fila);
  });
}

//esta es la funcion que dije que te comente bro respecto a la iteracion de los libros, cuando se implemente la opcion de compra y se refleje el stock en la bd, reemplazmos por este codigo

/*
// 📈 Top 10 productos más vendidos
function calcularTop10() {
  const pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];
  const conteo = {};

  pedidos.forEach((pedido) => {
    pedido.productos.forEach((prod) => {
      if (!conteo[prod.titulo]) {
        conteo[prod.titulo] = 0;
      }
      conteo[prod.titulo] += prod.cantidad;
    });
  });

  const top = Object.entries(conteo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const lista = document.getElementById("top-productos");
  lista.innerHTML = "";

  if (top.length === 0) {
    lista.innerHTML = "<li class='text-muted'>No hay datos disponibles.</li>";
    return;
  }

  top.forEach(([titulo, cantidad]) => {
    const item = document.createElement("li");
    item.textContent = `${titulo} — ${cantidad} vendidos`;
    lista.appendChild(item);
  });
}*/
