import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionBanner from "../components/common/SectionBanner";
import PageToolbar from "../components/common/PageToolbar";
import NeedCard from "../components/NeedCard";
import { apiFetch } from "../api/api";
import { colors, radius, shadow } from "../styles/theme";

export default function Needs() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");

  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    async function loadPageData() {
      try {
        const { data: needsData } = await apiFetch("/needs/");
        setItems(needsData);

        if (userEmail) {
          const { data: userData } = await apiFetch(`/auth/user/${userEmail}`);
          setUserType(userData.user_type);
        }
      } catch (err) {
        console.error("Eroare la încărcare:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPageData();
  }, [userEmail]);

  async function handleItemCheck(needId, itemIndex, newBrought) {
    try {
      const { response, data } = await apiFetch(
        `/needs/${needId}/item/${itemIndex}?brought=${newBrought}`,
        { method: "PATCH" }
      );

      if (!response.ok) {
        alert("Error updating item.");
        return;
      }

      setItems((prev) => prev.map((item) => (item.id === needId ? data : item)));
    } catch (err) {
      console.error("Network error:", err);
      alert("Failed to update item.");
    }
  }

  const filteredItems = useMemo(() => {
    const query = q.trim().toLowerCase();

    return items.filter((item) => {
      return (
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.organization_email.toLowerCase().includes(query) ||
        item.items.some((needItem) => needItem.name.toLowerCase().includes(query))
      );
    });
  }, [items, q]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", color: colors.blueDark, marginTop: 100 }}>
        <h3>Loading needs...</h3>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>

    <div style={{
      background: colors.yellowLight, // Fundalul galben pastelat pentru nevoi
      padding: "35px 40px",
      borderRadius: radius.xl,
      marginTop: "20px",
      marginBottom: "30px",
      boxShadow: shadow.soft
    }}>
      <h2 style={{ margin: 0, fontSize: "28px", color: "#856404", fontWeight: 800 }}>
        Requirements lists
      </h2>
      <p style={{ margin: "8px 0 0 0", color: "#856404", opacity: 0.8, fontWeight: 500 }}>
        Browse organization needs and check items you can bring
      </p>
    </div>


      {/* Toolbar cu butonul galben (Yellow theme) */}
      <div style={{ marginBottom: "30px" }}>
        <PageToolbar
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title, location, or item..."
          showButton={userType === "organization"}
          buttonText="+ Post Need"
          onButtonClick={() => navigate("/postneed")}
          // Pasăm un stil extra pentru buton dacă PageToolbar permite customizarea stilului
          // Dacă PageToolbar are stilul hardcoded albastru, va trebui să modifici în interiorul componentei PageToolbar.jsx
          buttonStyle={{
            backgroundColor: colors.yellow,
            color: "#856404",
            border: "none",
            borderRadius: radius.md,
            fontWeight: "700"
          }}
        />
      </div>

      {/* Grid-ul cu Carduri */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 24,
          paddingBottom: "80px",
        }}
      >
        {filteredItems.map((need) => (
          <NeedCard
            key={need.id}
            need={need}
            onItemCheck={handleItemCheck}
            currentUserEmail={userEmail}
            isOwner={userEmail === need.organization_email}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div style={{ marginTop: 50, color: colors.muted, textAlign: "center" }}>
          <p style={{ fontSize: "18px", fontWeight: 500 }}>No needs found. Try a different search.</p>
        </div>
      )}
    </div>
  );
}