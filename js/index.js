let librosDisponibles = [];
let indicadores = {};

document.addEventListener("DOMContentLoaded", () => {
  cargarLibrosDesdeAPI();
  cargarValoresMoneda();
  configurarEventos();
});

function configurarEventos() {
  document
    .getElementById("form-compra")
    .addEventListener("submit", realizarCompra);
  document.getElementById("libro").addEventListener("change", () => {
    mostrarDetallesLibro();
    actualizarPrecioTotal();
  });
  document
    .getElementById("cantidad")
    .addEventListener("input", actualizarPrecioTotal);
  document
    .getElementById("pais-envio")
    .addEventListener("change", actualizarPrecioTotal);
  document
    .querySelectorAll("input[name='envio']")
    .forEach((radio) =>
      radio.addEventListener("change", actualizarPrecioTotal)
    );
  document
    .getElementById("btn-convertir")
    .addEventListener("click", convertirMoneda);
  document
    .getElementById("aplicar-descuento")
    .addEventListener("click", actualizarPrecioTotal);
  document
    .getElementById("calcular-edad")
    .addEventListener("click", calcularEdad);
  document
    .getElementById("encriptar-nombre")
    .addEventListener("click", encriptarNombre);
}

// 📚 Cargar libros desde la API
async function cargarLibrosDesdeAPI() {
  try {
    const res = await fetch("http://localhost:5000/api/productos");
    const libros = await res.json();
    librosDisponibles = libros.filter(
      (l) => l.estado === "Disponible" && l.stock > 0
    );

    const select = document.getElementById("libro");
    select.innerHTML = `<option value="">-- Selecciona un libro --</option>`;
    librosDisponibles.forEach((libro, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = libro.titulo;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar libros:", error);
  }
}

// 🖼️ Mostrar detalles del libro
function mostrarDetallesLibro() {
  const index = document.getElementById("libro").value;
  const detalles = document.getElementById("detalles-libro");

  if (index === "") {
    detalles.style.display = "none";
    return;
  }

  const libro = librosDisponibles[index];
  document.getElementById("detalle-titulo").textContent = libro.titulo;
  document.getElementById("detalle-autor").textContent = libro.autor;
  document.getElementById("detalle-descripcion").textContent =
    libro.descripcion || "Sin descripción";
  document.getElementById("detalle-categoria").textContent = libro.categoria;
  document.getElementById(
    "detalle-precio"
  ).textContent = `$${libro.precio.toLocaleString()}`;
  document.getElementById(
    "detalle-stock"
  ).textContent = `Stock: ${libro.stock}`;
  document.getElementById(
    "detalle-estado"
  ).textContent = `Estado: ${libro.estado}`;
  document.getElementById("detalle-proveedor").textContent = `Proveedor: ${
    libro.proveedor_id || "N/A"
  }`;
  document.getElementById("detalle-imagen").src =
    libro.imagen || "img/placeholder.jpg";

  detalles.style.display = "block";
  actualizarPrecioTotal();
}

//actualizar precio total
function actualizarPrecioTotal() {
  const index = document.getElementById("libro").value;
  const cantidad = parseInt(document.getElementById("cantidad").value) || 1;
  const envio = document.querySelector("input[name='envio']:checked")?.value;
  const pais = document.getElementById("pais-envio").value;
  const descuento = document.getElementById("descuento").value.trim();

  const infoEnvio = document.getElementById("info-envio");
  let diasEntrega = 0;
  let costoEnvio = 0;

  if (envio === "Exprés") {
    diasEntrega = 7;
    costoEnvio = 10000;
  } else if (envio === "Estándar") {
    diasEntrega = 21;
    costoEnvio = 5000;
  }

  // Calcular fecha estimada
  if (diasEntrega > 0) {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + diasEntrega);
    const fechaEntrega = hoy.toLocaleDateString("es-CL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    infoEnvio.textContent = `📦 Fecha estimada de entrega: ${fechaEntrega}`;
  } else {
    infoEnvio.textContent = "";
  }

  if (index === "" || !librosDisponibles[index]) {
    document.getElementById("precio-final").textContent =
      "Total a pagar: $0 CLP";
    document.getElementById("precio-convertido").textContent = "";
    document.getElementById("descuento-aplicado").textContent = "";
    return;
  }

  const libro = librosDisponibles[index];
  let total = libro.precio * cantidad + costoEnvio;

  // Aplicar descuento
  let mensaje = "";
  if (descuento === "FANTASIA10") {
    total *= 0.9;
    mensaje = "✅ Descuento aplicado: 10%";
  } else if (descuento !== "") {
    mensaje = "❌ Código no válido";
  }
  document.getElementById("descuento-aplicado").textContent = mensaje;

  document.getElementById(
    "precio-final"
  ).textContent = `Total a pagar: $${Math.round(total).toLocaleString()} CLP`;

  // Conversión automática
  let convertido = "";
  if (pais === "UF" && indicadores.uf) {
    convertido = (total / indicadores.uf).toFixed(2) + " UF";
  } else if (pais === "UTM" && indicadores.utm) {
    convertido = (total / indicadores.utm).toFixed(2) + " UTM";
  } else if (pais === "EURO" && indicadores.euro) {
    convertido = "€" + (total / indicadores.euro).toFixed(2);
  }

  document.getElementById("precio-convertido").textContent = convertido;
}

// 🛒 Realizar compra
async function realizarCompra(e) {
  e.preventDefault();

  const indexLibro = document.getElementById("libro").value;
  const libro = librosDisponibles[indexLibro];
  const cantidad = parseInt(document.getElementById("cantidad").value);
  const envio = document.querySelector("input[name='envio']:checked")?.value;
  const descuento = document.getElementById("descuento").value.trim();
  const metodoPago = document.getElementById("pago").value;

  const nombre = document.getElementById("nombre").value.trim();
  const rut = document.getElementById("rut").value.trim();
  const email = document.getElementById("email").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const direccion = document.getElementById("direccion").value.trim();

  if (!libro || !envio || !metodoPago || isNaN(cantidad)) {
    alert("Por favor completa todos los campos.");
    return;
  }

  if (!validarRUT(rut)) {
    alert("RUT inválido");
    return;
  }

  if (!validarEmail(email)) {
    alert("Correo electrónico inválido.");
    return;
  }

  if (!validarTelefonoChileno(telefono)) {
    alert("El número de teléfono debe comenzar con +569 y tener 12 dígitos.");
    return;
  }

  let total = libro.precio * cantidad;
  if (envio === "Exprés") total += 10000;
  else if (envio === "Estándar") total += 5000;
  if (descuento === "FANTASIA10") total *= 0.9;

  const cliente = { nombre, rut, email, telefono, pedido_activo: true };
  let cliente_id = null;

  try {
    const resCliente = await fetch("http://localhost:5000/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cliente),
    });
    const dataCliente = await resCliente.json();
    cliente_id = dataCliente.inserted_id || null;
  } catch (error) {
    console.warn("No se pudo registrar el cliente:", error);
  }

  const pedido = {
    cliente_id,
    nombre,
    rut,
    email,
    telefono,
    direccion,
    productos: [
      {
        producto_id: libro._id,
        titulo: libro.titulo,
        cantidad,
        precio_unitario: libro.precio,
      },
    ],
    total_final: Math.round(total),
    estado_envio: "Pendiente",
    metodo_pago: metodoPago,
    fecha_pedido: new Date().toISOString(),
  };

  try {
    await fetch("http://localhost:5000/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pedido),
    });

    mostrarResumen(pedido);
    document.getElementById("form-compra").reset();
    document.getElementById("detalles-libro").style.display = "none";
    actualizarPrecioTotal();
  } catch (error) {
    console.error("Error al enviar el pedido:", error);
    alert("Hubo un problema al registrar tu pedido.");
  }
}

// 📋 Mostrar resumen
function mostrarResumen(pedido) {
  const resumen = document.getElementById("resumen");
  const lista = document.getElementById("resumen-lista");

  lista.innerHTML = `
    <li><strong>Cliente:</strong> ${pedido.nombre}</li>
    <li><strong>Libro:</strong> ${pedido.productos[0].titulo}</li>
    <li><strong>Cantidad:</strong> ${pedido.productos[0].cantidad}</li>
    <li><strong>Total:</strong> $${pedido.total_final.toLocaleString()}</li>
    <li><strong>Pago:</strong> ${pedido.metodo_pago}</li>
    <li><strong>Estado:</strong> ${pedido.estado_envio}</li>
  `;

  resumen.style.display = "block";
}

//Validaciones

function validarRUT(rut) {
  rut = rut.replace(/\.|-/g, "");
  if (rut.length < 8) return false;
  let cuerpo = rut.slice(0, -1);
  let dv = rut.slice(-1).toUpperCase();
  let suma = 0,
    multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  let dvr = 11 - (suma % 11);
  dvr = dvr === 11 ? "0" : dvr === 10 ? "K" : dvr.toString();
  return dvr === dv;
}

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validarTelefonoChileno(telefono) {
  return /^\+569\d{8}$/.test(telefono);
}

//CALCULAR EDAD

function calcularEdad() {
  const fecha = document.getElementById("fecha_nacimiento").value;
  if (!fecha) return;
  const nacimiento = new Date(fecha);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  if (
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() &&
      hoy.getDate() < nacimiento.getDate())
  ) {
    edad--;
  }
  document.getElementById("resultado-edad").textContent = `Edad: ${edad} años`;
}

//ENCRIPTAR NOMBRES
function encriptarNombre() {
  const nombre = document.getElementById("nombre").value;
  const cifrado = btoa(nombre);
  document.getElementById(
    "nombre-encriptado"
  ).textContent = `Nombre encriptado: ${cifrado}`;
}

//CARGAR MONEDAS API

async function cargarValoresMoneda() {
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
    ).textContent = `$${data.uf.valor.toLocaleString()}`;
    document.getElementById(
      "valor-utm"
    ).textContent = `$${data.utm.valor.toLocaleString()}`;
    document.getElementById(
      "valor-euro"
    ).textContent = `$${data.euro.valor.toLocaleString()}`;
  } catch (error) {
    console.error("Error cargando API:", error);
  }
}

//CONVERTIR MONEDAS MANUAL
function convertirMoneda() {
  const monto = parseFloat(document.getElementById("convertir-monto").value);
  const tipo = document.getElementById("convertir-moneda").value;
  if (!monto || !indicadores[tipo]) return;
  const resultado = (monto / indicadores[tipo]).toFixed(2);
  document.getElementById(
    "resultado-conversion"
  ).textContent = `${resultado} ${tipo.toUpperCase()}`;
}
