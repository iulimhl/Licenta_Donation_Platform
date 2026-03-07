import { useMemo, useState } from "react";
import { donations as initial } from "../data/mock";
import DonationCard from "../components/DonationCard";

export default function Home() {
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");

  function reserveDonation(id) {
    setItems(items.map((d) => (d.id === id ? { ...d, status: "reserved" } : d)));
  }

  const categories = useMemo(() => {
    const set = new Set(items.map((x) => x.category));
    return ["all", ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((d) => {
      const matchesQ =
        !query ||
        d.title.toLowerCase().includes(query) ||
        d.location.toLowerCase().includes(query);

      const matchesCat = category === "all" || d.category === category;
      return matchesQ && matchesCat;
    });
  }, [items, q, category]);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Donations Feed</h2>
      <p style={{ color: "#aaa", marginTop: 6 }}>
        Browse donations posted by users. Reserve items you need.
      </p>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          margin: "14px 0",
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title or location..."
          style={{
            minWidth: 260,
            flex: 1,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #333",
            background: "#111",
            color: "#fff",
            outline: "none",
          }}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #333",
            background: "#111",
            color: "#fff",
            outline: "none",
          }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Grid like Vinted */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
        {filtered.map((d) => (
          <DonationCard key={d.id} donation={d} onReserve={reserveDonation} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ marginTop: 20, color: "#aaa" }}>
          No results. Try another search/category.
        </div>
      )}
    </div>
  );
}