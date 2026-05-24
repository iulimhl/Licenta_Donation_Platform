import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import DonationCard from "../components/DonationCard.jsx";
import NeedCard from "../components/NeedCard.jsx";
import PageToolbar from "../components/common/PageToolbar";
import { colors, radius, shadow } from "../styles/theme";

export default function Home() {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAddMenu, setShowAddMenu] = useState(false);

  const navigate = useNavigate();
  const menuRef = useRef(null);

  const userType = localStorage.getItem("userType");
  const userEmail = localStorage.getItem("userEmail");

  const categories = ["All", "Clothing", "Food", "Electronics", "Furniture", "Medical", "Other"];

  useEffect(() => {
    async function loadFeed() {
      try {
        const { response, data } = await apiFetch("/home/feed");
        if (response.ok) setFeedItems(data);
      } catch (err) {
        console.error("Feed error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFeed();

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleItemCheck(needId, itemIndex, newBrought) {
    try {
      const { response, data } = await apiFetch(
        `/needs/${needId}/item/${itemIndex}?brought=${newBrought}`,
        { method: "PATCH" }
      );

      if (response.ok) {
        setFeedItems((prev) =>
          prev.map((item) =>
            item.item_type === "need" && item.id === needId
              ? { ...data, item_type: "need" }
              : item
          )
        );
      }
    } catch (err) {
      console.error("Error updating item on Home:", err);
    }
  }

  async function handleReserveDonation(id, newStatus) {
    try {
      const { response } = await apiFetch(`/donations/${id}/status?new_status=${newStatus}`, {
        method: "PATCH",
      });

      if (response.ok) {
        setFeedItems((prev) =>
          prev.map((item) =>
            item.item_type === "donation" && item.id === id
              ? { ...item, status: newStatus }
              : item
          )
        );
      } else {
        alert("Error updating donation status.");
      }
    } catch (err) {
      console.error("Error updating donation status on Home:", err);
    }
  }

  const filteredItems = feedItems.filter((item) => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase());

    // REPARAT: Normalizăm stringurile pentru a evita problemele de tip "clothes" vs "Clothing"
    const itemCat = item.category?.toLowerCase() || "";
    const selCat = selectedCategory.toLowerCase();

    const matchesCategory = selectedCategory === "All" ||
                            itemCat === selCat ||
                            (selCat === "clothing" && itemCat === "clothes");

    const isStillActive = item.item_type === "donation"
      ? (item.status === "available" || item.status === "reserved")
      : true;

    return matchesSearch && matchesCategory && isStillActive;
  });

  const handleAddClick = () => {
    if (userType === "organization") {
      setShowAddMenu(!showAddMenu);
    } else {
      navigate("/postdonation");
    }
  };

  if (loading) return <div style={{ padding: 100, textAlign: "center", color: colors.blueDark }}>Loading...</div>;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>

      {/* BANNER ALBASTRU */}
      <div style={{
        background: colors.blueLight, padding: "35px 40px", borderRadius: radius.xl,
        marginTop: "20px", marginBottom: "30px", boxShadow: shadow.soft
      }}>
        <h2 style={{ margin: 0, fontSize: "28px", color: colors.blueDark, fontWeight: 800 }}>
          What's new
        </h2>
        <p style={{ margin: "8px 0 0 0", color: colors.blueDark, opacity: 0.8, fontWeight: 500 }}>
          Discover items for donation and needs lists
        </p>
      </div>

      <div style={{ position: "relative" }}>
        <PageToolbar
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search items..."
          buttonText="+ Add"
          onButtonClick={handleAddClick}
        />

        {showAddMenu && (
          <div ref={menuRef} style={{
            position: "absolute", right: 0, top: "65px", zIndex: 1000,
            backgroundColor: colors.card, borderRadius: radius.md,
            boxShadow: shadow.card, border: `1px solid ${colors.border}`,
            padding: "8px", width: "200px", display: "grid", gap: "4px"
          }}>
            <button
              onClick={() => { navigate("/postdonation"); setShowAddMenu(false); }}
              style={menuItemStyle}
              onMouseOver={(e) => e.target.style.background = colors.blueLight}
              onMouseOut={(e) => e.target.style.background = "transparent"}
            >
              Post donation
            </button>
            <button
              onClick={() => { navigate("/postneed"); setShowAddMenu(false); }}
              style={{ ...menuItemStyle, color: "#a16207" }}
              onMouseOver={(e) => e.target.style.background = colors.yellowLight}
              onMouseOut={(e) => e.target.style.background = "transparent"}
            >
              Post need list
            </button>
          </div>
        )}
      </div>

      {/* CATEGORY PILLS */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "30px", marginTop: "10px", flexWrap: "wrap" }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "8px 16px", borderRadius: radius.xl, border: "none",
              cursor: "pointer", fontWeight: "600", fontSize: "13px",
              backgroundColor: selectedCategory === cat ? colors.blueDark : colors.blueLight,
              color: selectedCategory === cat ? colors.white : colors.blueDark,
              transition: "0.2s"
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* GRID MIXT FEED */}
      {filteredItems.length > 0 ? (
        <div style={gridStyle}>
          {filteredItems.map((item) => (
            item.item_type === "donation"
              ? <DonationCard
                  key={`don-${item.id}`}
                  donation={item}
                  onReserve={handleReserveDonation}
                  currentUserEmail={userEmail}
                  isOwner={userEmail === item.owner_email}
                />
              : <NeedCard
                  key={`need-${item.id}`}
                  need={item}
                  onItemCheck={handleItemCheck}
                  currentUserEmail={userEmail}
                  isOwner={userEmail === item.organization_email}
                />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: "center",
          padding: "50px 20px",
          backgroundColor: colors.card,
          borderRadius: radius.xl,
          border: `1px solid ${colors.border}`,
          boxShadow: shadow.soft,
          color: colors.muted,
          marginTop: "10px"
        }}>
          <p style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>
            No active donations or need lists found in "{selectedCategory}".
          </p>
        </div>
      )}
    </div>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "24px",
  paddingBottom: "80px",
};

const menuItemStyle = {
  padding: "12px", border: "none", borderRadius: radius.sm,
  backgroundColor: "transparent", textAlign: "left", cursor: "pointer",
  fontWeight: "600", fontSize: "14px", color: colors.blueDark, transition: "0.2s",
};