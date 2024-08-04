import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC8MAnZTLUBttWHlEIMl0u8gGI0R5oGnXU",
  authDomain: "gpt-engineer-dev.firebaseapp.com",
  projectId: "gpt-engineer-dev",
  storageBucket: "gpt-engineer-dev.appspot.com",
  messagingSenderId: "435422046193",
  appId: "1:435422046193:web:36e2c4049799e14110c650"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };
