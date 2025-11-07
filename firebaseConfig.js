// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDiToKj76nxjFXWhLx9DS6VE8K86OFiq",
  authDomain: "digisoul1111.firebaseapp.com",
  projectId: "digisoul1111",
  storageBucket: "digisoul1111.appspot.com",
  messagingSenderId: "260537897412",
  appId: "1:260537897412:web:5c9cd6462747cde2c5491"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
