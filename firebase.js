// ---- Firebase (v9 modular) ----
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {
  getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc,
  serverTimestamp, query, orderBy, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject, ref as refFromURL
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

// Your config (as you gave)
const firebaseConfig = {
  apiKey: "AIzaSyBjSQoODv0AoPsExhsbLrYTyP90LOJX_9Y",
  authDomain: "my-web4o.firebaseapp.com",
  projectId: "my-web4o",
  storageBucket: "my-web4o.firebasestorage.app",
  messagingSenderId: "226593866449",
  appId: "1:226593866449:web:adbdf758ed4810d8d9fbf0"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Re-exports so other files can import from one place
export {
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
  collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc,
  serverTimestamp, query, orderBy, arrayUnion, arrayRemove,
  ref, uploadBytes, getDownloadURL, deleteObject, refFromURL
};
