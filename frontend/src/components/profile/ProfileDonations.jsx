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

export default function ProfileDonations({
  myDonations,
  handleStatusChange,
  handleDeleteDonation,
}) {
  if (myDonations.length === 0) {
    return (
      <p style={{ color: "#94a3b8", textAlign: "center", padding: "40px 20px" }}>
        No donations posted yet.{" "}
        <a href="/postdonation" style={{ color: colors.blueDark, textDecoration: "none" }}>
          Post one now
        </a>
      </p>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {myDonations.map((donation) => (
        <div key={donation.id} style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
              marginBottom: 12,
              gap: 12,
            }}
          >
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: "0 0 8px 0", color: colors.text }}>{donation.title}</h4>
              <p style={{ margin: 0, fontSize: 13, color: colors.muted }}>
                Location: {donation.location}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: colors.muted }}>
                Category: {donation.category}
              </p>
            </div>

            {donation.image && (
              <img
                src={donation.image}
                alt="donation"
                style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }}
              />
            )}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <select
              value={donation.status}
              onChange={(e) => handleStatusChange(donation.id, e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: radius.sm,
                border: `1px solid ${colors.border}`,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                background: colors.card,
              }}
            >
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="unavailable">No longer available</option>
            </select>

            <button
              onClick={() => handleDeleteDonation(donation.id)}
              style={{
                ...smallButtonStyle,
                background: colors.danger,
                color: colors.white,
              }}
            >
              Delete
            </button>
          </div>

          {donation.description && (
            <p style={{ margin: 0, fontSize: 13, color: colors.muted }}>
              {donation.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}