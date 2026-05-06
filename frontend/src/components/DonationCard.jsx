import "./DonationCard.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const statusLabels = {
  available: "Available",
  reserved: "Reserved",
  delivered: "Delivered",
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
    <div className="donation-card">
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

      <div className="donation-content">
        <h3 className="donation-title">{donation.title}</h3>
        <p className="donation-location">{donation.location}</p>
        <p className="donation-category">
          Category: <span>{donation.category}</span>
        </p>

        {donation.description && (
          <p className="donation-description">{donation.description}</p>
        )}

        <div className="donation-footer-new">
          <div className="donation-owner">
            By: <span>{donation.donor_name || donation.owner_email}</span>
          </div>

          {isOwner ? (
            <div className="status-menu-container">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="status-btn"
              >
                Manage Status
              </button>

              {showMenu && (
                <div className="status-dropdown">
                  {Object.keys(statusLabels).map((key) => (
                    <button
                      key={key}
                      className={`status-option ${donation.status === key ? "active" : ""}`}
                      onClick={() => handleStatusChange(key)}
                    >
                      {statusLabels[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="donation-actions">
              <button
                onClick={handleReserve}
                disabled={donation.status === "unavailable"}
                className={`reserve-btn ${donation.status === "reserved" ? "reserved" : "available"}`}
              >
                {donation.status === "reserved" ? "Cancel Reservation" : "Reserve Item"}
              </button>

              <button onClick={handleContact} className="contact-btn">
                Contact
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}