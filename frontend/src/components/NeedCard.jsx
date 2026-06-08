import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineMapPin } from "react-icons/hi2";
import { apiFetch, buildFileUrl } from "../api/api";
import "../styles/components/NeedCard.css";

export default function NeedCard({ need, onItemCheck, currentUserEmail, isOwner, isAdmin = false }) {
  const navigate = useNavigate();
  const items = need.items || [];
  const firstAvailableIndex = items.findIndex((item) => getRemainingQuantity(item) > 0);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(firstAvailableIndex >= 0 ? firstAvailableIndex : 0);
  const [offerAmount, setOfferAmount] = useState(1);
  const [sendingOffer, setSendingOffer] = useState(false);

  const totalNeeded = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalBrought = items.reduce((sum, item) => sum + (item.brought || 0), 0);
  const progress = totalNeeded > 0 ? Math.round((totalBrought / totalNeeded) * 100) : 0;
  const headerImage = need.organization_cover_image_url || null;
  const hasAvailableItems = firstAvailableIndex >= 0;

  function getRemainingQuantity(item) {
    return Math.max((item?.quantity || 0) - (item?.brought || 0), 0);
  }

  function openDetails() {
    navigate(`/need/${need.id}`);
  }

  function handleEdit(e) {
    e.stopPropagation();
    navigate(`/editneed/${need.id}`);
  }

  function handleToggleOffer(e) {
    e.stopPropagation();

    if (!currentUserEmail) {
      navigate("/login");
      return;
    }

    if (firstAvailableIndex >= 0 && getRemainingQuantity(items[selectedItemIndex]) <= 0) {
      setSelectedItemIndex(firstAvailableIndex);
      setOfferAmount(1);
    }

    setShowOfferForm((prev) => !prev);
  }

  function handleSelectedItemChange(value) {
    const nextIndex = Number(value);
    setSelectedItemIndex(nextIndex);
    setOfferAmount(1);
  }

  function handleAmountChange(value) {
    const remaining = getRemainingQuantity(items[selectedItemIndex]);
    const nextAmount = Math.max(1, Math.min(Number(value) || 1, remaining || 1));
    setOfferAmount(nextAmount);
  }

  async function handleSendOffer(e) {
    e.stopPropagation();

    if (!currentUserEmail) {
      navigate("/login");
      return;
    }

    const item = items[selectedItemIndex];
    const remaining = getRemainingQuantity(item);
    const amount = Math.max(1, Math.min(Number(offerAmount) || 1, remaining || 1));

    if (!item || remaining <= 0) return;

    setSendingOffer(true);

    try {
      const content = `[OFFER:item_index=${selectedItemIndex};amount=${amount}] I can bring ${amount} ${item.name}.`;
      const { response, data } = await apiFetch(
        `/messages/?sender_email=${encodeURIComponent(currentUserEmail)}`,
        {
          method: "POST",
          body: JSON.stringify({
            recipient_email: need.organization_email,
            content,
            donation_id: null,
            need_id: need.id,
          }),
        }
      );

      if (!response.ok) {
        alert(data?.detail || "Could not send your offer.");
        return;
      }

      navigate(`/chat/${encodeURIComponent(need.organization_email)}?needId=${need.id}`);
    } catch (err) {
      console.error("Offer message error:", err);
      alert("Could not contact the server.");
    } finally {
      setSendingOffer(false);
    }
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
          <div className={`need-card-offer ${showOfferForm ? "open" : ""}`} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="need-card-offer-toggle" onClick={handleToggleOffer}>
              {showOfferForm ? "Close offer" : "I can bring"}
            </button>

            {showOfferForm && (
              <div className="need-card-offer-form">
                <label>
                  <span>Item</span>
                  <select value={selectedItemIndex} onChange={(e) => handleSelectedItemChange(e.target.value)}>
                    {items.map((item, idx) => {
                      const remaining = getRemainingQuantity(item);
                      if (remaining <= 0) return null;

                      return (
                        <option key={idx} value={idx}>
                          {item.name} ({remaining} left)
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label>
                  <span>Qty</span>
                  <input
                    type="number"
                    min="1"
                    max={getRemainingQuantity(items[selectedItemIndex])}
                    value={offerAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                  />
                </label>

                <button
                  type="button"
                  className="need-card-offer-submit"
                  onClick={handleSendOffer}
                  disabled={sendingOffer}
                >
                  {sendingOffer ? "Sending..." : "Send offer"}
                </button>
              </div>
            )}
          </div>
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
