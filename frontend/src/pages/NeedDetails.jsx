import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch, buildFileUrl } from "../api/api";
import { HiOutlineMapPin, HiOutlineArrowLeft } from "react-icons/hi2";
import OrganizationPreviewCard from "../components/profile/OrganizationPreviewCard";
import { isAdminUser } from "../utils/auth";
import {
  buildNeedOfferMessage,
  clampNeedOfferAmount,
  getRemainingNeedQuantity,
} from "../utils/needOffers";
import { useTimedNotification } from "../hooks/useTimedNotification";
import { useLanguage } from "../language/useLanguage";
import "../styles/pages/NeedDetails.css";

export default function NeedDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [need, setNeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [offeringIndex, setOfferingIndex] = useState(null);
  const [offerQuantities, setOfferQuantities] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const { notification, showNotification } = useTimedNotification(3200);
  const { t } = useLanguage();

  const currentUserEmail = localStorage.getItem("userEmail");
  const isOwner = currentUserEmail === need?.organization_email;
  const isAdmin = isAdminUser();

  useEffect(() => {
    async function loadNeedAndOrganization() {
      try {
        const { response, data } = await apiFetch(`/needs/${id}`);

        if (response.ok) {
          setNeed(data);

          if (data.organization_email === currentUserEmail || isAdminUser()) {
            setRecommendationsLoading(true);
            apiFetch(`/recommendations/needs/${data.id}?limit=3&min_score=58`)
              .then((recommendationsResult) => {
                if (recommendationsResult.response.ok) {
                  setRecommendations(recommendationsResult.data?.recommendations || []);
                }
              })
              .catch((err) => {
                console.error("Recommendations error:", err);
              })
              .finally(() => {
                setRecommendationsLoading(false);
              });
          }

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
  }, [id, currentUserEmail]);

  function handleContact() {
    if (!currentUserEmail) {
      navigate("/login");
      return;
    }

    navigate(`/chat/${encodeURIComponent(need.organization_email)}?needId=${need.id}`);
  }

  function getOfferQuantity(item, itemIndex) {
    return clampNeedOfferAmount(item, offerQuantities[itemIndex] || 1);
  }

  function handleOfferQuantityChange(item, itemIndex, value) {
    setOfferQuantities((prev) => ({ ...prev, [itemIndex]: clampNeedOfferAmount(item, value) }));
  }

  async function handleOfferItem(item, itemIndex) {
    if (!currentUserEmail) {
      navigate("/login");
      return;
    }

    const amount = getOfferQuantity(item, itemIndex);
    if (amount <= 0) return;

    setOfferingIndex(itemIndex);

    try {
      const content = buildNeedOfferMessage(itemIndex, amount, item.name);
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
        showNotification(data?.detail || t("needDetails.offerSendError"), "error");
        return;
      }

      navigate(`/chat/${encodeURIComponent(need.organization_email)}?needId=${need.id}`);
    } catch (err) {
      console.error("Offer message error:", err);
      showNotification(t("needDetails.serverError"), "error");
    } finally {
      setOfferingIndex(null);
    }
  }

  function handleRecommendationContact(match, group) {
    if (!currentUserEmail) {
      navigate("/login");
      return;
    }

    const content = t("needDetails.recommendedDonationDraft")
      .replace("{donationTitle}", match.title)
      .replace("{itemName}", group.item_name)
      .replace("{needTitle}", need.title);
    const params = new URLSearchParams({
      donationId: String(match.donation_id),
      needId: String(need.id),
      draft: content,
    });

    navigate(`/chat/${encodeURIComponent(match.owner_email)}?${params.toString()}`);
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
        showNotification(t("needDetails.saveChangeError"), "error");
      }
    } catch (err) {
      console.error("Eroare la salvarea bifei:", err);
      setNeed(previousNeed);
      showNotification(t("needDetails.saveChangeError"), "error");
    }
  };

  if (loading) {
    return (
      <div className="need-details-page">
        <div className="page-message surface-card">{t("needDetails.loading")}</div>
      </div>
    );
  }

  if (!need) {
    return (
      <div className="need-details-page">
        <div className="page-message error surface-card">{t("needDetails.notFound")}</div>
      </div>
    );
  }

  const items = need.items || [];
  const totalNeeded = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalBrought = items.reduce((sum, item) => sum + (item.brought || 0), 0);
  const progress = totalNeeded > 0 ? Math.round((totalBrought / totalNeeded) * 100) : 0;
  const recommendationGroups = recommendations.filter((group) => (group.matches || []).length > 0);

  return (
    <div className="need-details-page">
      {notification.message && (
        <div className={`page-notification ${notification.type === "error" ? "error" : "success"}`}>
          {notification.message}
        </div>
      )}

      <div className="need-details-topbar">
        <button onClick={() => navigate(-1)} className="page-back-button">
          <HiOutlineArrowLeft size={16} />
          <span>{t("needDetails.back")}</span>
        </button>
      </div>

      <div className="need-details-layout">
        <div className="need-details-image-card surface-card">
          {need.image ? (
            <img src={need.image} alt={need.title} className="need-details-image" />
          ) : organization ? (
            <OrganizationPreviewCard organization={organization} />
          ) : (
            <div className="need-details-placeholder">{t("needDetails.noImage")}</div>
          )}
        </div>

        <div className="need-details-card surface-card">
          <div className="need-details-title-row">
            <div>
              <h1>{need.title}</h1>

              <p className="need-details-location">
                <HiOutlineMapPin size={16} />
                <span>{need.location}</span>
              </p>
            </div>

            <span className="need-details-progress-badge">
              {t("needDetails.progressDone").replace("{progress}", progress)}
            </span>
          </div>

          <div className="need-details-progress-summary">
            <span>{t("needDetails.progress")}</span>
            <strong>
              {t("needDetails.broughtSummary")
                .replace("{brought}", totalBrought)
                .replace("{total}", totalNeeded)}
            </strong>
          </div>

          {need.description && (
            <div className="need-details-section">
              <h3>{t("needDetails.description")}</h3>
              <p>{need.description}</p>
            </div>
          )}

          <div className="need-details-section">
            <h3>{t("needDetails.itemsNeeded")}</h3>

            <div className="need-details-progress-wrap">
              <div className="need-details-progress-bar" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="need-details-items">
              {items.length === 0 ? (
                <p className="need-details-empty-text">{t("needDetails.noItems")}</p>
              ) : (
                items.map((item, idx) => {
                  const isCompleted = item.brought >= item.quantity && item.quantity > 0;
                  const remaining = getRemainingNeedQuantity(item);
                  const offerQuantity = getOfferQuantity(item, idx);

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
                        {isOwner ? (
                          <label className="need-details-owner-qty">
                            <span>{t("needDetails.received")}</span>
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={item.brought || 0}
                              onChange={(e) => handleItemCheck(idx, Number(e.target.value) || 0)}
                            />
                            <strong>/ {item.quantity}</strong>
                          </label>
                        ) : (
                          <span className="need-details-item-qty">
                            {item.brought || 0}/{item.quantity}
                          </span>
                        )}

                        {!isOwner && !isAdmin && !isCompleted && (
                          <div className="need-details-offer-controls">
                            <label>
                              <span>{t("needDetails.qty")}</span>
                              <input
                                type="number"
                                min="1"
                                max={remaining}
                                value={offerQuantity}
                                onChange={(e) => handleOfferQuantityChange(item, idx, e.target.value)}
                              />
                            </label>

                            <button
                              type="button"
                              className="need-details-offer-button"
                              onClick={() => handleOfferItem(item, idx)}
                              disabled={offeringIndex === idx}
                            >
                              {offeringIndex === idx ? t("needDetails.sending") : t("needDetails.iCanBring")}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {isOwner && (
            <div className="need-details-owner-actions">
              <button
                onClick={() => navigate(`/editneed/${need.id}`)}
                className="action-button primary"
              >
                {t("needDetails.editList")}
              </button>
            </div>
          )}

          {isOwner && (
            <div className="need-details-section need-details-recommendations-section">
              <div className="need-details-recommendations-header">
                <h3>{t("needDetails.suggestedDonations")}</h3>
                <span>{t("needDetails.recommended")}</span>
              </div>

              {recommendationsLoading ? (
                <div className="empty-panel">{t("needDetails.loadingMatches")}</div>
              ) : recommendationGroups.length === 0 ? (
                <div className="empty-panel">{t("needDetails.noDonationMatches")}</div>
              ) : (
                <div className="need-details-recommendations-list">
                  {recommendationGroups.map((group) => (
                    <div key={group.item_index} className="need-details-recommendation-group">
                      <div className="need-details-recommendation-group-title">
                        <strong>{group.item_name}</strong>
                        <span>{t("needDetails.stillNeeded").replace("{count}", group.remaining_quantity)}</span>
                      </div>

                      <div className="need-details-recommendation-cards">
                        {group.matches.map((match) => (
                          <div
                            key={match.donation_id}
                            className="need-details-recommendation-card surface-card subtle"
                          >
                            <button
                              type="button"
                              className="need-details-recommendation-image"
                              onClick={() => navigate(`/donation/${match.donation_id}`)}
                            >
                              {match.image ? (
                                <img src={buildFileUrl(match.image)} alt={match.title} />
                              ) : (
                                <span>{t("needDetails.noImage")}</span>
                              )}
                            </button>

                            <div className="need-details-recommendation-content">
                              <div>
                                <h4>{match.title}</h4>
                                <p>{match.location}</p>
                              </div>

                              <div className="need-details-recommendation-actions">
                                <button
                                  type="button"
                                  className="action-button small soft"
                                  onClick={() => navigate(`/donation/${match.donation_id}`)}
                                >
                                  {t("needDetails.details")}
                                </button>

                                <button
                                  type="button"
                                  className="action-button small solid"
                                  onClick={() => handleRecommendationContact(match, group)}
                                >
                                  {t("needDetails.contact")}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(isAdmin || !isOwner) && (
            <div className="need-details-actions">
              <div className="need-details-actions-row">
                {isAdmin ? (
                  <button
                    onClick={() => navigate("/admin/verifications")}
                    className="action-button primary"
                  >
                    {t("needDetails.backToAdmin")}
                  </button>
                ) : (
                  <button onClick={handleContact} className="action-button primary">
                    {t("needDetails.sendMessage")}
                  </button>
                )}

                {!isOwner && organization?.phone_visible && organization?.phone && (
                  <a href={`tel:${organization.phone}`} className="action-button secondary">
                    {t("needDetails.call")}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

