import { HiOutlineMapPin } from "react-icons/hi2";
import ProfileEmptyState from "./ProfileEmptyState";
import { useLanguage } from "../../language/useLanguage";

export default function ProfileNeeds({ myNeeds, navigate, handleDeleteNeed }) {
  const { t } = useLanguage();

  if (myNeeds.length === 0) {
    return (
      <ProfileEmptyState
        text={t("profile.noNeeds")}
        action={t("profile.postOneNow")}
        onAction={() => navigate("/postneed")}
      />
    );
  }

  return (
    <div className="profile-card-grid">
      {myNeeds.map((need) => (
        <article key={need.id} className="profile-need-card surface-card">
          <div className="profile-need-cover">
            {t("profile.needList")}
          </div>

          <div className="profile-need-body">
            <h3>{need.title}</h3>

            <p className="profile-need-location">
              <HiOutlineMapPin size={16} />
              {need.location}
            </p>

            <div className="profile-need-items">
              {need.items.map((item, idx) => (
                <span key={idx}>
                  {item.name}: {item.brought}/{item.quantity}
                </span>
              ))}
            </div>

            <div className="profile-need-actions">
              <button
                onClick={() => navigate(`/editneed/${need.id}`)}
                className="profile-need-primary"
              >
                {t("profile.edit")}
              </button>

              <button
                onClick={() => handleDeleteNeed(need.id)}
                className="profile-need-danger"
              >
                {t("profile.delete")}
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
