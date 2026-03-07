import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("Please complete all fields.");
      return;
    }

    const demoUser = {
      name: email.split("@")[0],
      email,
    };

    onLogin(demoUser);
    navigate("/");
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle}>Login</button>
      </form>

      <p style={{ marginTop: 14, color: "#aaa" }}>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #333",
  background: "#111",
  color: "#fff",
};

const buttonStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #fff",
  background: "#fff",
  color: "#111",
  fontWeight: 700,
  cursor: "pointer",
};