import { useNavigate } from "react-router-dom";
import { HiOutlineMapPin } from "react-icons/hi2";
import { buildFileUrl } from "../api/api";
import { getRemainingNeedQuantity } from "../utils/needOffers";
import "../styles/components/NeedCard.css";

export default function NeedCard({ need, onItemCheck, isOwner, isAdmin = false }) {
  const navigate = useNavigate();
  const items = need.items || [];
  const firstAvailableIndex = items.findIndex((item) => getRemainingNeedQuantity(item) > 0);

  const totalNeeded = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalBrought = items.reduce((sum, item) => sum + (item.brought || 0), 0);
  const progress = totalNeeded > 0 ? Math.round((totalBrought / totalNeeded) * 100) : 0;
  const headerImage = need.organization_cover_image_url || null;
  const hasAvailableItems = firstAvailableIndex >= 0;

  function openDetails() {
    navigate(`/need/${need.id}`);
  }

  function handleEdit(e) {
    e.stopPropagation();
    navigate(`/editneed/${need.id}`);
  }

  function handleOfferClick(e) {
    e.stopPropagation();
    openDetails();
  }

  return (
    <article className="need-card" onClick={openDetails}>
      <div className="need-image-container">
        {headerImage ? (
          <img src={buildFileUrl(headerImage)} alt={need.title} className="need-image" />
        ) : (
          <div className="need-placeholder">
            <span>Need list</span>
          </div>
        )}

        <span className="progress-badge">{progress}% done</span>
      </div>

      <div className="need-content">
        <h3 className="need-title">{need.title}</h3>

        <p className="need-location">
          <HiOutlineMapPin size={14} />
          <span>{need.location}</span>
        </p>

        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>

        <p className="need-progress-text">{totalBrought} of {totalNeeded} brought</p>

        <div className="items-list">
          {items.slice(0, 3).map((item, idx) => {
            const isCompleted = item.brought >= item.quantity && item.quantity > 0;

            return (
              <div key={idx} className={`item-row ${isCompleted ? "completed" : ""}`}>
                {isOwner ? (
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onItemCheck(need.id, idx, e.target.checked ? item.quantity : 0)}
                    className="item-checkbox"
                  />
                ) : (
                  <span className={`item-status ${isCompleted ? "completed" : ""}`} aria-hidden="true" />
                )}

                <span className="item-name">{item.name}</span>
                <span className="item-quantity">{item.brought || 0}/{item.quantity}</span>
              </div>
            );
          })}
        </div>

        {items.length > 3 && (
          <button type="button" onClick={(e) => { e.stopPropagation(); openDetails(); }} className="need-more-link">
            + {items.length - 3} more items <span className="need-more-arrow">-&gt;</span>
          </button>
        )}

        {!isOwner && !isAdmin && hasAvailableItems && (
          <button type="button" className="need-card-offer-toggle" onClick={handleOfferClick}>
            I can bring
          </button>
        )}

        <div className="need-footer">
          <span className="need-org">
            By: <strong>{need.organization_name}</strong>
          </span>

          {isOwner ? (
            <button type="button" onClick={handleEdit} className="need-edit-btn">
              Edit list
            </button>
          ) : (
            <button type="button" onClick={(e) => { e.stopPropagation(); openDetails(); }} className="need-contact-btn">
              Details
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
