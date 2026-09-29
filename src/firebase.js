// Import fungsi-fungsi inisialisasi dari SDK Firebase
import { initializeApp } from "firebase/app";
import { initializeFirestore, enableIndexedDbPersistence } from "firebase/firestore"; // Modul Database (Firestore)

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 1. Inisialisasi Aplikasi Firebase
const app = initializeApp(firebaseConfig);

// 2. Inisialisasi Layanan Database
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// 3. Aktifkan Offline Persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled
        // in one tab at a a time.
        console.warn('Persistence failed-precondition');
    } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
        console.warn('Persistence unimplemented');
    }
});

