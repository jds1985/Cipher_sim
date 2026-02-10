"use client";
import { useEffect, useState } from "react";

export default function MemoryViewer() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/memory?user=jim");
      const data = await res.json();
      setNodes(data.nodes || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>🧠 Cipher Memory Viewer</h1>
      <p>{loading ? "Loading..." : `${nodes.length} nodes loaded`}</p>

      <button onClick={load}>Refresh</button>

      <div style={{ marginTop: 20 }}>
        {nodes.map((n) => (
          <div
            key={n.id}
            style={{
              marginBottom: 12,
              padding: 10,
              border: "1px solid #333",
              borderRadius: 8,
            }}
          >
              <div><b>{n.type}</b> • {n.importance}</div>
              <div>{n.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
