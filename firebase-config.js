import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDQJ6-w0_ImxptJ3hzb8fFh7BSR0xt4JB8",
  authDomain: "bemontherock-registration-form.firebaseapp.com",
  projectId: "bemontherock-registration-form",
  storageBucket: "bemontherock-registration-form.firebasestorage.app",
  messagingSenderId: "550906923157",
  appId: "1:550906923157:web:b8852e078955760b4af39c",
  measurementId: "G-4ZC5243E1W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the database and auth so you can use them in main.js and admin.js
export const db = getFirestore(app);
export const auth = getAuth(app);