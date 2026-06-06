import { colors, radius } from "../../styles/theme";

const headerBoxStyle = {
  marginBottom: 32,
  padding: 24,
  textAlign: "center",
  background: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.xl,
};

export default function ProfileHeader({ userEmail, userType }) {
  return (
    <div style={headerBoxStyle}>
      <h1
        style={{
          margin: 0,
          color: colors.blueDark,
          fontSize: "2.5rem",
          fontWeight: 800,
          letterSpacing: "-0.02em",
        }}
      >
        My Profile
      </h1>
      <p style={{ margin: "8px 0 0 0", color: colors.muted, fontSize: "1.1rem" }}>
        Manage your donations and needs
      </p>

      <div style={{ marginTop: 16, color: colors.muted, fontSize: 14, lineHeight: 1.6 }}>
        <div>
          <strong style={{ color: colors.text }}>Email:</strong> {userEmail}
        </div>
        <div style={{ marginTop: 6 }}>
          <strong style={{ color: colors.text }}>Account Type:</strong>{" "}
          <span style={{ color: colors.blueDark, fontWeight: 600 }}>
            {userType === "organization" ? "🏢 Organization" : "👤 Regular User"}
          </span>
        </div>
      </div>
    </div>
  );
}