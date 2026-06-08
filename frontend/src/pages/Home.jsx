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

  const primaryActionPath = isAdmin
    ? "/admin/verifications"
    : userType === "organization"
      ? "/postneed"
      : "/postdonation";

  const primaryActionLabel = isAdmin
    ? "Open admin panel"
    : userType === "organization"
      ? "Post a requirements list"
      : "Donate an item";

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
      alert("Could not contact the server.");
    }
  }

  return (
    <div className="home-page">
      <SectionBanner
        title="Give your items a second life"
        subtitle="Donate things you no longer need, support local organizations, and make a real impact in your community."
        actions={
          <button
            onClick={() => navigate(primaryActionPath)}
            className="home-banner-action"
          >
            {primaryActionLabel}
          </button>
        }
        stats={[
          { value: stats.availableItems, label: "Available items" },
          { value: stats.needLists, label: "Need lists" },
          { value: stats.completedDonations, label: "Completed donations" },
        ]}
      />

      <div className="home-content">
        <section className="home-steps-section">
          <div className="home-section-header">
            <h2>Donate in 3 simple steps</h2>
            <p>A simple process for donors, recipients, and organizations.</p>
          </div>

          <div className="home-steps-grid">
            <StepCard
              image={howPostImg}
              title="Post your item or check need lists"
              text="Upload an item you no longer need and make it visible to people and organizations."
            />

            <StepCard
              image={howChatImg}
              title="Connect in chat"
              text="Use direct messages to discuss details, availability, and pickup."
            />

            <StepCard
              image={howImpactImg}
              title="Make an impact"
              text="Complete the handoff and help reduce waste in your local community."
            />
          </div>
        </section>

        <section className="home-recent-section">
          <div className="home-recent-header">
            <div>
              <h2>Recently added</h2>
              <p>A quick preview of the latest activity on the platform.</p>
            </div>
          </div>

          {loading ? (
            <div className="home-loading-box">Loading recent activity...</div>
          ) : recentItems.length === 0 ? (
            <div className="home-loading-box">No recent activity yet.</div>
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
                <h3>View All</h3>
              <p>Explore all donations</p>
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
