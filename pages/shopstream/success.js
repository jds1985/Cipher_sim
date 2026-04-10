import { useRouter } from "next/router";

export default function Success() {
  const router = useRouter();

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔥 You're Live!</h1>

      <p style={styles.text}>
        Your shop is now active on ShopStream.
      </p>

      <button
        style={styles.button}
        onClick={() => router.push("/shopstream")}
      >
        Go to Feed →
      </button>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    background: "#0a0a12",
    color: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: "20px",
  },
  title: {
    fontSize: "28px",
    marginBottom: "15px",
  },
  text: {
    opacity: 0.7,
    marginBottom: "20px",
  },
  button: {
    padding: "15px 25px",
    borderRadius: "25px",
    border: "none",
    background: "#00ffcc",
    color: "black",
    fontWeight: "bold",
  },
};
