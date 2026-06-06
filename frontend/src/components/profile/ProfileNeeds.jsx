import { colors, radius, shadow } from "../../styles/theme";
import { HiOutlineMapPin } from "react-icons/hi2";

export default function ProfileNeeds({ myNeeds, navigate, handleDeleteNeed }) {
  if (myNeeds.length === 0) {
    return (
      <div
        style={{
          background: colors.white,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.xl,
          boxShadow: shadow.soft,
          padding: "56px 24px",
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0, color: colors.textSoft, fontSize: 15 }}>
          No needs posted yet.{" "}
          <span
            onClick={() => navigate("/postneed")}
            style={{
              color: colors.primary,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Post one now
          </span>
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 24,
      }}
    >
      {myNeeds.map((need) => (
        <div
          key={need.id}
          style={{
            background: colors.white,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.xl,
            boxShadow: shadow.soft,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              minHeight: 220,
              background: "#eef4ec",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: colors.textSoft,
              fontWeight: 700,
            }}
          >
            Need list
          </div>

          <div style={{ padding: 20 }}>
            <h3
              style={{
                margin: "0 0 10px 0",
                fontSize: 22,
                fontWeight: 900,
                color: colors.text,
              }}
            >
              {need.title}
            </h3>

            <p
              style={{
                margin: "0 0 14px 0",
                fontSize: 14,
                color: colors.textSoft,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <HiOutlineMapPin size={16} />
              {need.location}
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 16,
              }}
            >
              {need.items.map((item, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: 12,
                    color: colors.textSoft,
                    background: "#f8fafc",
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  {item.name}: {item.brought}/{item.quantity}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => navigate(`/editneed/${need.id}`)}
                style={{
                  padding: "10px 16px",
                  borderRadius: radius.md,
                  border: "none",
                  background: "linear-gradient(135deg, #2f5d34 0%, #3d7443 100%)",
                  color: colors.white,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Edit
              </button>

              <button
                onClick={() => handleDeleteNeed(need.id)}
                style={{
                  padding: "10px 16px",
                  borderRadius: radius.md,
                  border: "1px solid #fecaca",
                  background: "#fff1f2",
                  color: "#b91c1c",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}