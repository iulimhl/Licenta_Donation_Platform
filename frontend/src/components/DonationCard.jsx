import "./DonationCard.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { colors, radius, shadow } from "../styles/theme";

const statusLabels = {
  available: "Available",
  reserved: "Reserved",
  unavailable: "No longer available",
};

export default function DonationCard({ donation, onReserve, currentUserEmail, isOwner }) {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const placeholderClass = `placeholder-${donation.category || "default"}`;

  function handleStatusChange(newStatus) {
    onReserve(donation.id, newStatus);
    setShowMenu(false);
  }

  function handleReserve() {
    const newStatus = donation.status === "available" ? "reserved" : "available";
    onReserve(donation.id, newStatus);
  }

  function handleContact() {
    if (!currentUserEmail) {
      navigate("/login");
      return;
    }
    navigate(`/chat/${donation.owner_email}?donationId=${donation.id}`);
  }

  return (
    <div className="donation-card" style={{ borderRadius: radius.lg, backgroundColor: colors.card, boxShadow: shadow.soft, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <div className="donation-image-container">
          {donation.image ? (
            <img src={donation.image} alt={donation.title} className="donation-image" />
          ) : (
            <div className={`donation-placeholder ${placeholderClass}`}></div>
          )}

          <span className={`status-badge status-${donation.status || "available"}`}>
            {statusLabels[donation.status] || "Available"}
          </span>
        </div>

        <div className="donation-content" style={{ padding: "16px" }}>
          <h3 className="donation-title" style={{ color: colors.text, margin: "0 0 4px 0" }}>{donation.title}</h3>
          <p className="donation-location" style={{ color: colors.muted, margin: "0 0 8px 0" }}>{donation.location}</p>
          <p className="donation-category" style={{ color: colors.muted, fontSize: "13px", margin: "0 0 8px 0" }}>
            Category: <span style={{ color: colors.blueDark, fontWeight: 600 }}>{donation.category}</span>
          </p>

          {donation.description && (
            <p className="donation-description" style={{ color: colors.text, fontSize: "13px", margin: "8px 0 0 0" }}>{donation.description}</p>
          )}
        </div>
      </div>

      <div className="donation-footer-new" style={{ borderTop: `1px solid ${colors.border}`, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="donation-owner" style={{ fontSize: "12px", color: colors.muted }}>
          By: <span style={{ color: colors.text, fontWeight: 700 }}>{donation.donor_name }</span>
        </div>

        {isOwner ? (
          <div style={{ display: "flex", gap: "8px", alignItems: "center", position: "relative" }}>
            <button
              onClick={() => navigate(`/editdonation/${donation.id}`)}
              style={{
                backgroundColor: colors.yellowLight, color: "#856404", border: `1px solid ${colors.yellow}`,
                padding: "6px 12px", borderRadius: radius.sm, fontWeight: "700", cursor: "pointer", fontSize: "12px",
                whiteSpace: "nowrap"
              }}
            >
              Edit
            </button>

            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  backgroundColor: colors.blueLight, color: colors.blueDark, border: `1px solid ${colors.blue}`,
                  padding: "6px 12px", borderRadius: radius.sm, fontWeight: "700", cursor: "pointer", fontSize: "12px"
                }}
              >
                Status ▾
              </button>

              {showMenu && (
                <div style={{
                  position: "absolute", bottom: "100%", right: 0, marginBottom: "8px",
                  backgroundColor: colors.card, border: `1px solid ${colors.border}`,
                  borderRadius: radius.md, boxShadow: shadow.card, padding: "6px",
                  display: "grid", gap: "4px", zIndex: 100, minWidth: "150px"
                }}>
                  {Object.keys(statusLabels).map((key) => (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(key)}
                      style={{
                        background: donation.status === key ? colors.blueLight : "transparent",
                        color: donation.status === key ? colors.blueDark : colors.text,
                        border: "none", padding: "8px 12px", borderRadius: radius.sm,
                        textAlign: "left", fontSize: "13px", fontWeight: donation.status === key ? "700" : "500",
                        cursor: "pointer", width: "100%", display: "block", boxSizing: "border-box"
                      }}
                    >
                      {statusLabels[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button
              onClick={handleReserve}
              disabled={donation.status === "unavailable"}
              style={{
                padding: "6px 12px", fontSize: "12px", borderRadius: radius.sm, border: "none", fontWeight: "700", cursor: "pointer",
                backgroundColor: donation.status === "reserved" ? colors.yellow : colors.blueLight,
                color: donation.status === "reserved" ? "#856404" : colors.blueDark,
                opacity: (donation.status === "unavailable") ? 0.5 : 1,
                whiteSpace: "nowrap" // <-- REPARAT: Textul nu se mai rupe pe 2 rânduri
              }}
            >
              {/* REPARAT: Text scurtat inteligent pentru a preveni colapsul pe ecrane înguste */}
              {donation.status === "reserved" ? "Cancel" : "Reserve"}
            </button>

            <button
              onClick={handleContact}
              style={{
                backgroundColor: colors.blueDark, color: colors.white, padding: "6px 12px", fontSize: "12px",
                borderRadius: radius.sm, border: "none", fontWeight: "700", cursor: "pointer",
                whiteSpace: "nowrap" // <-- REPARAT
              }}
            >
              Contact
            </button>
          </div>
        )}
      </div>
    </div>
  );
}