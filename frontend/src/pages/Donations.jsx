import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DonationCard from "../components/DonationCard";
import { apiFetch } from "../api/api";
import ListingPage from "../components/common/ListingPage";
import { donationCategories } from "../constants/donationCategories";
import { isAdminUser } from "../utils/auth";
import { useLanguage } from "../language/useLanguage";

export default function Donations() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");
  const isAdmin = isAdminUser();
  const { t } = useLanguage();

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
        alert(data?.detail || t("donations.updateError"));
        return;
      }

      setItems((prev) => prev.map((item) => (item.id === id ? data : item)));
    } catch (err) {
      console.error("Network error:", err);
      alert(t("donations.networkError"));
    }
  }

  const categories = [{ value: "all", label: t("donations.allCategories") }, ...donationCategories];

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

  return (
    <ListingPage
      title={t("donations.title")}
      subtitle={t("donations.subtitle")}
      loading={loading}
      loadingText={t("donations.loading")}
      searchValue={q}
      searchPlaceholder={t("donations.search")}
      onSearchChange={setQ}
      action={
        !isAdmin && (
          <button onClick={() => navigate("/postdonation")} className="listing-add-button">
            {t("donations.add")}
          </button>
        )
      }
      filters={
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
      }
      hasResults={filteredItems.length > 0}
      emptyTitle={t("donations.emptyTitle")}
      emptyText={t("donations.emptyText")}
    >
      {filteredItems.map((donation) => (
        <DonationCard
          key={donation.id}
          donation={donation}
          onReserve={reserveDonation}
          currentUserEmail={userEmail}
          isOwner={userEmail === donation.owner_email}
          isAdmin={isAdmin}
        />
      ))}
    </ListingPage>
  );
}
