import { colors, radius } from "../../styles/theme";

const cardStyle = {
  padding: 16,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  background: colors.card,
};

const smallButtonStyle = {
  padding: "8px 16px",
  border: "none",
  borderRadius: radius.sm,
  fontWeight: 600,
  cursor: "pointer",
};

export default function ProfileNeeds({ myNeeds, navigate, handleDeleteNeed }) {
  if (myNeeds.length === 0) {
    return (
      <p style={{ color: "#94a3b8", textAlign: "center", padding: "40px 20px" }}>
        No needs posted yet.{" "}
        <a
          href="/postneed"
          style={{ color: colors.blueDark, textDecoration: "none", fontWeight: 600 }}
        >
          Post one now
        </a>
      </p>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {myNeeds.map((need) => (
        <div key={need.id} style={cardStyle}>
          <h4 style={{ margin: "0 0 6px 0", fontSize: 15, color: colors.text }}>
            {need.title}
          </h4>

          <p style={{ margin: "0 0 10px 0", fontSize: 12, color: colors.muted }}>
            <strong>Location:</strong> {need.location}
          </p>

          <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {need.items.map((item, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: 11,
                  color: colors.muted,
                  background: "#f1f5f9",
                  padding: "4px 8px",
                  borderRadius: 5,
                }}
              >
                {item.name}: {item.brought}/{item.quantity}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => navigate(`/editneed/${need.id}`)}
              style={{
                ...smallButtonStyle,
                background: colors.blueDark,
                color: colors.white,
              }}
            >
              Edit
            </button>

            <button
              onClick={() => handleDeleteNeed(need.id)}
              style={{
                ...smallButtonStyle,
                background: colors.danger,
                color: colors.white,
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}