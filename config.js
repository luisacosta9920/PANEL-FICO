// 🔗 Importación de los módulos de Firebase desde el CDN oficial
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// 🔐 Configuración de tu proyecto Firebase (tiemporealusa)
const firebaseConfig = {
  apiKey: "AIzaSyDehhakBc2VoD1IJYaJwTHZyjNf_G7kR8o",
  authDomain: "tiemporealusa.firebaseapp.com",
  projectId: "tiemporealusa",
  storageBucket: "tiemporealusa.appspot.com",
  messagingSenderId: "866605290585",
  appId: "1:866605290585:web:72ba19242b11b9ca0f4d48"
};

// 🚀 Inicializa la app de Firebase
const app = initializeApp(firebaseConfig);

// 🗄️ Inicializa la base de datos en tiempo real
const db = getDatabase(app);

// 📤 Exporta los módulos para usar en otros archivos (por ejemplo, panel.js, gmail.html, etc.)
export {
  db,       // Referencia a la base de datos
  ref,      // Para apuntar a rutas en Firebase
  onValue,  // Para escuchar cambios en tiempo real
  update    // Para actualizar valores en la base de datos
};
