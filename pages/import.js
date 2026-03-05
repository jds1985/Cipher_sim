import ImportHistoryPanel from "../components/ImportHistoryPanel";
import { useEffect, useState } from "react";
import { auth } from "../lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function ImportPage() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUserId(u.uid);
      }
    });

    return () => unsub();
  }, []);

  if (!userId) {
    return (
      <div style={{ padding: 40 }}>
        Please log in to import history.
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}>
      <h1>Import Conversations</h1>

      <ImportHistoryPanel userId={userId} />
    </div>
  );
}
