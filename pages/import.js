import { useEffect, useState } from "react";
import ImportHistoryPanel from "../components/ImportHistoryPanel";
import { auth } from "../lib/firebaseClient";

export default function ImportPage() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (u) setUserId(u.uid);
    });

    return () => unsub();
  }, []);

  if (!userId) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  return <ImportHistoryPanel userId={userId} />;
}
