export default function EntryScreen({ onEnter, loading }) {
  return (
    <div className={`entry-screen ${loading ? "loading" : ""}`}>
      <div className="entry-overlay" />

      <div className="entry-content">
        <h1>Cipher OS</h1>
        <p>Multi-Model Cognitive Engine</p>

        {!loading ? (
          <button onClick={onEnter}>Enter Cipher</button>
        ) : (
          <div className="entry-loader">
            <div className="loader-ring" />
            <div className="loader-text">Initializing...</div>
          </div>
        )}
      </div>
    </div>
  );
}
