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
    <>
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
      </div>

      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: 26, color: colors.text }}>My Profile</h2>
        <p style={{ margin: 0, fontSize: 14, color: colors.muted }}>
          Email: <strong>{userEmail}</strong>
        </p>
        <p style={{ margin: "8px 0 0 0", fontSize: 14, color: colors.muted }}>
          Type: <strong>{userType === "organization" ? "Organization" : "Regular User"}</strong>
        </p>
      </div>
    </>
  );
}