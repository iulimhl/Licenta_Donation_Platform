import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch, buildFileUrl } from "../api/api";
import { HiOutlineMapPin, HiOutlineArrowLeft } from "react-icons/hi2";
import OrganizationPreviewCard from "../components/profile/OrganizationPreviewCard";
import "../styles/pages/NeedDetails.css";

export default function NeedDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [need, setNeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [offeringIndex, setOfferingIndex] = useState(null);

  const currentUserEmail = localStorage.getItem("userEmail");
  const isOwner = currentUserEmail === need?.organization_email;

  useEffect(() => {
    async function loadNeedAndOrganization() {
      try {
        const { response, data } = await apiFetch(`/needs/${id}`);

        if (response.ok) {
          setNeed(data);

          if (data.organization_email) {
            const orgResult = await apiFetch(
              `/organizations/public/${encodeURIComponent(data.organization_email)}`
            );
            if (orgResult.response.ok) {
              setOrganization(orgResult.data);
            }
          }
        }
      } catch (err) {
        console.error("Need details error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadNeedAndOrganization();
  }, [id]);

  function handleContact() {
    if (!currentUserEmail) {
      navigate("/login");
      return;
    }

    navigate(`/chat/${encodeURIComponent(need.organization_email)}?needId=${need.id}`);
  }

  async function handleOfferItem(item, itemIndex) {
    if (!currentUserEmail) {
      navigate("/login");
      return;
    }

    setOfferingIndex(itemIndex);

    try {
      const content = `[OFFER:item_index=${itemIndex}] I can bring: ${item.name}.`;
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
      setOfferingIndex(null);
    }
  }

  const handleItemCheck = async (itemIndex, newBroughtQuantity) => {
    const previousNeed = { ...need };

    setNeed((prevNeed) => {
      const updatedItems = [...prevNeed.items];
      updatedItems[itemIndex] = { ...updatedItems[itemIndex], brought: newBroughtQuantity };
      return { ...prevNeed, items: updatedItems };
    });

    try {
      const { response, data } = await apiFetch(
        `/needs/${need.id}/item/${itemIndex}?brought=${newBroughtQuantity}`,
        { method: "PATCH" }
      );

      if (!response.ok) {
        console.error("Eroare de la server:", data);
        setNeed(previousNeed);
        alert("Eroare la salvarea modificarii. Te rog incearca din nou.");
      }
    } catch (err) {
      console.error("Eroare la salvarea bifei:", err);
      setNeed(previousNeed);
    }
  };

  if (loading) {
    return (
      <div className="need-details-page">
        <div className="need-details-message">Loading need list...</div>
      </div>
    );
  }

  if (!need) {
    return (
      <div className="need-details-page">
        <div className="need-details-message">Need list not found.</div>
      </div>
    );
  }

  const items = need.items || [];
  const totalNeeded = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalBrought = items.reduce((sum, item) => sum + (item.brought || 0), 0);
  const progress = totalNeeded > 0 ? Math.round((totalBrought / totalNeeded) * 100) : 0;

  return (
    <div className="need-details-page">
      <div className="need-details-topbar">
        <button onClick={() => navigate(-1)} className="need-details-back-button">
          <HiOutlineArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>

      <div className="need-details-layout">
        <div className="need-details-image-card">
          {need.image ? (
            <img src={need.image} alt={need.title} className="need-details-image" />
          ) : organization ? (
            <OrganizationPreviewCard organization={organization} />
          ) : (
            <div className="need-details-placeholder">No image</div>
          )}
        </div>

        <div className="need-details-card">
          <div className="need-details-title-row">
            <div>
              <h1>{need.title}</h1>

              <p className="need-details-location">
                <HiOutlineMapPin size={16} />
                <span>{need.location}</span>
              </p>
            </div>

            <span className="need-details-progress-badge">{progress}% done</span>
          </div>

          <div className="need-details-meta-row">
            <div className="need-details-meta-box">
              <span className="need-details-meta-label">Posted by</span>

              {organization ? (
                <div className="need-details-organization">
                  <div className="need-details-org-logo">
                    {organization.logo_url ? (
                      <img src={buildFileUrl(organization.logo_url)} alt={organization.name} />
                    ) : (
                      <span>{organization.name?.charAt(0)?.toUpperCase() || "O"}</span>
                    )}
                  </div>

                  <div className="need-details-org-info">
                    <div className="need-details-org-name-row">
                      <span className="need-details-meta-value">{organization.name}</span>
                      {organization.verification_status === "verified" && (
                        <span className="need-details-verified-badge">Verified</span>
                      )}
                    </div>

                    {organization.city && (
                      <span className="need-details-org-city">{organization.city}</span>
                    )}
                  </div>
                </div>
              ) : (
                <span className="need-details-meta-value">
                  {need.organization_name || need.organization_email}
                </span>
              )}

              <span className="need-details-meta-label">Progress</span>
              <span className="need-details-meta-value">
                {totalBrought} of {totalNeeded} brought
              </span>
            </div>
          </div>

          {need.description && (
            <div className="need-details-section">
              <h3>Description</h3>
              <p>{need.description}</p>
            </div>
          )}

          <div className="need-details-section">
            <h3>Items needed</h3>

            <div className="need-details-progress-wrap">
              <div className="need-details-progress-bar" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="need-details-items">
              {items.length === 0 ? (
                <p className="need-details-empty-text">No items added yet.</p>
              ) : (
                items.map((item, idx) => {
                  const isCompleted = item.brought >= item.quantity && item.quantity > 0;

                  return (
                    <div key={idx} className="need-details-item-row">
                      <div className="need-details-item-left">
                        {isOwner ? (
                          <input
                            type="checkbox"
                            checked={isCompleted}
                            onChange={(e) =>
                              handleItemCheck(idx, e.target.checked ? item.quantity : 0)
                            }
                            className="need-details-checkbox"
                          />
                        ) : (
                          <div
                            className={`need-details-item-status ${isCompleted ? "completed" : ""}`}
                            aria-hidden="true"
                          />
                        )}

                        <span className={`need-details-item-name ${isCompleted ? "completed" : ""}`}>
                          {item.name}
                        </span>
                      </div>

                      <div className="need-details-item-right">
                        <span className="need-details-item-qty">
                          {item.brought || 0}/{item.quantity}
                        </span>

                        {!isOwner && !isCompleted && (
                          <button
                            type="button"
                            className="need-details-offer-button"
                            onClick={() => handleOfferItem(item, idx)}
                            disabled={offeringIndex === idx}
                          >
                            {offeringIndex === idx ? "Sending..." : "I can bring this"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="need-details-actions">
            <div className="need-details-actions-row">
              {isOwner ? (
                <button
                  onClick={() => navigate(`/editneed/${need.id}`)}
                  className="need-details-contact-button"
                >
                  Edit list
                </button>
              ) : (
                <button onClick={handleContact} className="need-details-contact-button">
                  Send message
                </button>
              )}

              {!isOwner && organization?.phone_visible && organization?.phone && (
                <a href={`tel:${organization.phone}`} className="need-details-call-link">
                  Call
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

