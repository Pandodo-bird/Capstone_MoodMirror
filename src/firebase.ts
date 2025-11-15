// src/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDOXUILJmxUSpuE2IlxX1Z96tBU4EsXQHw",
  authDomain: "moodmirror-final.firebaseapp.com",
  projectId: "moodmirror-final",
  storageBucket: "moodmirror-final.firebasestorage.app",
  messagingSenderId: "185637008834",
  appId: "1:185637008834:web:cae1752bf503df6687d25b",
  measurementId: "G-EVJZCW5QZC"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app); 