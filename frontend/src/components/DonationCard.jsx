export default function DonationCard({ donation, onReserve }) {
  const isReserved = donation.status !== "available";

  return (
    <div
      style={{
        border: "1px solid #2a2a2a",
        borderRadius: 14,
        overflow: "hidden",
        background: "#1a1a1a",
        boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ position: "relative" }}>
        <img
          src={donation.image}
          alt={donation.title}
          style={{
            width: "100%",
            height: 220,
            objectFit: "cover",
            display: "block",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 12,
            border: "1px solid #444",
            background: isReserved ? "rgba(180, 60, 60, 0.9)" : "rgba(40, 150, 90, 0.9)",
            color: "#fff",
          }}
        >
          {isReserved ? "reserved" : "available"}
        </div>
      </div>

      <div style={{ padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>
              {donation.title}
            </div>
            <div style={{ fontSize: 12, color: "#bbb", marginTop: 4 }}>
              {donation.location}
            </div>
            <div style={{ fontSize: 12, color: "#bbb", marginTop: 4 }}>
              Category: <span style={{ color: "#fff" }}>{donation.category}</span>
            </div>
          </div>

          <button
            onClick={() => onReserve(donation.id)}
            disabled={isReserved}
            style={{
              height: 36,
              padding: "0 12px",
              borderRadius: 10,
              border: "1px solid #fff",
              background: isReserved ? "#666" : "#fff",
              color: isReserved ? "#ddd" : "#111",
              cursor: isReserved ? "not-allowed" : "pointer",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            Reserve
          </button>
        </div>
      </div>
    </div>
  );
}