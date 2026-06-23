import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import { getDonationCategoryLabel } from "../constants/donationCategories";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { useTimedNotification } from "../hooks/useTimedNotification";
import { useLanguage } from "../language/useLanguage";
import { isAdminUser } from "../utils/auth";
import { getDonationImages } from "../utils/donationImages";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import "../styles/pages/DonationDetails.css";

export default function DonationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeImage, setActiveImage] = useState("");
  const [imageList, setImageList] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [reservationNotice, setReservationNotice] = useState("");
  const { confirm, confirmDialog } = useConfirmDialog();
  const { notification, showNotification } = useTimedNotification(3200);
  const { t } = useLanguage();

  const currentUserEmail = localStorage.getItem("userEmail");
  const isOwner = currentUserEmail === donation?.owner_email;
  const isAdmin = isAdminUser();

  useEffect(() => {
    async function loadDonation() {
      try {
        const { response, data } = await apiFetch(`/donations/${id}`);
        if (response.ok) {
          setDonation(data);
          setRecommendations([]);

          const parsedImages = getDonationImages(data.image);

          setImageList(parsedImages);
          if (parsedImages.length > 0) setActiveImage(parsedImages[0]);

          if (data.owner_email === currentUserEmail || isAdminUser()) {
            setRecommendationsLoading(true);
            apiFetch(`/recommendations/donations/${data.id}?limit=6&min_score=58`)
              .then((recommendationsResult) => {
                if (recommendationsResult.response.ok) {
                  setRecommendations(recommendationsResult.data?.recommendations || []);
                }
              })
              .catch((err) => {
                console.error("Donation recommendations error:", err);
              })
              .finally(() => {
                setRecommendationsLoading(false);
              });
          }
        }
      } catch (err) {
        console.error("Error fetching donation details:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDonation();
  }, [id, currentUserEmail]);

  async function handleDelete() {
    const confirmDelete = await confirm({
      title: t("donationDetails.deleteTitle"),
      message: t("donationDetails.deleteText"),
      confirmLabel: t("donationDetails.deleteConfirm"),
    });
    if (!confirmDelete) return;

    try {
      const params = new URLSearchParams({ actor_email: currentUserEmail });
      const { response } = await apiFetch(`/donations/${donation.id}?${params.toString()}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        showNotification(t("donationDetails.deleteError"), "error");
        return;
      }

      showNotification(t("donationDetails.deleteSuccess"));
      navigate(isAdmin ? "/admin/verifications" : "/profile");
    } catch (err) {
      console.error("Delete error:", err);
      showNotification(t("donationDetails.deleteServerError"), "error");
    }
  }

  function getContactDraft(currentDonation = donation) {
    return t("donationCard.contactDraft").replace("{title}", currentDonation.title);
  }

  function openDonationChat(currentDonation = donation, draftType = "") {
    if (!currentUserEmail) {
      navigate("/login");
      return;
    }

    const params = new URLSearchParams({
      donationId: String(currentDonation.id),
      draft: getContactDraft(currentDonation),
    });

    if (draftType) params.set("draftType", draftType);

    navigate(`/chat/${encodeURIComponent(currentDonation.owner_email)}?${params.toString()}`);
  }

  function handleContact() {
    openDonationChat(donation);
  }

  function handleRecommendedNeedContact(match) {
    if (!currentUserEmail) {
      navigate("/login");
      return;
    }

    if (!match.organization_email) {
      showNotification(t("donationDetails.contactUnavailable"), "error");
      return;
    }

    const content = t("donationDetails.recommendedNeedDraft")
      .replace("{needTitle}", match.title)
      .replace("{donationTitle}", donation.title)
      .replace("{itemName}", match.item_name);
    const params = new URLSearchParams({
      donationId: String(donation.id),
      needId: String(match.need_id),
      draft: content,
    });

    navigate(`/chat/${encodeURIComponent(match.organization_email)}?${params.toString()}`);
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
        showNotification(data?.detail || t("donationDetails.updateStatusError"), "error");
        return;
      }

      setDonation(data);
      if (newStatus === "reserved") {
        setReservationNotice(t("donationDetails.reservedNotice"));
      } else {
        setReservationNotice("");
      }
    } catch (err) {
      console.error("Reserve error:", err);
      showNotification(t("donationDetails.serverError"), "error");
    }
  }

  if (loading) {
    return <div className="page-message loading">{t("donationDetails.loading")}</div>;
  }

  if (!donation) {
    return <div className="page-message error">{t("donationDetails.notFound")}</div>;
  }

  const reservedByCurrentUser = donation.reserved_by_email === currentUserEmail;
  const isReservedBySomeoneElse =
    donation.status === "reserved" && donation.reserved_by_email && !reservedByCurrentUser;

  return (
    <div className="donation-details-page">
      {notification.message && (
        <div className={`page-notification donation-details-notification-space ${notification.type === "error" ? "error" : "success"}`}>
          {notification.message}
        </div>
      )}

      <button onClick={() => navigate(-1)} className="donation-details-back">
        <HiOutlineArrowLeft size={16} />
        <span>{t("donationDetails.backToFeed")}</span>
      </button>

      <div className="donation-details-layout">
        <div className="donation-details-media-column">
          <div className="donation-details-image-frame surface-card">
            {activeImage ? (
              <img src={activeImage} alt={donation.title} className="donation-details-main-image" />
            ) : (
              <div className="donation-details-no-image">{t("donationDetails.noImage")}</div>
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

        <div className="donation-details-card surface-card">
          <h1>{donation.title}</h1>

          <div className="donation-details-meta">
            <div className="donation-details-meta-row">
              <span>{t("donationDetails.category")}</span>
              <strong className="capitalize">{getDonationCategoryLabel(donation.category)}</strong>
            </div>

            <div className="donation-details-meta-row">
              <span>{t("donationDetails.location")}</span>
              <strong>{donation.location}</strong>
            </div>

            <div className="donation-details-meta-row">
              <span>{t("donationDetails.status")}</span>
              <span className={`donation-details-status ${donation.status || "inactive"}`}>
                {donation.status === "inactive" ? t("donationDetails.noLongerAvailable") : donation.status}
              </span>
            </div>
          </div>

          <div className="donation-details-section">
            <h3>{t("donationDetails.description")}</h3>
            <p>{donation.description || t("donationDetails.noDescription")}</p>
          </div>

          {isOwner && (
            <div className="donation-details-section donation-details-recommendations-section">
              <div className="donation-details-recommendations-header">
                <h3>{t("donationDetails.suggestedNeeds")}</h3>
                <span>{t("donationDetails.recommended")}</span>
              </div>

              {recommendationsLoading ? (
                <div className="empty-panel">{t("donationDetails.loadingMatches")}</div>
              ) : recommendations.length === 0 ? (
                <div className="empty-panel">{t("donationDetails.noNeedMatches")}</div>
              ) : (
                <div className="donation-details-recommendations-list">
                  {recommendations.map((match) => (
                    <div
                      key={`${match.need_id}-${match.item_index}`}
                          className="donation-details-recommendation-card surface-card subtle"
                    >
                      <div>
                        <div className="donation-details-recommendation-top">
                          <strong>{match.item_name}</strong>
                          <span>{match.remaining_quantity} still needed</span>
                        </div>

                        <h4>{match.title}</h4>
                        <p>{match.organization_name}</p>
                        <small>{match.location}</small>
                      </div>

                      <div className="donation-details-recommendation-actions">
                        <button
                          type="button"
                          className="action-button small soft"
                          onClick={() => navigate(`/need/${match.need_id}`)}
                        >
                          {t("donationDetails.details")}
                        </button>

                        <button
                          type="button"
                          className="action-button small solid"
                          onClick={() => handleRecommendedNeedContact(match)}
                        >
                          {t("donationDetails.contact")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="donation-details-actions">
            {isAdmin ? (
              <>
                <button onClick={handleDelete} className="action-button full danger">
                  {t("donationDetails.deleteDonation")}
                </button>
              </>
            ) : isOwner ? (
              <>
                <button
                  onClick={() => navigate(`/editdonation/${donation.id}`)}
                  className="action-button full primary"
                >
                  {t("donationDetails.editItem")}
                </button>

                <button onClick={handleDelete} className="action-button full danger">
                  {t("donationDetails.deleteItem")}
                </button>
              </>
            ) : (
              <>
                {donation.status === "available" && (
                  <button onClick={handleReserve} className="action-button full primary">
                    {t("donationDetails.reserveItem")}
                  </button>
                )}

                {donation.status === "reserved" && (
                  <button
                    onClick={handleReserve}
                    disabled={isReservedBySomeoneElse || !reservedByCurrentUser}
                    className="action-button full secondary"
                  >
                    {reservedByCurrentUser ? t("donationDetails.cancelReservation") : t("donationDetails.reservedByAnotherUser")}
                  </button>
                )}

                {reservedByCurrentUser && (
                  <button onClick={() => openDonationChat(donation, "reserve")} className="action-button full primary">
                    {t("donationDetails.continueChat")}
                  </button>
                )}

                <button onClick={handleContact} className="action-button full primary">
                  {t("donationDetails.contactDonor")}
                </button>

                {donation.phone_visible && donation.phone && (
                  <a href={`tel:${donation.phone}`} className="action-button full secondary">
                    {t("donationDetails.callDonor")}
                  </a>
                )}
              </>
            )}
          </div>

          {reservationNotice && (
            <div className="donation-details-reservation-notice">
              <span>{reservationNotice}</span>
              <button type="button" onClick={() => openDonationChat(donation, "reserve")}>
                {t("donationDetails.continueChat")}
              </button>
            </div>
          )}

          <div className="donation-details-owner-box">
            <p>
              {t("donationDetails.postedBy")}:{" "}
              <strong onClick={() => navigate(`/user/${encodeURIComponent(donation.owner_email)}`)}>
                {donation.donor_name || t("donationDetails.anonymous")}
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
      {confirmDialog}
    </div>
  );
}
