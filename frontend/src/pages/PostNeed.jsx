import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import { colors, radius, shadow } from "../styles/theme";

export default function PostNeed() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const userEmail = localStorage.getItem("userEmail");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    image: "",
    lat: null,
    lng: null
  });

  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({ name: "", quantity: 1 });

  useEffect(() => {
    if (!userEmail) {
      navigate("/login");
      return;
    }

    apiFetch(`/auth/user/${userEmail}`)
      .then(({ data }) => {
        setChecking(false);
        if (data.user_type !== "organization") {
          navigate("/needs");
        }
      })
      .catch((err) => {
        console.error("Error:", err);
        setChecking(false);
        navigate("/login");
      });
  }, [userEmail, navigate]);

  const addItem = () => {
    if (currentItem.name.trim()) {
      setItems([...items, { ...currentItem }]);
      setCurrentItem({ name: "", quantity: 1 });
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          location: data.display_name || "Detected location",
          lat: latitude,
          lng: longitude
        }));
      } catch (err) { console.error(err); }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return alert("Please add at least one item to the list.");
    setLoading(true);

    try {
      const { response } = await apiFetch("/needs/", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          organization_email: userEmail,
          items: items.map((item) => ({ ...item, brought: 0 })),
        }),
      });

      if (response.ok) {
        navigate("/needs");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <div style={{ padding: 100, textAlign: "center", color: colors.blueDark }}>Checking permissions...</div>;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, padding: "40px 20px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        {/* Banner Galben - Tema Needs */}
        <div style={{
          background: colors.yellowLight, padding: "30px 40px", borderRadius: radius.xl,
          marginBottom: "30px", boxShadow: shadow.soft
        }}>
          <h2 style={{ margin: 0, fontSize: "28px", color: "#856404", fontWeight: 800 }}>Post a requirement list</h2>
          <p style={{ margin: "8px 0 0 0", color: "#856404", opacity: 0.8, fontWeight: 500 }}>
            Tell the community what your organization needs
          </p>
        </div>

        <div style={{ backgroundColor: colors.card, padding: "40px", borderRadius: radius.xl, boxShadow: shadow.card, border: `1px solid ${colors.border}` }}>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input
                name="title" type="text" placeholder="e.g., School supplies"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Location *</label>
              <input
                name="location" type="text" placeholder="e.g. Copou, Iași"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                required style={inputStyle}
              />
              <button type="button" onClick={handleUseMyLocation} style={secondaryButtonStyle}> Use my current location</button>
            </div>

            <div>
              <label style={labelStyle}>Add items to list *</label>
              <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
                <input
                  type="text" placeholder="Item name"
                  value={currentItem.name}
                  onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})}
                  style={{...inputStyle, flex: 2}}
                />
                <input
                  type="number" value={currentItem.quantity}
                  onChange={(e) => setCurrentItem({...currentItem, quantity: parseInt(e.target.value) || 1})}
                  style={{...inputStyle, flex: 1}}
                />
                <button
                  type="button" onClick={addItem}
                  style={{ padding: "0 20px", backgroundColor: colors.blueDark, color: "#fff", border: "none", borderRadius: radius.md, cursor: "pointer", fontWeight: 700 }}
                >
                  Add
                </button>
              </div>

              {/* Lista de iteme adăugate */}
              <div style={{ display: "grid", gap: 8 }}>
                {items.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "10px 15px", background: colors.bg, borderRadius: radius.md, border: `1px solid ${colors.border}` }}>
                    <span style={{ fontWeight: 600, color: colors.text }}>
                      {item.name} <small style={{ color: colors.muted }}>x{item.quantity}</small>
                    </span>
                    <button
                      type="button"
                      onClick={() => setItems(items.filter((_, i) => i !== idx))}
                      style={{ color: colors.danger, border: "none", background: "none", cursor: "pointer", fontWeight: 700 }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} style={primaryButtonStyle}>
              {loading ? "Posting..." : "Post Requirements"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 8,
  fontSize: 14,
  fontWeight: 600,
  color: "#2f3b52"
};

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "12px",
  border: `2px solid #dbeafe`,
  backgroundColor: "#f8fbff",
  outline: "none",
  boxSizing: "border-box"
};

const primaryButtonStyle = {
  padding: "16px",
  backgroundColor: "#a16207", // Maro auriu pentru tema galbenă
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  fontWeight: "800",
  fontSize: "16px",
  cursor: "pointer",
  marginTop: 10,
  boxShadow: "0 4px 12px rgba(161, 98, 7, 0.2)"
};

const secondaryButtonStyle = {
                  marginTop: "12px", padding: "12px", borderRadius: radius.md, border: "none",
                  backgroundColor: colors.yellowLight, color: "#856404",
                  fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                 };