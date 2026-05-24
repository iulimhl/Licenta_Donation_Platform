import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api/api";
import { colors, radius, shadow } from "../styles/theme"; // Importăm tema ta

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notification, setNotification] = useState({ message: "", type: "" });

  const navigate = useNavigate();

  const showNotification = (msg, type = "success") => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { response, data } = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        localStorage.setItem("userEmail", data.email);
        localStorage.setItem("userType", data.user_type);
        showNotification("Login successful! Redirecting...");
        setTimeout(() => navigate("/"), 1500);
      } else {
        showNotification(data.detail || "Invalid email or password", "error");
      }
    } catch (error) {
      showNotification("Server is not responding.", "error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "40px 20px", backgroundColor: colors.bg, position: "relative" }}>

      {/* Notificare Toast - Stilul nou */}
      {notification.message && (
        <div style={{
          position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)", zIndex: 9999,
          padding: "14px 28px", borderRadius: radius.lg,
          background: notification.type === "error" ? colors.danger : colors.blueDark,
          color: colors.white, fontWeight: "600", boxShadow: shadow.card,
          border: `1px solid ${colors.border}`, backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", gap: "10px", transition: "all 0.3s"
        }}>
          {notification.type === "error" ? "✕" : "✓"} {notification.message}
        </div>
      )}

      <div style={{
        maxWidth: 420, margin: "0 auto", padding: "40px",
        backgroundColor: colors.card, borderRadius: radius.xl,
        boxShadow: shadow.card, border: `1px solid ${colors.border}`
      }}>

        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2 style={{ margin: 0, fontSize: 24, color: colors.text, fontWeight: 700, letterSpacing: "-0.5px" }}>
            Welcome back!
          </h2>
          <p style={{ color: colors.muted, marginTop: "6px", fontSize: 15 }}>Login to your account</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "grid", gap: 20 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600, color: colors.text }}>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%", padding: "14px", borderRadius: radius.md, border: `2px solid ${colors.border}`,
                backgroundColor: colors.bg, color: colors.text, outline: "none", boxSizing: "border-box"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600, color: colors.text }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%", padding: "14px", borderRadius: radius.md, border: `2px solid ${colors.border}`,
                backgroundColor: colors.bg, color: colors.text, outline: "none", boxSizing: "border-box"
              }}
            />
          </div>

          <button type="submit" style={{
            marginTop: "10px", padding: "16px", backgroundColor: colors.blueDark,
            color: colors.white, border: "none", borderRadius: radius.md,
            fontWeight: "800", fontSize: "16px", cursor: "pointer", boxShadow: shadow.soft,
            transition: "transform 0.1s"
          }}
          onMouseDown={(e) => e.target.style.transform = "scale(0.98)"}
          onMouseUp={(e) => e.target.style.transform = "scale(1)"}
          >
            Log in
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: colors.muted }}>
          Don't have an account? <Link to="/register" style={{ color: colors.blueDark, fontWeight: 700, textDecoration: "none" }}>Register</Link>
        </p>
      </div>
    </div>
  );
}