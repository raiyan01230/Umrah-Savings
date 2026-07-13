import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCja1yVDCqpTLnKbO5VEm6cbucip_fGUHQ",
  authDomain: "flutter-ai-playground-d27b6.firebaseapp.com",
  databaseURL: "https://flutter-ai-playground-d27b6-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "flutter-ai-playground-d27b6",
  storageBucket: "flutter-ai-playground-d27b6.firebasestorage.app",
  messagingSenderId: "363880437111",
  appId: "1:363880437111:web:6a1b5f3339ee5f94307d72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Auth
const auth = getAuth(app);

export { app, db, auth };
