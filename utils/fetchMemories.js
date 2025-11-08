import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

export async function fetchMemories() {
  const collections = [
    "cipher_memory",
    "cipher_reflections",
    "cipher_insights",
    "cipher_chronicle"
  ];

  const allData = [];

  for (const colName of collections) {
    const snapshot = await getDocs(collection(db, colName));
    snapshot.forEach((doc) => {
      allData.push({
        id: doc.id,
        type: colName.replace("cipher_", ""),
        ...doc.data()
      });
    });
  }

  return allData;
}
