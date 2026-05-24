import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageToolbar from "../components/common/PageToolbar";
import DonationCard from "../components/DonationCard";
import { apiFetch } from "../api/api";
import { colors, radius, shadow } from "../styles/theme"; // <-- REPARAT: Am importat radius și shadow

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
      const matchesText =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query);
      const matchesCategory = category === "all" || item.category === category;

      // Regulă de consistență: pe paginile publice arătăm doar ce este activ (available sau reserved)
      const isStillActive = item.status === "available" || item.status === "reserved";

      return matchesText && matchesCategory && isStillActive;
    });
  }, [items, q, category]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", color: colors.muted, marginTop: 60 }}>
        <h3>Loading donations...</h3>
      </div>
    );
  }

  return (
    <div>
      {/* BANNER FLUID REPARAT COMPATIBIL CU STILUL "WHAT'S NEW" */}
      <div style={{
        background: colors.blueLight,
        padding: "35px 40px",
        borderRadius: radius.xl,
        marginTop: "20px",
        marginBottom: "30px",
        boxShadow: shadow.soft
      }}>
        <h2 style={{ margin: 0, fontSize: "28px", color: colors.text, fontWeight: 800 }}>
          Donations
        </h2>
        <p style={{ margin: "8px 0 0 0", color: colors.text, opacity: 0.8, fontWeight: 500 }}>
          Donate your old items or browse for things you need
        </p>
      </div>



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

      {filteredItems.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 20,
            marginTop: 20
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
      ) : (
        /* ADAUGAT: Căsuță de informare tip "Empty State" în caz că nu se găsesc donații */
        <div style={{
          textAlign: "center",
          padding: "50px 20px",
          backgroundColor: colors.card,
          borderRadius: radius.xl,
          border: `1px solid ${colors.border}`,
          boxShadow: shadow.soft,
          color: colors.muted,
          marginTop: 20
        }}>
          <p style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>
            No active donations found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
}