import { useEffect, useState } from "react";

export default function MemoryViewer() {
  const [nodes, setNodes] = useState([]);

  async function load() {
    const res = await fetch("/api/memory");
    const data = await res.json();
    setNodes(data.nodes || []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{
      padding: 20,
      background: "#0b0b12",
      minHeight: "100vh",
      color: "white",
      fontFamily: "monospace"
    }}>
      <h1>🧠 Cipher Memory Viewer</h1>
      <p>{nodes.length} nodes loaded</p>

      <button onClick={load} style={{
        padding: "10px 15px",
        marginBottom: 20,
        background: "#6c5ce7",
        border: "none",
        color: "white",
        borderRadius: 8
      }}>
        Refresh
      </button>

      <div>
        {nodes.map((n) => (
          <div key={n.id} style={{
            border: "1px solid #222",
            padding: 10,
            marginBottom: 10,
            borderRadius: 8,
            background: "#141422"
          }}>
            <div><b>ID:</b> {n.id}</div>
            <div><b>Type:</b> {n.type}</div>
            <div><b>Importance:</b> {n.importance}</div>
            <div><b>Weight:</b> {n.weight}</div>
            <div><b>Content:</b> {n.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
