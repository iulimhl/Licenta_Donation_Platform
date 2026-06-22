import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import DonationCard from "../components/DonationCard";
import NeedCard from "../components/NeedCard";
import howPostImg from "../assets/how-post.png";
import howChatImg from "../assets/how-chat.png";
import howImpactImg from "../assets/how-impact.png";
import { HiOutlineArrowRight } from "react-icons/hi2";
import SectionBanner from "../components/common/SectionBanner";
import { isAdminUser } from "../utils/auth";
import { useLanguage } from "../language/useLanguage";
import "../styles/pages/Home.css";

export default function Home() {
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    availableItems: 0,
    needLists: 0,
    completedDonations: 0,
  });

  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");
  const userType = localStorage.getItem("userType");
  const isAdmin = isAdminUser();
  const { t } = useLanguage();

  const primaryActionPath = isAdmin
    ? "/admin/verifications"
    : userType === "organization"
      ? "/postneed"
      : "/postdonation";

  const primaryActionLabel = isAdmin
    ? t("home.adminAction")
    : userType === "organization"
      ? t("home.organizationAction")
      : t("home.donorAction");

  useEffect(() => {
    async function loadFeed() {
      try {
        const { response, data } = await apiFetch("/home/feed");

        if (response.ok && Array.isArray(data)) {
          setRecentItems(data.slice(0, 5));
        } else {
          setRecentItems([]);
        }
      } catch (err) {
        console.error("Feed error:", err);
        setRecentItems([]);
      } finally {
        setLoading(false);
      }
    }

    async function loadStats() {
      try {
        const { response, data } = await apiFetch("/home/stats");

        if (response.ok && data) {
          setStats({
            availableItems: data.available_items ?? 0,
            needLists: data.need_lists ?? 0,
            completedDonations: data.completed_donations ?? 0,
          });
        }
      } catch (err) {
        console.error("Stats error:", err);
      }
    }

    loadFeed();
    loadStats();
  }, []);

  function handleItemCheck() {}

  async function handleReserveDonation(id, newStatus) {
    try {
      const params = new URLSearchParams({ new_status: newStatus });
      if (userEmail) params.set("user_email", userEmail);

      const { response, data } = await apiFetch(`/donations/${id}/status?${params.toString()}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        alert(data?.detail || "Could not update donation status.");
        return;
      }

      setRecentItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id && item.item_type === "donation"
            ? { ...data, item_type: "donation" }
            : item
        )
      );
    } catch (err) {
      console.error("Network error:", err);
      alert(t("donations.networkError"));
    }
  }

  return (
    <div className="home-page">
      <SectionBanner
        title={t("home.title")}
        subtitle={t("home.subtitle")}
        actions={
          <button
            onClick={() => navigate(primaryActionPath)}
            className="home-banner-action"
          >
            {primaryActionLabel}
          </button>
        }
        stats={[
          { value: stats.availableItems, label: t("home.availableItems") },
          { value: stats.needLists, label: t("home.needLists") },
          { value: stats.completedDonations, label: t("home.completedDonations") },
        ]}
      />

      <div className="home-content">
        <section className="home-steps-section">
          <div className="home-section-header">
            <h2>{t("home.stepsTitle")}</h2>
            <p>{t("home.stepsSubtitle")}</p>
          </div>

          <div className="home-steps-grid">
            <StepCard
              image={howPostImg}
              title={t("home.stepPostTitle")}
              text={t("home.stepPostText")}
            />

            <StepCard
              image={howChatImg}
              title={t("home.stepChatTitle")}
              text={t("home.stepChatText")}
            />

            <StepCard
              image={howImpactImg}
              title={t("home.stepImpactTitle")}
              text={t("home.stepImpactText")}
            />
          </div>
        </section>

        <section className="home-recent-section">
          <div className="home-recent-header">
            <div>
              <h2>{t("home.recentlyAdded")}</h2>
              <p>{t("home.recentlyAddedSubtitle")}</p>
            </div>
          </div>

          {loading ? (
            <div className="home-loading-box">{t("home.loading")}</div>
          ) : recentItems.length === 0 ? (
            <div className="home-loading-box">{t("home.empty")}</div>
          ) : (
            <div className="home-recent-grid">
              {recentItems.map((item) =>
                item.item_type === "donation" ? (
                  <DonationCard
                    key={`don-${item.id}`}
                    donation={item}
                    onReserve={handleReserveDonation}
                    currentUserEmail={userEmail}
                    isOwner={userEmail === item.owner_email}
                  />
                ) : (
                  <NeedCard
                    key={`need-${item.id}`}
                    need={item}
                    onItemCheck={handleItemCheck}
                    currentUserEmail={userEmail}
                    isOwner={userEmail === item.organization_email}
                  />
                )
              )}

              <div className="home-view-all-card" onClick={() => navigate("/donations")}>
                <div className="home-view-all-icon">
                  <HiOutlineArrowRight size={28} />
                </div>
                <h3>{t("home.viewAll")}</h3>
                <p>{t("home.exploreAll")}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StepCard({ image, title, text }) {
  return (
    <div className="home-step-card">
      <div className="home-step-image-wrap">
        <img src={image} alt={title} />
      </div>

      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
