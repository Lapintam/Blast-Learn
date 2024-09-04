import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDnP17GChOmzOoTREJA776O0v8dLhb6qtM",
    authDomain: "chat-with-pdf-ff0a4.firebaseapp.com",
    projectId: "chat-with-pdf-ff0a4",
    storageBucket: "chat-with-pdf-ff0a4.appspot.com",
    messagingSenderId: "77282953183",
    appId: "1:77282953183:web:9662ac3c3065c6f615666a",
    measurementId: "G-Z2D4DBW23C"
  };

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  const db = getFirestore(app);

  const storage = getStorage(app);

  export { db, storage};