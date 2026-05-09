import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAGF1g0WX7BdhiWuPMShbdV1Kaj90rezxM",
  authDomain: "shelf-49e1a.firebaseapp.com",
  projectId: "shelf-49e1a",
  storageBucket: "shelf-49e1a.firebasestorage.app",
  messagingSenderId: "1056315036437",
  appId: "1:1056315036437:web:3a530c6b509ce1b102cf1c",
  measurementId: "G-G1B4ZNFFZP"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
