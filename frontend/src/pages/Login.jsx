import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api/api";
import { useTimedNotification } from "../hooks/useTimedNotification";
import { useLanguage } from "../language/useLanguage";
import { saveAuthSession } from "../utils/auth";
import "../styles/formPages.css";
import "../styles/pages/Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { notification, showNotification } = useTimedNotification();
  const { t } = useLanguage();

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
        showNotification(t("auth.loginSuccess"));
        setTimeout(() => navigate("/"), 1500);
      } else {
        showNotification(data.detail || t("auth.invalidLogin"), "error");
      }
    } catch {
      showNotification(t("auth.serverNotResponding"), "error");
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
            <h2>{t("auth.welcomeBack")}</h2>
            <p>{t("auth.loginSubtitle")}</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div>
              <label className="form-label">{t("auth.email")}</label>
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
              <label className="form-label">{t("auth.password")}</label>
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
              {t("auth.logIn")}
            </button>
          </form>

          <div className="login-footer">
            <p>
              {t("auth.noAccount")} <Link to="/register">{t("auth.registerNow")}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
