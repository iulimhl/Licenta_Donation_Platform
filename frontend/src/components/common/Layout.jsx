import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import "../../App.css";
import { colors, radius, shadow } from "../../styles/theme";

const brandStyle = {
  fontSize: "42px",
  fontWeight: "900",
  letterSpacing: "-1.5px",
  textAlign: "center",
};

const contentStyle = {
  marginTop: 24,
  padding: 32,
  background: colors.card,
  borderRadius: radius.xl,
  boxShadow: shadow.card,
  color: colors.text,
};

const scrollButtonStyle = {
  position: "fixed",
  bottom: "100px",
  right: "24px",
  width: "50px",
  height: "50px",
  borderRadius: "50%",
  background: colors.blue,
  border: "none",
  boxShadow: "0 4px 20px rgba(143, 185, 255, 0.4)",
  cursor: "pointer",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: colors.white,
  fontSize: "20px",
};

export default function Layout({ children }) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <div className="app-container">
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <h1 style={brandStyle}>
            <span style={{ color: colors.blue }}>Ia</span>
            <span style={{ color: "#a0aec0" }}>și</span>
            <span style={{ color: colors.yellow }}>donează</span>
          </h1>
        </div>

        <Navbar />

        <div style={contentStyle}>{children}</div>
      </div>

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={scrollButtonStyle}
        >
          ↑
        </button>
      )}
    </div>
  );
}