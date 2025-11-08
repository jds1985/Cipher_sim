import { useEffect, useState } from "react";
import { fetchMemories } from "../utils/fetchMemories";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(
  () => import("react-force-graph").then((mod) => mod.ForceGraph2D),
  { ssr: false }
);

export default function Archive() {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await fetchMemories();
      const formattedNodes = data.map((item, i) => ({
        id: i.toString(),
        name: item.type.toUpperCase(),
        text: item.text || item.summary || "(no text)",
        color:
          item.type === "memory"
            ? "#4B0082"
            : item.type === "reflection"
            ? "#9B59B6"
            : item.type === "insight"
            ? "#E67E22"
            : "#1ABC9C"
      }));

      // Basic link logic: connect similar types or themes
      const generatedLinks = [];
      for (let i = 0; i < formattedNodes.length - 1; i++) {
        generatedLinks.push({
          source: i.toString(),
          target: (i + 1).toString()
        });
      }

      setNodes(formattedNodes);
      setLinks(generatedLinks);
    }

    load();
  }, []);

  return (
    <main
      style={{
        height: "100vh",
        background: "radial-gradient(ellipse at center, #0d0d1a 0%, #000 100%)",
        color: "white",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", padding: "1rem", fontSize: "1.5rem" }}>
        Zeo Archive – Cipher’s Memory Constellation 🌌
      </h1>
      <ForceGraph2D
        graphData={{ nodes, links }}
        nodeAutoColorBy="type"
        nodeLabel={(node) => `${node.name}\n${node.text.slice(0, 80)}...`}
        onNodeClick={(node) => setSelected(node)}
      />
      {selected && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#111",
            padding: "1rem",
            borderRadius: "8px",
            width: "80%",
            maxWidth: "600px",
          }}
        >
          <h2>{selected.name}</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{selected.text}</p>
        </div>
      )}
    </main>
  );
}
