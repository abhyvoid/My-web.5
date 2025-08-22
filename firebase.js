// firebase.js  (CDN, ES Modules — works on GitHub Pages)

// Firebase v10 CDN imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot,
  updateDoc, arrayUnion, arrayRemove, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// ✅ Your real Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBjSQoODv0AoPsExhsbLrYTyP90LOJX_9Y",
  authDomain: "my-web4o.firebaseapp.com",
  projectId: "my-web4o",
  storageBucket: "my-web4o.firebasestorage.app",
  messagingSenderId: "226593866449",
  appId: "1:226593866449:web:adbdf758ed4810d8d9fbf0"
};

// Init
const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();
const db       = getFirestore(app);
const storage  = getStorage(app);

// Re-exports
export {
  app, auth, provider, signInWithPopup, signOut, onAuthStateChanged,
  db, collection, addDoc, deleteDoc, doc, onSnapshot,
  updateDoc, arrayUnion, arrayRemove, query, orderBy, serverTimestamp,
  storage, storageRef, uploadBytes, getDownloadURL, deleteObject
};
