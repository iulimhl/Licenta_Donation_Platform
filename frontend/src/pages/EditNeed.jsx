import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/api";
import { colors, radius, shadow } from "../styles/theme";

export default function EditNeed() {
  const navigate = useNavigate();
  const { id } = useParams();
  const userEmail = localStorage.getItem("userEmail");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // AM ELIMINAT "image" de aici
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
  });

  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({ name: "", quantity: 1 });

  useEffect(() => {
    if (!userEmail) {
      navigate("/login");
      return;
    }

    const loadNeed = async () => {
      try {
        const { data } = await apiFetch(`/needs/${id}`);

        if (data.organization_email !== userEmail) {
          alert("You can only edit your own needs.");
          navigate("/profile");
          return;
        }

        // AM ELIMINAT setarea pentru "image" de aici
        setFormData({
          title: data.title || "",
          description: data.description || "",
          location: data.location || "",
        });

        setItems(data.items || []);
      } catch (err) {
        console.error("Error loading need:", err);
        alert("Could not load need.");
        navigate("/profile");
      } finally {
        setChecking(false);
      }
    };

    loadNeed();
  }, [id, userEmail, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem((prev) => ({
      ...prev,
      [name]: name === "quantity" ? parseInt(value) || 1 : value,
    }));
  };

  const addItem = () => {
    if (currentItem.name.trim()) {
      setItems([...items, { ...currentItem, brought: 0 }]);
      setCurrentItem({ name: "", quantity: 1 });
    } else {
      alert("Enter item name");
    }
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.location || items.length === 0) {
      alert("Fill all fields");
      return;
    }

    setLoading(true);

    try {
      const { response } = await apiFetch(`/needs/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...formData, // Trimite doar titlu, descriere și locație
          items,
        }),
      });

      if (response.ok) {
        alert("Need updated successfully!");
        navigate("/profile");
      } else {
        alert("Error updating need");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <div style={{ textAlign: "center", marginTop: 100, color: colors.blueDark, fontWeight: 600 }}>Loading...</div>;
  }

  return (
    <div className="pattern-bg" style={{ minHeight: "100vh", padding: "40px 20px", backgroundColor: colors.bg }}>

      <div style={{ maxWidth: "520px", width: "100%", margin: "0 auto" }}>

        {/* HEADER */}
        <div style={{
          background: colors.yellowLight,
          padding: "26px 20px",
          borderRadius: radius.xl,
          marginBottom: "24px",

          boxShadow: shadow.soft,
          textAlign: "center"
        }}>
          <h1 style={{ margin: 0, fontSize: "24px", color: "#856404", fontWeight: 800 }}>
            Edit need
          </h1>
          <p style={{ margin: "6px 0 0 0", color: "#856404", opacity: 0.8, fontSize: "14px", fontWeight: 500 }}>
            Update your list of requirements
          </p>
        </div>

        {/* CARD FORMULAR */}
        <div style={{
          backgroundColor: colors.card,
          padding: "32px",
          borderRadius: radius.xl,
          boxShadow: shadow.card,
          border: `1px solid ${colors.border}`
        }}>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>

            <div>
              <label style={labelStyle}>Title *</label>
              <input
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Location *</label>
              <input
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={{ ...inputStyle, resize: "vertical", height: "90px" }}
              />
            </div>

            {/* BLOCUL PENTRU IMAGINE A FOST ȘTERS DE AICI */}

            {/* STRUCUTRA ADĂUGARE PRODUSE */}
            <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: "16px" }}>
              <label style={labelStyle}>Items *</label>

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  type="text"
                  value={currentItem.name}
                  onChange={handleItemChange}
                  name="name"
                  placeholder="Item name"
                  style={{ ...inputStyle, padding: "10px 14px" }}
                />
                <input
                  type="number"
                  value={currentItem.quantity}
                  onChange={handleItemChange}
                  name="quantity"
                  min="1"
                  style={{ ...inputStyle, width: "75px", padding: "10px" }}
                />
                <button
                  type="button"
                  onClick={addItem}
                  style={{
                    padding: "10px 16px",
                    background: colors.blueDark,
                    color: colors.white,
                    border: "none",
                    borderRadius: radius.md,
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  Add Item
                </button>
              </div>

              {/* LISTA ITEME */}
              {items.length > 0 && (
                <div style={{ display: "grid", gap: 8, marginTop: "12px" }}>
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        background: colors.blueLight,
                        borderRadius: radius.md,
                        border: `1px solid ${colors.border}`
                      }}
                    >
                      <span style={{ fontSize: 13, color: colors.text, fontWeight: 600 }}>
                        {item.name} <span style={{ color: colors.muted, marginLeft: "4px" }}>× {item.quantity}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        style={{
                          background: colors.danger,
                          color: colors.white,
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: radius.sm,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BUTON SALVARE */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "10px",
                padding: "14px 16px",
                borderRadius: radius.md,
                border: "none",
                background: colors.blueDark,
                color: colors.white,
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
                opacity: loading ? 0.5 : 1,
                boxShadow: shadow.soft
              }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontWeight: 600,
  color: colors.text,
  fontSize: 13
};

const inputStyle = {
  padding: "12px 14px",
  borderRadius: radius.md,
  border: `2px solid ${colors.border}`,
  background: colors.bg,
  color: colors.text,
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  fontFamily: "inherit"
};