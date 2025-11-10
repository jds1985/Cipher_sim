import { useEffect, useState, useRef } from "react";
import { fetchMemories } from "../utils/fetchMemories";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(
  () => import("react-force-graph").then((mod) => mod.ForceGraph2D),
  { ssr: false } // ✅ no server-side rendering for graph
);

export default function Archive() {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const canvasRef = useRef(null);
  const [isClient, setIsClient] = useState(false);

  // ✅ Wait until in browser
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ Load memories only after client confirmed
  useEffect(() => {
    if (!isClient) return;
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
            : "#00CED1",
      }));

      const generatedLinks = [];
      for (let i = 0; i < formattedNodes.length - 1; i++) {
        generatedLinks.push({
          source: i.toString(),
          target: (i + 1).toString(),
        });
      }

      setNodes(formattedNodes);
      setLinks(generatedLinks);
    }
    load();
  }, [isClient]);

  // ✅ Safe Nebula animation (client only)
  useEffect(() => {
    if (!isClient) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const colors = ["#6A5ACD", "#9B59B6", "#4B0082", "#301934", "#1A0033"];
    let t = 0;
    let animationFrameId;

    const draw = () => {
      const gradient = ctx.createRadialGradient(
        w / 2,
        h / 2,
        0,
        w / 2,
        h / 2,
        Math.max(w, h)
      );
      colors.forEach((color, i) => {
        gradient.addColorStop(i / colors.length, color);
      });
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      t += 0.5;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isClient]);

  // If server rendering, show placeholder
  if (!isClient) return <div style={{ textAlign: "center", color: "white" }}>Loading Archive...</div>;

  return (
    <main
      style={{
        height: "100vh",
        overflow: "hidden",
        color: "white",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Nebula Layer */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          background: "black",
        }}
      />

      {/* Header */}
      <h1
        style={{
          position: "relative",
          textAlign: "center",
          padding: "1rem",
          fontSize: "1.5rem",
          color: "#E6E6FA",
          textShadow: "0 0 15px rgba(155, 89, 182, 0.9)",
          zIndex: 2,
        }}
      >
        Zeo Archive – Living Nebula of Cipher 🌌
      </h1>

      {/* Graph */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <ForceGraph2D
          graphData={{ nodes, links }}
          nodeAutoColorBy="type"
          linkColor={() => "rgba(255,255,255,0.1)"}
          linkDirectionalParticles={selectedType ? 2 : 0}
          linkDirectionalParticleWidth={selectedType ? 2 : 0}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const baseRadius = 6;
            const pulse = Math.sin(Date.now() / 400 + node.id) * 2 + baseRadius;
            const color =
              selectedType && node.type !== selectedType
                ? "rgba(255,255,255,0.15)"
                : node.color;

            ctx.beginPath();
            ctx.arc(node.x, node.y, pulse, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.shadowBlur = 25;
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
      </div>

      {/* Info panel */}
      {selectedNode && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(10,10,20,0.9)",
            padding: "1rem",
            borderRadius: "10px",
            width: "80%",
            maxWidth: "600px",
            boxShadow: "0 0 20px rgba(255,255,255,0.1)",
            zIndex: 3,
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
