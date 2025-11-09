// src/shared/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Import getAuth
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBSijOdKJP2eD2QwAOqy5rV86EeGXx3QKE",
  authDomain: "autoolinda-5199e.firebaseapp.com",
  projectId: "autoolinda-5199e",
  storageBucket: "autoolinda-5199e.firebasestorage.app",
  messagingSenderId: "992114921273",
  appId: "1:992114921273:web:0b81f9a88b2e14610de2e8",
  measurementId: "G-0J9B805MDR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Export auth instance
export const db = getFirestore(app); // Export firestore instance

export default app;
