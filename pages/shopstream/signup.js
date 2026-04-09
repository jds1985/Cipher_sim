import { useState } from "react";

export default function ShopSignup() {
  const [form, setForm] = useState({
    shopName: "",
    ownerName: "",
    location: "",
    product: "",
    price: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Shop Signup Data:", form);

    alert("🔥 You're almost live! Next step: payment + going live");

    // later:
    // send to Firebase
    // redirect to Stripe
  };

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>Start Selling on ShopStream</h1>

      <form onSubmit={handleSubmit} style={styles.form}>

        <input
          name="shopName"
          placeholder="Shop Name"
          value={form.shopName}
          onChange={handleChange}
          style={styles.input}
          required
        />

        <input
          name="ownerName"
          placeholder="Your Name"
          value={form.ownerName}
          onChange={handleChange}
          style={styles.input}
          required
        />

        <input
          name="location"
          placeholder="City / State"
          value={form.location}
          onChange={handleChange}
          style={styles.input}
          required
        />

        <input
          name="product"
          placeholder="What are you selling?"
          value={form.product}
          onChange={handleChange}
          style={styles.input}
          required
        />

        <input
          name="price"
          placeholder="Price (example: 9.99)"
          value={form.price}
          onChange={handleChange}
          style={styles.input}
          required
        />

        <button type="submit" style={styles.button}>
          Continue →
        </button>

      </form>

    </div>
  );
}

/* 🎨 STYLES */
const styles = {
  container: {
    minHeight: "100vh",
    background: "#0a0a12",
    color: "white",
    padding: "30px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  title: {
    textAlign: "center",
    marginBottom: "30px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    maxWidth: "400px",
    margin: "0 auto",
  },

  input: {
    padding: "15px",
    borderRadius: "10px",
    border: "none",
    background: "#1a1a2e",
    color: "white",
  },

  button: {
    marginTop: "10px",
    padding: "15px",
    borderRadius: "25px",
    border: "none",
    background: "linear-gradient(135deg, #00ffcc, #00c3ff)",
    color: "black",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
