import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import { getDonationCategoryLabel } from "../constants/donationCategories";
import "../styles/pages/DonationDetails.css";

export default function DonationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeImage, setActiveImage] = useState("");
  const [imageList, setImageList] = useState([]);

  const currentUserEmail = localStorage.getItem("userEmail");
  const isOwner = currentUserEmail === donation?.owner_email;

  useEffect(() => {
    async function loadDonation() {
      try {
        const { response, data } = await apiFetch(`/donations/${id}`);
        if (response.ok) {
          setDonation(data);

          let parsedImages = [];
          try {
            parsedImages = JSON.parse(data.image);
            if (!Array.isArray(parsedImages)) {
              parsedImages = [data.image];
            }
          } catch (e) {
            if (data.image) parsedImages = [data.image];
          }

          setImageList(parsedImages);
          if (parsedImages.length > 0) setActiveImage(parsedImages[0]);
        }
      } catch (err) {
        console.error("Error fetching donation details:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDonation();
  }, [id]);

  async function handleDelete() {
    const confirmDelete = window.confirm("Are you sure you want to delete this donation?");
    if (!confirmDelete) return;

    try {
      const { response } = await apiFetch(`/donations/${donation.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Could not delete donation.");
        return;
      }

      alert("Donation deleted successfully.");
      navigate("/profile");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Server error while deleting.");
    }
  }

  function handleContact() {
    if (!currentUserEmail) {
      navigate("/login");
      return;
    }

    navigate(`/chat/${encodeURIComponent(donation.owner_email)}?donationId=${donation.id}`);
  }

  async function handleReserve() {
    if (!currentUserEmail) {
      navigate("/login");
      return;
    }

    const newStatus = donation.status === "available" ? "reserved" : "available";
    const params = new URLSearchParams({ new_status: newStatus, user_email: currentUserEmail });

    try {
      const { response, data } = await apiFetch(`/donations/${donation.id}/status?${params.toString()}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        alert(data?.detail || "Could not update donation status.");
        return;
      }

      setDonation(data);
    } catch (err) {
      console.error("Reserve error:", err);
      alert("Could not contact the server.");
    }
  }

  if (loading) {
    return <div className="donation-details-message loading">Loading details...</div>;
  }

  if (!donation) {
    return <div className="donation-details-message error">Item not found!</div>;
  }

  const reservedByCurrentUser = donation.reserved_by_email === currentUserEmail;
  const isReservedBySomeoneElse =
    donation.status === "reserved" && donation.reserved_by_email && !reservedByCurrentUser;

  return (
    <div className="donation-details-page">
      <button onClick={() => navigate(-1)} className="donation-details-back">
        Back to feed
      </button>

      <div className="donation-details-layout">
        <div className="donation-details-media-column">
          <div className="donation-details-image-frame">
            {activeImage ? (
              <img src={activeImage} alt={donation.title} className="donation-details-main-image" />
            ) : (
              <div className="donation-details-no-image">No image available</div>
            )}
          </div>

          {imageList.length > 1 && (
            <div className="donation-details-thumbnails">
              {imageList.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`donation-details-thumbnail ${activeImage === img ? "active" : ""}`}
                >
                  <img src={img} alt="thumbnail" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="donation-details-card">
          <h1>{donation.title}</h1>

          <div className="donation-details-meta">
            <div className="donation-details-meta-row">
              <span>Category</span>
              <strong className="capitalize">{getDonationCategoryLabel(donation.category)}</strong>
            </div>

            <div className="donation-details-meta-row">
              <span>Location</span>
              <strong>{donation.location}</strong>
            </div>

            <div className="donation-details-meta-row">
              <span>Status</span>
              <span className={`donation-details-status ${donation.status || "inactive"}`}>
                {donation.status === "inactive" ? "no longer available" : donation.status}
              </span>
            </div>
          </div>

          <div className="donation-details-section">
            <h3>Description</h3>
            <p>{donation.description || "No description provided."}</p>
          </div>

          <div className="donation-details-actions">
            {isOwner ? (
              <>
                <button
                  onClick={() => navigate(`/editdonation/${donation.id}`)}
                  className="donation-details-primary-action"
                >
                  Edit Item
                </button>

                <button onClick={handleDelete} className="donation-details-danger-action">
                  Delete Item
                </button>
              </>
            ) : (
              <>
                {donation.status === "available" && (
                  <button onClick={handleReserve} className="donation-details-primary-action">
                    Reserve item
                  </button>
                )}

                {donation.status === "reserved" && (
                  <button
                    onClick={handleReserve}
                    disabled={isReservedBySomeoneElse || !reservedByCurrentUser}
                    className="donation-details-secondary-action"
                  >
                    {reservedByCurrentUser ? "Cancel reservation" : "Reserved by another user"}
                  </button>
                )}

                <button onClick={handleContact} className="donation-details-primary-action">
                  Send message
                </button>

                {donation.phone_visible && donation.phone && (
                  <a href={`tel:${donation.phone}`} className="donation-details-secondary-action">
                    Call donor
                  </a>
                )}
              </>
            )}
          </div>

          <div className="donation-details-owner-box">
            <p>
              Posted by:{" "}
              <strong onClick={() => navigate(`/user/${encodeURIComponent(donation.owner_email)}`)}>
                {donation.donor_name || "Anonymous"}
              </strong>
            </p>

            {donation.phone_visible && donation.phone && (
              <p className="donation-details-phone">
                Phone: <a href={`tel:${donation.phone}`}>{donation.phone}</a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
