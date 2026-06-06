import { useNavigate } from "react-router-dom";
import DonationCard from "../DonationCard";
import { colors, radius, shadow } from "../../styles/theme";

export default function ProfileDonations({
  myDonations,
  handleStatusChange,
  handleDeleteDonation,
}) {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");

  if (!myDonations.length) {
    return (
      <div
        style={{
          background: colors.white,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.xl,
          boxShadow: shadow.soft,
          padding: "56px 24px",
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0, color: colors.textSoft, fontSize: 15 }}>
          No donations posted yet.{" "}
          <span
            onClick={() => navigate("/postdonation")}
            style={{
              color: colors.primary,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Post one now
          </span>
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 24,
      }}
    >
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