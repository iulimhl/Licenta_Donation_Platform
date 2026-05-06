import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function EditNeed() {
  const navigate = useNavigate();
  const { id } = useParams();
  const userEmail = localStorage.getItem("userEmail");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    image: "",
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

        setFormData({
          title: data.title || "",
          description: data.description || "",
          location: data.location || "",
          image: data.image || "",
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
          ...formData,
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
    return <div style={{ textAlign: "center", marginTop: 60 }}>Loading...</div>;
  }

  return (
    <div className="pattern-bg" style={{ minHeight: "100vh", padding: "40px 20px" }}>
      <div
        className="glass-container"
        style={{
          marginBottom: "24px",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontSize: "2rem",
            fontWeight: 700,
          }}
        >
          Edit Need
        </h1>
        <p
          style={{
            margin: "8px 0 0 0",
            color: "#64748b",
          }}
        >
          Update your organization need
        </p>
      </div>

      <div style={{ maxWidth: 500, width: "100%" }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#334155", fontSize: 13 }}>
              Title *
            </label>
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
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#334155", fontSize: 13 }}>
              Location *
            </label>
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
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#334155", fontSize: 13 }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              style={{ ...inputStyle, resize: "vertical", height: "80px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#334155", fontSize: 13 }}>
              Image URL
            </label>
            <input
              name="image"
              type="text"
              value={formData.image}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#334155", fontSize: 13 }}>
              Items *
            </label>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                value={currentItem.name}
                onChange={handleItemChange}
                name="name"
                placeholder="Item name"
                className="modern-input"
              />
              <input
                type="number"
                value={currentItem.quantity}
                onChange={handleItemChange}
                name="quantity"
                min="1"
                className="modern-input"
                style={{ width: "80px" }}
              />
              <button
                type="button"
                onClick={addItem}
                style={{
                  padding: "12px 16px",
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Add Item
              </button>
            </div>

            {items.length > 0 && (
              <div style={{ display: "grid", gap: 8 }}>
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      background: "#f1f5f9",
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>
                      {item.name} <span style={{ color: "#64748b" }}>× {item.quantity}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      style={{
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
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

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#334155",
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  fontFamily: "inherit",
};