import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_KEY,
  authDomain: "software-dml-testing.firebaseapp.com",
  projectId: "software-dml-testing",
  storageBucket: "software-dml-testing.firebasestorage.app",
  messagingSenderId: "667839627107",
  appId: "1:667839627107:web:7f17e5c26003230018dd56",
  measurementId: "G-FFBPWBW6MV"
};

// Inicializa la app de Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Firestore con persistencia
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});


// Inicializa Auth
const auth = getAuth(app);

// Exporta `db` y `auth` después de la inicializacióna
export { db, auth };
