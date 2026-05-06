import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { response, data } = await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

      if (response.ok) {
        localStorage.setItem("userEmail", data.email);
        alert("Autentificare reușită!");
        navigate("/");
      } else {
        alert("Eroare: " + (data.detail || "Date incorecte"));
      }
    } catch (error) {
      alert("Serverul nu răspunde.");
    }
  };

  return (
    <div className="pattern-bg" style={{ minHeight: "100vh", padding: "40px 20px 20px 20px" }}>
      {/* Header with glassmorphism */}
      <div className="glass-container" style={{
        marginBottom: "24px",
        padding: "24px",
        textAlign: "center"
      }}>
        <h2 style={{
          margin: 0,
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          fontSize: "1.8rem",
          fontWeight: 700
        }}>
          IASIdoneaza
        </h2>
        <p style={{
          margin: "8px 0 0 0",
          color: "#64748b"
        }}>
          Welcome back! Ready to help others?
        </p>
      </div>

      <div style={{ maxWidth: 420, width: "100%", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: 28, color: "#1e293b", fontWeight: 700 }}>IASIdoneaza</h2>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
            color: "#fff",
            padding: "20px 24px",
            borderRadius: "16px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 22 }}>Welcome Back</h1>
          <p style={{ marginTop: 4, opacity: 0.9, fontSize: 13 }}>Login to your account</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#334155", fontSize: 13 }}>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="modern-input"
            />
          </div>

          <div className="form-group">
            <label className="modern-label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="modern-input"
            />
          </div>

          <button type="submit" style={buttonStyle}>Login</button>
        </form>

        <p style={{ marginTop: 14, color: "#64748b", textAlign: "center", fontSize: 13 }}>
          Don't have an account? <a href="/register" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 600 }}>Register</a>
        </p>
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 16,
  cursor: "pointer",
};
