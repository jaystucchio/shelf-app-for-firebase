
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAGF1g0WX7BdhiWuPMShbdV1Kaj90rezxM",
  authDomain: "shelf-49e1a.firebaseapp.com",
  projectId: "shelf-49e1a",
  storageBucket: "shelf-49e1a.firebasestorage.app",
  messagingSenderId: "1056315036437",
  appId: "1:1056315036437:web:3a530c6b509ce1b102cf1c",
  measurementId: "G-G1B4ZNFFZP"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (typeof window !== 'undefined') {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

// @ts-ignore
export { app, auth, db, storage };
