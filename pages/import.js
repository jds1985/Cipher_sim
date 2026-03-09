import ImportHistoryPanel from "../components/ImportHistoryPanel";
import { useEffect, useState } from "react";
import { auth } from "../lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function ImportPage() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUserId(u.uid);
    });
    return () => unsub();
  }, []);

  if (!userId) {
    return (
      <div className="import-wrap">
        <div className="import-card">
          <h1>Authentication Required</h1>
          <p>Please log in to import your conversation history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="import-wrap">
      <div className="import-card">
        <h1>Import Conversations</h1>
        <ImportHistoryPanel userId={userId} />
      </div>
    </div>
  );
}
