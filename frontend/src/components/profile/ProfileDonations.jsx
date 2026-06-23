import { useNavigate } from "react-router-dom";
import DonationCard from "../DonationCard";
import ProfileEmptyState from "./ProfileEmptyState";
import { useLanguage } from "../../language/useLanguage";

export default function ProfileDonations({
  myDonations,
  handleStatusChange,
  handleDeleteDonation,
}) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const userEmail = localStorage.getItem("userEmail");

  if (!myDonations.length) {
    return (
      <ProfileEmptyState
        text={t("profile.noDonations")}
        action={t("profile.postOneNow")}
        onAction={() => navigate("/postdonation")}
      />
    );
  }

  return (
    <div className="profile-card-grid">
      {myDonations.map((donation) => (
        <DonationCard
          key={donation.id}
          donation={donation}
          onReserve={handleStatusChange}
          onDelete={handleDeleteDonation}
          currentUserEmail={userEmail}
          isOwner={true}
          large={true}
          showDelete={true}
        />
      ))}
    </div>
  );
}
