import { useEffect, useState } from "react";

export default function ShopStream() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // 🔥 Replace later with Firestore
    setItems([
      {
        id: "1",
        title: "AI Resume Builder",
        description: "Creates perfect resumes instantly",
        price: "$5",
      },
      {
        id: "2",
        title: "Logo Generator",
        description: "Generate logos in seconds",
        price: "$3",
      },
      {
        id: "3",
        title: "Ad Copy AI",
        description: "High converting ads instantly",
        price: "$7",
      },
    ]);
  }, []);

  return (
    <div style={styles.container}>
      {items.map((item) => (
        <div key={item.id} style={styles.slide}>
          
          <div style={styles.overlay}>
            <h1>{item.title}</h1>
            <p>{item.description}</p>
            <div style={styles.price}>{item.price}</div>

            <button style={styles.button}>
              Use Tool ⚡
            </button>
          </div>

        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    overflowY: "scroll",
    scrollSnapType: "y mandatory",
  },
  slide: {
    height: "100vh",
    scrollSnapAlign: "start",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    background: "linear-gradient(180deg, #0a0a12, #16162a)",
  },
  overlay: {
    padding: 20,
    width: "100%",
    color: "white",
  },
  price: {
    color: "#00ffae",
    fontWeight: "bold",
    marginTop: 10,
  },
  button: {
    marginTop: 10,
    padding: "12px 20px",
    borderRadius: 10,
    border: "none",
    background: "#9d7bff",
    color: "white",
    fontWeight: "bold",
  },
};
