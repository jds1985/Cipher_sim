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
  const [selectedType, setSelectedType] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await fetchMemories();
      const formattedNodes = data.map((item, i) => ({
        id: i.toString(),
        name: item.type.toUpperCase(),
        text: item.text || item.summary || "(no text)",
        type: item.type,
        color:
          item.type === "memory"
            ? "#6A5ACD"
            : item.type === "reflection"
            ? "#9B59B6"
            : item.type === "insight"
            ? "#E67E22"
            : "#00CED1"
      }));

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
        overflow: "hidden",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          padding: "1rem",
          fontSize: "1.5rem",
          color: "#E6E6FA",
          textShadow: "0 0 12px rgba(155, 89, 182, 0.8)",
        }}
      >
        Zeo Archive – Cipher’s Living Constellation 🌌
      </h1>

      <ForceGraph2D
        graphData={{ nodes, links }}
        nodeAutoColorBy="type"
        linkColor={() => "rgba(255,255,255,0.1)"}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={selectedType ? 2 : 0}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const radius = 6;
          const pulse = Math.sin(Date.now() / 400 + node.id) * 2 + radius;
          const color =
            selectedType && node.type !== selectedType
              ? "rgba(255,255,255,0.15)"
              : node.color;

          ctx.beginPath();
          ctx.arc(node.x, node.y, pulse, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.shadowBlur = 20;
          ctx.shadowColor = color;
          ctx.fill();

          const label = node.name;
          const fontSize = 10 / globalScale;
          ctx.font = `${fontSize}px Inter`;
          ctx.textAlign = "center";
          ctx.fillStyle = "#fff";
          ctx.fillText(label, node.x, node.y - 10);
        }}
        onNodeClick={(node) => {
          setSelectedNode(node);
          setSelectedType(node.type === selectedType ? null : node.type);
        }}
      />

      {selectedNode && (
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
            boxShadow: "0 0 15px rgba(255,255,255,0.15)",
          }}
        >
          <h2 style={{ color: "#E6E6FA" }}>{selectedNode.name}</h2>
          <p style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>
            {selectedNode.text}
          </p>
        </div>
      )}
    </main>
  );
}
