import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import DonationCard from "../components/DonationCard.jsx";
import NeedCard from "../components/NeedCard.jsx";
import PageToolbar from "../components/common/PageToolbar";
import { colors } from "../styles/theme";

export default function Home() {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadFeed() {
      try {
        const { response, data } = await apiFetch("/home/feed");
        if (response.ok) {
          setFeedItems(data);
        }
      } catch (err) {
        console.error("Feed error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, []);

  const filteredItems = feedItems.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ padding: 50, textAlign: "center" }}>Se încarcă noutățile...</div>;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
      <header style={{ marginBottom: 30 }}>
        <h1 style={{ color: colors.blue, marginBottom: 5 }}>Descoperă în Iași</h1>
        <p style={{ color: "#64748b" }}>Vezi cine oferă și cine are nevoie de ajutor în comunitatea ta.</p>
      </header>

      <PageToolbar
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Caută în donații sau nevoi..."
        buttonText="+ Adaugă ceva"
        onButtonClick={() => { /* Navighează spre alegere tip postare */ }}
      />

      <div style={styles.grid}>
        {filteredItems.map((item) => {
          if (item.item_type === "donation") {
            return (
              <DonationCard
                key={`don-${item.id}`}
                donation={item}
              />
            );
          } else {
            return (
              <NeedCard
                key={`need-${item.id}`}
                need={item}
              />
            );
          }
        })}
      </div>

      {filteredItems.length === 0 && (
        <div style={{ textAlign: "center", padding: 50, color: "#94a3b8" }}>
          Nu am găsit nimic care să corespundă căutării tale.
        </div>
      )}
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px",
    paddingBottom: "50px",
  },
};