// Import the functions you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Your web app's Firebase configuration (your keys)
const firebaseConfig = {
  apiKey: "AIzaSyBjSQoODv0AoPsExhsbLrYTyP90LOJX_9Y",
  authDomain: "my-web4o.firebaseapp.com",
  projectId: "my-web4o",
  storageBucket: "my-web4o.appspot.com",   // ✅ small fix: should be .appspot.com not .firebasestorage.app
  messagingSenderId: "226593866449",
  appId: "1:226593866449:web:adbdf758ed4810d8d9fbf0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export so you can use in other files
export { auth, signInWithEmailAndPassword, onAuthStateChanged, signOut, db, doc, getDoc, setDoc, onSnapshot };
