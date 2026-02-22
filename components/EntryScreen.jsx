// components/EntryScreen.jsx

export default function EntryScreen({ onEnter }) {
  return (
    <div className="entry-screen">
      <div className="entry-overlay" />

      <div className="entry-content">
        <h1>Cipher OS</h1>
        <p>Multi-Model Cognitive Engine</p>

        <button onClick={onEnter}>
          Enter Cipher
        </button>
      </div>
    </div>
  );
}
