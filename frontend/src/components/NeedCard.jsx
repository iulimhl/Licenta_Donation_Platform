import "./NeedCard.css";
import { useNavigate } from "react-router-dom";
import { colors, radius } from "../styles/theme";

export default function NeedCard({ need, onItemCheck, currentUserEmail, isOwner }) {
  const navigate = useNavigate();

  const items = need.items || [];

  const totalNeeded = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalBrought = items.reduce((sum, item) => sum + (item.brought || 0), 0);
  const progress = totalNeeded > 0 ? Math.round((totalBrought / totalNeeded) * 100) : 0;

  function handleContact() {
    if (!currentUserEmail) {
      navigate("/login");
      return;
    }
    // Trimitem needId în URL ca să știe pagina de Chat despre ce nevoie se discută
    navigate(`/chat/${need.organization_email}?needId=${need.id}`);
  }

  return (
    <div className="need-card" style={{ borderRadius: radius.lg }}>
      <div className="need-image-container">
        {need.image ? (
          <img src={need.image} alt={need.title} className="need-image" />
        ) : (
          <div className="need-placeholder" style={{ backgroundColor: colors.yellowLight }}></div>
        )}

        <span className="progress-badge" style={{ backgroundColor: colors.yellow, color: "#856404" }}>
            {progress}% done
        </span>
      </div>

      <div className="need-content">
        <h3 style={{ color: colors.text, margin: "0 0 4px 0" }}>{need.title}</h3>
        <p className="need-location" style={{ color: colors.muted }}>{need.location}</p>

        {need.description && (
          <p className="need-description">{need.description}</p>
        )}

        <div className="progress-bar-container" style={{ backgroundColor: colors.border }}>
          <div className="progress-bar" style={{ width: `${progress}%`, backgroundColor: colors.yellow }}></div>
        </div>

        <p className="need-progress-text">
          {totalBrought} of {totalNeeded} brought
        </p>

        <div className="items-list">
          {(need.items || []).map((item, idx) => {
            const isCompleted = item.brought >= item.quantity && item.quantity > 0;

            return (
              <div
                key={idx}
                className="item-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "8px",
                  opacity: !isOwner && isCompleted ? 0.7 : 1
                }}
              >
                {/* Checkbox pentru proprietar / Indicator bulină pentru restul lumii */}
                {isOwner ? (
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={(e) =>
                      onItemCheck(need.id, idx, e.target.checked ? item.quantity : 0)
                    }
                    className="item-checkbox"
                    style={{ cursor: "pointer" }}
                  />
                ) : (
                  <span style={{
                    color: isCompleted ? "#22c55e" : colors.blueDark,
                    fontWeight: "bold",
                    fontSize: "16px",
                    minWidth: "16px",
                    textAlign: "center"
                  }}>
                    {isCompleted ? "✓" : "•"}
                  </span>
                )}

                <span
                  className="item-name"
                  style={{
                    color: colors.text,
                    textDecoration: isCompleted ? "line-through" : "none",
                    opacity: isCompleted ? 0.5 : 1,
                    fontSize: "14px",
                    fontWeight: 500
                  }}
                >
                  {item.name}
                </span>

                <span className="item-quantity" style={{ color: colors.muted, marginLeft: "auto", fontSize: "14px" }}>
                  {item.brought || 0}/{item.quantity}
                </span>
              </div>
            );
          })}
        </div>

        {/* FOOTER: Diferențiem acțiunea în funcție de rol (Contact vs Edit list) */}
        <div className="need-footer" style={{ borderTop: `1px solid ${colors.border}`, marginTop: "15px", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="need-org" style={{ fontWeight: 600, fontSize: "13px", color: colors.muted }}>
            By: <span style={{ color: colors.text, fontWeight: 700 }}>{need.organization_name}</span>
          </span>

          {!isOwner ? (
            <button
              onClick={handleContact}
              className="need-contact-btn"
              style={{ backgroundColor: colors.blueDark, color: colors.white, padding: "8px 16px", borderRadius: radius.sm, border: "none", fontWeight: "700", cursor: "pointer" }}
            >
              Contact
            </button>
          ) : (
            <button
              onClick={() => navigate(`/editneed/${need.id}`)}
              className="need-edit-btn"
              style={{
                backgroundColor: colors.yellowLight,
                color: "#856404",
                border: `1px solid ${colors.yellow}`,
                padding: "8px 16px",
                borderRadius: radius.sm,
                fontWeight: "700",
                cursor: "pointer",
                fontSize: "13px"
              }}
            >
               Edit list
            </button>
          )}
        </div>
      </div>
    </div>
  );
}