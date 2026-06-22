import "../styles/components/DonationCard.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineMapPin } from "react-icons/hi2";
import { getFirstDonationImage } from "../utils/donationImages";
import { useLanguage } from "../language/useLanguage";

export default function DonationCard({
  donation,
  onReserve,
  onDelete,
  currentUserEmail,
  isOwner,
  isAdmin = false,
  large = false,
  showDelete = false,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const reservedByCurrentUser = donation.reserved_by_email === currentUserEmail;
  const isReservedBySomeoneElse =
    donation.status === "reserved" && donation.reserved_by_email && !reservedByCurrentUser;
  const statusLabels = {
    available: t("donationCard.available"),
    reserved: t("donationCard.reserved"),
    inactive: t("donationCard.inactive"),
  };

  const firstImage = getFirstDonationImage(donation.image);

  function handleStatusChange(e, newStatus) {
    e.stopPropagation();
    if (onReserve) {
      onReserve(donation.id, newStatus);
    }
    setShowMenu(false);
  }

  function handleReserve(e) {
    e.stopPropagation();
    const newStatus = donation.status === "available" ? "reserved" : "available";
    if (onReserve) {
      onReserve(donation.id, newStatus);
    }
  }

  function handleContact(e) {
    e.stopPropagation();
    if (!currentUserEmail) {
      navigate("/login");
      return;
    }

    const params = new URLSearchParams({
      donationId: String(donation.id),
      draft: t("donationCard.contactDraft").replace("{title}", donation.title),
    });

    navigate(`/chat/${encodeURIComponent(donation.owner_email)}?${params.toString()}`);
  }

  function handleDelete(e) {
    e.stopPropagation();
    if (onDelete) {
      onDelete(donation.id);
    }
  }

  return (
    <div
      className={`donation-card ${large ? "donation-card-large" : ""}`}
      onClick={() => navigate(`/donation/${donation.id}`)}
    >
      <div className={`donation-image-container ${large ? "donation-image-container-large" : ""}`}>
        {firstImage ? (
          <img src={firstImage} alt={donation.title} className="donation-image" />
        ) : (
          <div className="donation-placeholder">
            <span>{t("donationCard.noImage")}</span>
          </div>
        )}

        <span className={`status-badge status-${donation.status || "available"}`}>
          {statusLabels[donation.status] || statusLabels.available}
        </span>
      </div>

      <div className="donation-content">
        <h3 className="donation-title">{donation.title}</h3>

        <p className="donation-location">
          <HiOutlineMapPin size={18} style={{ marginRight: "4px", verticalAlign: "middle" }} />
          {donation.location}
        </p>

        <div className="donation-footer-new">
          <div className="donation-owner">
            <b>{t("donationCard.by")}: </b>{donation.donor_name || t("donationCard.anonymous")}
          </div>

          <div className="donation-actions-compact">
            {isAdmin ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/donation/${donation.id}`);
                }}
                className="vinted-action-btn contact-btn"
              >
                {t("donationCard.details")}
              </button>
            ) : isOwner ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/editdonation/${donation.id}`);
                  }}
                  className="vinted-action-btn edit-btn"
                >
                  {t("donationCard.edit")}
                </button>

                {showDelete && (
                  <button
                    onClick={handleDelete}
                    className="vinted-action-btn delete-btn"
                  >
                    {t("donationCard.delete")}
                  </button>
                )}

                <div className="status-menu-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(!showMenu);
                    }}
                    className="vinted-action-btn status-btn"
                  >
                    {t("donationCard.status")}
                  </button>

                  {showMenu && (
                    <div className="status-dropdown">
                      {Object.keys(statusLabels).map((key) => (
                        <button
                          key={key}
                          onClick={(e) => handleStatusChange(e, key)}
                          className={`status-option status-${key}-option ${
                            donation.status === key ? "active" : ""
                          }`}
                        >
                          {statusLabels[key]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {donation.status === "available" && (
                  <button
                    onClick={handleReserve}
                    className={`vinted-action-btn reserve-btn ${donation.status}`}
                  >
                    {t("donationCard.reserve")}
                  </button>
                )}

                {donation.status === "reserved" && (
                  <button
                    onClick={handleReserve}
                    disabled={isReservedBySomeoneElse || !reservedByCurrentUser}
                    className={`vinted-action-btn reserve-btn ${donation.status}`}
                  >
                    {reservedByCurrentUser ? t("donationCard.cancelReservation") : t("donationCard.reserved")}
                  </button>
                )}

                {donation.status === "inactive" && (
                  <button
                    onClick={(e) => e.stopPropagation()}
                    disabled
                    className={`vinted-action-btn reserve-btn ${donation.status}`}
                  >
                    {t("donationCard.unavailable")}
                  </button>
                )}

                <button
                  onClick={handleContact}
                  className="vinted-action-btn contact-btn"
                >
                  {t("donationCard.contact")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
