import { useState } from "react";
import { useRouter } from "next/router";

export default function ShopSignup() {
  const router = useRouter();
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

  // ✅ UPDATED: now connects to Stripe
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Shop Signup Data:", form);

    // 🔥 ONLY CHANGE — SAVE BEFORE STRIPE
    if (typeof window !== "undefined") {
      localStorage.setItem("pendingShop", JSON.stringify(form));
    }

    try {
      const res = await fetch("/api/shopstream-checkout", {
        method: "POST",
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url; // 🔥 redirect to Stripe
      } else {
        alert("No checkout URL returned");
      }
    } catch (err) {
      console.error(err);
      alert("Stripe failed");
    }

    // later:
    // send to Firebase
  };

  return (
    <div style={styles.container}>

      <div style={styles.back} onClick={() => router.back()}>
        ← Back
      </div>

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
