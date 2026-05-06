import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionBanner from "../components/common/SectionBanner";
import PageToolbar from "../components/common/PageToolbar";
import DonationCard from "../components/DonationCard";
import { apiFetch } from "../api/api";
import { colors } from "../styles/theme";

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
        const { data } = await apiFetch("/donations/");
        setItems(data);
      } catch (err) {
        console.error("Eroare la încărcarea donațiilor:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDonations();
  }, []);

  async function reserveDonation(id, newStatus) {
    try {
      const { response } = await apiFetch(`/donations/${id}/status?new_status=${newStatus}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        alert("Eroare la actualizarea statusului.");
        return;
      }

      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      console.error("Eroare de rețea:", err);
      alert("Nu s-a putut contacta serverul.");
    }
  }

  const categories = useMemo(() => {
    return ["all", ...new Set(items.map((item) => item.category))];
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = q.trim().toLowerCase();

    return items.filter((item) => {
      const notMine = !userEmail || item.owner_email !== userEmail;
      const matchesText =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query);
      const matchesCategory = category === "all" || item.category === category;

      return notMine && matchesText && matchesCategory;
    });
  }, [items, q, category, userEmail]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", color: colors.muted, marginTop: 60 }}>
        <h3>Loading donations...</h3>
      </div>
    );
  }

  return (
    <div>
      <SectionBanner
        title="Donations"
        subtitle="Donate your old items or browse for things you need"
        background={colors.babyBlue}
        color={colors.text}
      />

      <p style={{ color: colors.muted, marginTop: 6 }}>
        Items available from donors in your area.
      </p>

      <PageToolbar
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by title or location..."
        showSelect={true}
        selectValue={category}
        onSelectChange={(e) => setCategory(e.target.value)}
        options={categories}
        buttonText="+ Add donation"
        onButtonClick={() => navigate("/postdonation")}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 20,
        }}
      >
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

      {filteredItems.length === 0 && (
        <div style={{ marginTop: 30, color: colors.muted, textAlign: "center" }}>
          <p>No donations found. Try a different search or category.</p>
        </div>
      )}
    </div>
  );
}