// components/EntryScreen.jsx

export default function EntryScreen({ onEnter }) {
  return (
    <div className="entry-screen">
      <div className="overlay" />

      <div className="content">
        <h1>Cipher OS</h1>
        <p>Multi-Model Cognitive Engine</p>

        <button onClick={onEnter}>
          Enter Cipher
        </button>
      </div>
    </div>
  );
}
