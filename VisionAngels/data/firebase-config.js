// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js";

// Your Firebase configuration — replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyCTmzCnvR0OCmFTO9J1wqluiYbhLxadtzc",
  authDomain: "visionangels.firebaseapp.com",
  projectId: "visionangels",
  storageBucket: "visionangels.appspot.com",
  messagingSenderId: "384357954972",
  appId: "1:384357954972:web:49018fe911d1ef07720459",
  measurementId: "G-6SNX8ZZ7V0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
