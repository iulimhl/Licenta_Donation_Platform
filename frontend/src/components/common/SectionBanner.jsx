import { radius } from "../../styles/theme";

export default function SectionBanner({ title, subtitle, background, color }) {
  return (
    <div
      style={{
        background,
        color,
        padding: "28px 32px",
        borderRadius: radius.lg,
        marginBottom: "28px",
      }}
    >
      <h1 style={{ margin: 0, fontSize: 26 }}>{title}</h1>
      <p style={{ marginTop: 8, opacity: 0.9 }}>{subtitle}</p>
    </div>
  );
}