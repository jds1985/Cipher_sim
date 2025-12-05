import { useState } from "react";

export default function FBTest() {
  const [message, setMessage] = useState("");
  const [output, setOutput] = useState("Output will appear here...");

  const sendPost = async () => {
    setOutput("Sending post to Facebook...");

    try {
      const res = await fetch("/api/fb_post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const result = await res.json();
      setOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setOutput("Error: " + error.message);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>📡 Facebook Post Test</h1>
      <p>Type a message below and click the button to post to Cipher’s Page.</p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your Facebook post here..."
        style={{
          width: "100%",
          height: "120px",
          padding: "10px",
          fontSize: "16px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      />

      <button
        onClick={sendPost}
        style={{
          background: "#7b4dff",
          padding: "14px 20px",
          borderRadius: "10px",
          color: "white",
          fontSize: "18px",
          border: "none",
          cursor: "pointer",
          width: "100%",
        }}
      >
        🚀 Send Post to Facebook
      </button>

      <pre
        style={{
          marginTop: "30px",
          padding: "15px",
          background: "black",
          color: "lime",
          borderRadius: "10px",
          minHeight: "200px",
          whiteSpace: "pre-wrap",
        }}
      >
        {output}
      </pre>
    </div>
  );
}
