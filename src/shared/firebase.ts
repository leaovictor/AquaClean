// src/shared/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Import getAuth

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDJWXAnskXhC2-0aVbdk6kSZ8y7zh2Q0ns",
  authDomain: "lavajato-5944c.firebaseapp.com",
  projectId: "lavajato-5944c",
  storageBucket: "lavajato-5944c.firebasestorage.app",
  messagingSenderId: "136391405566",
  appId: "1:136391405566:web:3277db47e3dc4670619aaf",
  measurementId: "G-ZHZ019XBV7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Export auth instance

export default app;
