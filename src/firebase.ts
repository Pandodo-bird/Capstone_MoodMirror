// src/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDZv_QWPAj0uLSg12xg7Z-QG7YcoC8WlfM",
  authDomain: "moodmirror-20843.firebaseapp.com",
  projectId: "moodmirror-20843",
  storageBucket: "moodmirror-20843.firebasestorage.app",
  messagingSenderId: "792067626602",
  appId: "1:792067626602:web:4d92d62e49a60467a91c13",
  measurementId: "G-0GLHYPQRBQ"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app); 