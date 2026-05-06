import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function PostNeed() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState(null);
  const [checking, setChecking] = useState(true);
  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    if (!userEmail) {
      navigate("/login");
      return;
    }

    apiFetch(`/auth/user/${userEmail}`)
      .then(({ data }) => {
        setUserType(data.user_type);
        setChecking(false);
        if (data.user_type !== "organization") {
          alert("Only organizations can post needs!");
          navigate("/needs");
        }
      })
      .catch((err) => {
        console.error("Error:", err);
        setChecking(false);
        navigate("/login");
      });
  }, [userEmail, navigate]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    image: "",
    lat: null,
    lng: null,
  });

  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({ name: "", quantity: 1 });

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
      setItems([...items, { ...currentItem }]);
      setCurrentItem({ name: "", quantity: 1 });
    } else {
      alert("Enter item name");
    }
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const address = await reverseGeocode(latitude, longitude);

        setFormData((prev) => ({
          ...prev,
          location: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          lat: latitude,
          lng: longitude,
        }));
      },
      () => {
        alert("Could not get your location.");
      }
    );
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.display_name || "";
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      return "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.location || items.length === 0) {
      alert("Fill all fields");
      return;
    }

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
        alert("Posted!");
        navigate("/needs");
      } else {
        alert("Error posting");
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
          Post a requirement list
        </h1>
        <p
          style={{
            margin: "8px 0 0 0",
            color: "#64748b",
          }}
        >
          Tell the community what your organization needs
        </p>
      </div>

      <div style={{ maxWidth: 500, width: "100%" }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input
              name="title"
              type="text"
              placeholder="e.g., School supplies for orphanage"
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
              placeholder="e.g., Iași, Anastasie Panu Street"
              value={formData.location}
              onChange={handleChange}
              required
              style={inputStyle}
            />
            <button
              type="button"
              onClick={handleUseMyLocation}
              style={locationButtonStyle}
            >
              Use my current location
            </button>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              name="description"
              placeholder="Tell us more about the requirements"
              value={formData.description}
              onChange={handleChange}
              style={{ ...inputStyle, resize: "vertical", height: "80px" }}
            />
          </div>

          <div>
            <label style={labelStyle}>Image URL</label>
            <input
              name="image"
              type="text"
              placeholder="https://example.com/image.jpg"
              value={formData.image}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Add Items *</label>
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
            {loading ? "Posting..." : "Post Need"}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontWeight: 600,
  color: "#334155",
  fontSize: 13,
};

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

const locationButtonStyle = {
  marginTop: 8,
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
};