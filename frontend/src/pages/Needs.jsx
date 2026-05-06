import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionBanner from "../components/common/SectionBanner";
import PageToolbar from "../components/common/PageToolbar";
import NeedCard from "../components/NeedCard";
import { apiFetch } from "../api/api";
import { colors } from "../styles/theme";

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
      <div style={{ textAlign: "center", color: colors.muted, marginTop: 60 }}>
        <h3>Loading needs...</h3>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {userType === "organization" && (
        <button className="fab" onClick={() => navigate("/postneed")} title="Post New Need">
          +
        </button>
      )}

      <div className="pattern-bg" style={{ minHeight: "100vh", paddingBottom: "100px" }}>
        <SectionBanner
          title="Requirements lists"
          subtitle="Browse organization needs and check items you can bring"
          background={colors.yellow}
          color={colors.text}
        />

        <p style={{ color: colors.muted, marginTop: 6 }}>
          Organizations have posted lists of items they need.
        </p>

        <PageToolbar
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title, location, organization, or item..."
          showButton={userType === "organization"}
          buttonText="+ Post Need"
          onButtonClick={() => navigate("/postneed")}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20,
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
          <div style={{ marginTop: 30, color: colors.muted, textAlign: "center" }}>
            <p>No needs found. Try a different search.</p>
          </div>
        )}
      </div>
    </div>
  );
}