import "./NeedCard.css";
import { useNavigate } from "react-router-dom";

export default function NeedCard({ need, onItemCheck, currentUserEmail, isOwner }) {
  const navigate = useNavigate();

  const totalNeeded = need.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalBrought = need.items.reduce((sum, item) => sum + item.brought, 0);
  const progress = Math.round((totalBrought / totalNeeded) * 100) || 0;

  function handleContact() {
    if (!currentUserEmail) {
      navigate("/login");
      return;
    }

    navigate(`/chat/${need.organization_email}`);
  }

  return (
    <div className="need-card">
      <div className="need-image-container">
        {need.image ? (
          <img src={need.image} alt={need.title} className="need-image" />
        ) : (
          <div className="need-placeholder"></div>
        )}

        <span className="progress-badge">{progress}% done</span>
      </div>

      <div className="need-content">
        <h3 className="need-title">{need.title}</h3>
        <p className="need-location">{need.location}</p>

        {need.description && (
          <p className="need-description">{need.description}</p>
        )}

        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>

        <p className="need-progress-text">
          {totalBrought} of {totalNeeded} brought
        </p>

        <div className="items-list">
          {need.items.map((item, idx) => (
            <div key={idx} className="item-row">
              <input
                type="checkbox"
                checked={item.brought > 0}
                onChange={(e) =>
                  onItemCheck(need.id, idx, e.target.checked ? item.quantity : 0)
                }
                className="item-checkbox"
              />
              <span className="item-name">{item.name}</span>
              <span className="item-quantity">{item.quantity}x</span>
            </div>
          ))}
        </div>

        <div className="need-footer">
          <span className="need-org">{need.organization_name || need.organization_email}</span>

          {!isOwner && (
            <button onClick={handleContact} className="need-contact-btn">
              Contact
            </button>
          )}
        </div>
      </div>
    </div>
  );
}