import { useState } from "react";
import { runNode } from "../lib/runNode";

export default function NodeRunner({ node }) {
  const [input, setInput] = useState({});
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => {
    setInput(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRun = async () => {
    setLoading(true);
    const result = await runNode(node, input);
    setOutput(result);
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2>{node.name}</h2>
      <p>{node.description}</p>

      {/* 🔥 Dynamic Inputs */}
      {Object.keys(node.inputSchema || {}).map((key) => (
        <input
          key={key}
          placeholder={key}
          onChange={(e) => handleChange(key, e.target.value)}
          style={styles.input}
        />
      ))}

      <button onClick={handleRun} style={styles.button}>
        {loading ? "Running..." : "Run"}
      </button>

      {/* 🔥 Output */}
      {output && (
        <pre style={styles.output}>
          {JSON.stringify(output, null, 2)}
        </pre>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    background: "#111",
    color: "white",
  },
  input: {
    display: "block",
    marginBottom: "10px",
    padding: "10px",
    width: "100%",
  },
  button: {
    padding: "10px",
    background: "#00ffcc",
    border: "none",
    cursor: "pointer",
  },
  output: {
    marginTop: "20px",
    background: "#000",
    padding: "10px",
  }
};
