// firebaseConfig.js
// Initializes Firebase for Cipher's memory persistence layer

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDiToKj76nxjfXWhLiXgDS6VE8K86OFfiQ",
  authDomain: "digisoul1111.firebaseapp.com",
  projectId: "digisoul1111",
  storageBucket: "digisoul1111.appspot.com",
  messagingSenderId: "000000000000", // optional placeholder
  appId: "1:000000000000:web:0000000000000000" // optional placeholder
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore database
const db = getFirestore(app);

export { db };
