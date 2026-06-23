import { useNavigate } from "react-router-dom";
import DonationCard from "../DonationCard";
import ProfileEmptyState from "./ProfileEmptyState";
import { useLanguage } from "../../language/useLanguage";

export default function ProfileActivity({
  type,
  reservedDonations,
  sentOffers,
  onReserve,
  currentUserEmail,
}) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (type === "reservations") {
    if (!reservedDonations.length) {
      return <ProfileEmptyState text={t("profile.noReservations")} action={t("profile.browseDonations")} onAction={() => navigate("/donations")} />;
    }

    return (
      <div className="profile-card-grid">
        {reservedDonations.map((donation) => (
          <DonationCard
            key={donation.id}
            donation={donation}
            onReserve={onReserve}
            currentUserEmail={currentUserEmail}
            isOwner={false}
            large={true}
          />
        ))}
      </div>
    );
  }

  if (!sentOffers.length) {
    return <ProfileEmptyState text={t("profile.noOffers")} action={t("profile.browseNeeds")} onAction={() => navigate("/needs")} />;
  }

  return (
    <div className="profile-offers-list">
      {sentOffers.map((offer) => (
        <article key={offer.id} className="profile-offer-card surface-card">
          <div>
            <div className="profile-offer-eyebrow">{t("profile.offerSent")}</div>
            <h3>{offer.item_name}</h3>
            <p>
              {t("profile.offerAmount")}: <strong>{offer.amount}</strong>
            </p>
            <p>
              {t("profile.forNeed")} <strong>{offer.need_title}</strong>
            </p>
            <p>
              {t("profile.sentTo")} <strong>{offer.recipient_name || offer.recipient_email}</strong>
            </p>
            {offer.created_at && (
              <span>{new Date(offer.created_at).toLocaleDateString()}</span>
            )}
          </div>

          <div className="profile-offer-actions">
            {offer.need_id && (
              <button type="button" onClick={() => navigate(`/need/${offer.need_id}`)}>
                {t("profile.viewNeed")}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const params = offer.need_id ? `?needId=${offer.need_id}` : "";
                navigate(`/chat/${encodeURIComponent(offer.recipient_email)}${params}`);
              }}
            >
              {t("profile.openChat")}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
