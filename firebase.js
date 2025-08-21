// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, deleteDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Config (your own Firebase keys)
const firebaseConfig = {
  apiKey: "AIzaSyBjSQoODv0AoPsExhsbLrYTyP90LOJX_9Y",
  authDomain: "my-web4o.firebaseapp.com",
  projectId: "my-web4o",
  storageBucket: "my-web4o.appspot.com",
  messagingSenderId: "226593866449",
  appId: "1:226593866449:web:adbdf758ed4810d8d9fbf0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, signInWithEmailAndPassword, onAuthStateChanged, signOut, db, doc, setDoc, getDoc, onSnapshot, collection, deleteDoc, updateDoc, increment };
