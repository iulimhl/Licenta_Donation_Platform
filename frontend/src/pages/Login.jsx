import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api/api";
import { useTimedNotification } from "../hooks/useTimedNotification";
import { saveAuthSession } from "../utils/auth";
import "../styles/formPages.css";
import "../styles/pages/Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { notification, showNotification } = useTimedNotification();

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { response, data } = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        saveAuthSession(data);
        showNotification("Login successful! Redirecting...");
        setTimeout(() => navigate("/"), 1500);
      } else {
        showNotification(data.detail || "Invalid email or password", "error");
      }
    } catch {
      showNotification("Server is not responding.", "error");
    }
  };

  return (
    <div className="form-page centered login-page">
      {notification.message && (
        <div className={`login-notification ${notification.type === "error" ? "error" : "success"}`}>
          {notification.message}
        </div>
      )}

      <div className="login-card">
        <div className="login-card-inner">
          <div className="login-heading">
            <h2>Welcome back</h2>
            <p>Sign in to continue managing donations and community support.</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                placeholder="ana@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input login-input"
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input login-input"
              />
            </div>

            <button type="submit" className="form-button primary login-submit">
              Log in
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don&apos;t have an account? <Link to="/register">Register now</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
