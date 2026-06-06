import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DonationCard from "../components/DonationCard";
import { apiFetch } from "../api/api";
import SectionBanner from "../components/common/SectionBanner";
import { donationCategories } from "../constants/donationCategories";
import "../styles/listingPages.css";

export default function Donations() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");

  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDonations() {
      try {
        const { response, data } = await apiFetch("/donations/");

        if (response.ok) {
          setItems(data || []);
        }
      } catch (err) {
        console.error("Donation loading error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDonations();
  }, []);

  async function reserveDonation(id, newStatus) {
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

      setItems((prev) => prev.map((item) => (item.id === id ? data : item)));
    } catch (err) {
      console.error("Network error:", err);
      alert("Could not contact the server.");
    }
  }

  const categories = [{ value: "all", label: "All categories" }, ...donationCategories];

  const filteredItems = useMemo(() => {
    const query = q.trim().toLowerCase();

    return items.filter((item) => {
      const matchesText =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.location?.toLowerCase().includes(query);

      const itemCategory = (item.category || "").toLowerCase();
      const matchesCategory = category === "all" || itemCategory === category;
      const isStillActive =
        item.status?.toLowerCase() === "available" ||
        item.status?.toLowerCase() === "reserved";

      return matchesText && matchesCategory && isStillActive;
    });
  }, [items, q, category]);

  if (loading) {
    return (
      <div className="listing-loading">
        <h3>Loading donations...</h3>
      </div>
    );
  }

  return (
    <div className="listing-page">
      <SectionBanner
        title="Donations"
        subtitle="Browse available donated items or post something you no longer need."
      />

      <div className="listing-shell">
        <div className="listing-toolbar">
          <div className="listing-toolbar-row with-action">
            <div className="listing-search-wrap">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title or location..."
                className="listing-search-input"
              />
            </div>

            <button
              onClick={() => navigate("/postdonation")}
              className="listing-add-button"
            >
              + Add donation
            </button>
          </div>

          <div className="donations-categories">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`donations-category-button ${category === cat.value ? "active" : ""}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="listing-results">
          {filteredItems.length > 0 ? (
            <div className="listing-grid">
              {filteredItems.map((donation) => (
                <DonationCard
                  key={donation.id}
                  donation={donation}
                  onReserve={reserveDonation}
                  currentUserEmail={userEmail}
                  isOwner={userEmail === donation.owner_email}
                />
              ))}
            </div>
          ) : (
            <div className="listing-empty-state">
              <h3>No donations found</h3>
              <p>Try another search, choose a different category, or post a new donation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
