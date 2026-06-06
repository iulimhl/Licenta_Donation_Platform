import "../styles/components/NeedCard.css";
import { useNavigate } from "react-router-dom";
import { colors, radius, shadow } from "../styles/theme";
import { HiOutlineMapPin } from "react-icons/hi2";
import { buildFileUrl } from "../api/api";

export default function NeedCard({ need, onItemCheck, currentUserEmail, isOwner }) {
  const navigate = useNavigate();

  const items = need.items || [];

  const totalNeeded = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalBrought = items.reduce((sum, item) => sum + (item.brought || 0), 0);
  const progress = totalNeeded > 0 ? Math.round((totalBrought / totalNeeded) * 100) : 0;
  const headerImage = need.organization_cover_image_url || null;

  function handleContact(e) {
    e.stopPropagation();

    if (!currentUserEmail) {
      navigate("/login");
      return;
    }

    navigate(`/chat/${encodeURIComponent(need.organization_email)}?needId=${need.id}`);
  }

  function handleEdit(e) {
    e.stopPropagation();
    navigate(`/editneed/${need.id}`);
  }

  function handleGoToDetails(e) {
    e.stopPropagation();
    navigate(`/need/${need.id}`);
  }

  return (
    <div
      className="need-card"
      onClick={() => navigate(`/need/${need.id}`)}
      style={{
        borderRadius: radius.lg,
        border: `1px solid ${colors.border}`,
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: shadow.soft,
        cursor: "pointer",
      }}
    >
      <div className="need-image-container">
        {headerImage ? (
          <img src={buildFileUrl(headerImage)} alt={need.title} className="need-image" />
        ) : (
          <div className="need-placeholder" style={{ backgroundColor: "#eef4ec" }}>
            <span style={{ color: colors.textSoft, fontSize: "12px", fontWeight: 600 }}>
              Need list
            </span>
          </div>
        )}

        <span
          className="progress-badge"
          style={{
            backgroundColor: "#f3f7f2",
            color: colors.primaryDark,
            border: `1px solid ${colors.border}`,
          }}
        >
          {progress}% done
        </span>
      </div>

      <div className="need-content">
        <h3
          className="need-title"
          style={{ color: colors.text, margin: "0 0 6px 0", fontSize: "16px", fontWeight: 700 }}
        >
          {need.title}
        </h3>

        <p
          className="need-location"
          style={{
            color: colors.textSoft,
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginBottom: "10px",
          }}
        >
          <HiOutlineMapPin size={14} />
          <span>{need.location}</span>
        </p>

        <div className="progress-bar-container" style={{ backgroundColor: "#e5ebe3" }}>
          <div
            className="progress-bar"
            style={{
              width: `${progress}%`,
              backgroundColor: colors.primary,
            }}
          ></div>
        </div>

        <p className="need-progress-text" style={{ marginBottom: "10px" }}>
          {totalBrought} of {totalNeeded} brought
        </p>

        <div className="items-list">
  {items.slice(0, 3).map((item, idx) => {
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
          opacity: !isOwner && isCompleted ? 0.7 : 1,
        }}
      >
        {isOwner ? (
          <input
            type="checkbox"
            checked={isCompleted}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              onItemCheck(need.id, idx, e.target.checked ? item.quantity : 0)
            }
            className="item-checkbox"
            style={{ cursor: "pointer" }}
          />
        ) : (
          <span
            style={{
              color: isCompleted ? colors.primaryDark : colors.primary,
              fontWeight: "bold",
              fontSize: "16px",
              minWidth: "16px",
              textAlign: "center",
            }}
          >
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
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.name}
        </span>

        <span
          className="item-quantity"
          style={{
            color: colors.textSoft,
            marginLeft: "auto",
            fontSize: "13px",
          }}
        >
          {item.brought || 0}/{item.quantity}
        </span>
      </div>
    );
  })}
</div>

{items.length > 3 && (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      navigate(`/need/${need.id}`);
    }}
    className="need-more-link"
    style={{
      textAlign: "right",
      width: "100%",
      display: "block",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      color: colors.primaryDark,
      fontWeight: "600",
      padding: "4px 0",
      fontSize: "13px"
    }}
  >
    + {items.length - 3} more items <span className="need-more-arrow">→</span>
  </button>
)}


        <div
          className="need-footer"
          style={{
            borderTop: `1px solid ${colors.border}`,
            marginTop: "14px",
            paddingTop: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span
            className="need-org"
            style={{
              fontWeight: 600,
              fontSize: "13px",
              color: colors.textSoft,
            }}
          >
            By: <span style={{ color: colors.text, fontWeight: 700 }}>{need.organization_name}</span>
          </span>

          {!isOwner ? (
            <button
              onClick={handleContact}
              className="need-contact-btn"
              style={{
                backgroundColor: colors.primary,
                color: colors.white,
                padding: "8px 14px",
                borderRadius: radius.sm,
                border: "none",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Contact
            </button>
          ) : (
            <button
              onClick={handleEdit}
              className="need-edit-btn"
              style={{
                backgroundColor: "#f3f7f2",
                color: colors.primaryDark,
                border: `1px solid ${colors.border}`,
                padding: "8px 14px",
                borderRadius: radius.sm,
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "13px",
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
