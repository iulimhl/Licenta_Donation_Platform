import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/api";
import { colors, radius, shadow } from "../styles/theme";

export default function EditDonation() {
  const navigate = useNavigate();
  const { id } = useParams();
  const userEmail = localStorage.getItem("userEmail");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Noua stare pentru sistemul de Toast
  const [notification, setNotification] = useState({ message: "", type: "" });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    category: "clothes",
  });

  const categories = ["clothes", "food", "electronics", "furniture", "medical", "other"];

  // Funcție utilitară pentru a afișa o eroare temporară care dispare după 3 secunde
  const showErrorToast = (msg) => {
    setNotification({ message: msg, type: "error" });
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
  };

  useEffect(() => {
    if (!userEmail) {
      navigate("/login");
      return;
    }

    const loadDonation = async () => {
      try {
        const { data } = await apiFetch(`/donations/${id}`);

        const dbEmail = (data?.owner_email || data?.user_email || data?.donor_email || "").toLowerCase().trim();
        const loggedEmail = (userEmail || "").toLowerCase().trim();

        if (dbEmail !== loggedEmail) {
          setNotification({ message: "You can only edit your own donations.", type: "error" });
          setTimeout(() => navigate("/profile"), 2000);
          return;
        }

        setFormData({
          title: data.title || "",
          description: data.description || "",
          location: data.location || "",
          category: data.category || "clothes",
        });
        setChecking(false);
      } catch (err) {
        console.error("Error loading donation:", err);
        setNotification({ message: "Could not load donation details.", type: "error" });
        setTimeout(() => navigate("/profile"), 2000);
      }
    };

    loadDonation();
  }, [id, userEmail, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.location) {
      showErrorToast("Please fill all required fields.");
      return;
    }

    setLoading(true);

    try {
      const { response } = await apiFetch(`/donations/${id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Afișăm Toast-ul de succes, așteptăm 1.5 secunde, apoi navigăm în siguranță
        setNotification({ message: "Donation updated successfully!", type: "success" });
        setTimeout(() => {
          navigate("/profile");
        }, 1500);
      } else {
        showErrorToast("Error updating donation. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      showErrorToast("Network error: " + err.message);
      setLoading(false);
    }
  };

  if (checking) {
    return <div style={{ textAlign: "center", marginTop: 100, color: colors.blueDark, fontWeight: 600 }}>Loading...</div>;
  }

  return (
    <div className="pattern-bg" style={{ minHeight: "100vh", padding: "40px 20px", backgroundColor: colors.bg }}>

      {/* NOU: Notificare Toast integrată fluid în pagină */}
      {notification.message && (
        <div style={{
          position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)", zIndex: 9999,
          padding: "14px 28px", borderRadius: radius.lg,
          background: notification.type === "error" ? colors.danger : colors.blueDark,
          color: colors.white, fontWeight: "600", boxShadow: shadow.card,
          border: `1px solid ${colors.border}`, backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", gap: "10px", transition: "all 0.3s"
        }}>
          {notification.type === "error" ? "✕" : "✓"} {notification.message}
        </div>
      )}

      <div style={{ maxWidth: "520px", width: "100%", margin: "0 auto" }}>

        {/* HEADER */}
        <div style={{
          background: colors.blueLight,
          padding: "26px 20px",
          borderRadius: radius.xl,
          marginBottom: "24px",
          boxShadow: shadow.soft,
          textAlign: "center"
        }}>
          <h1 style={{ margin: 0, fontSize: "24px", color: colors.blueDark, fontWeight: 800 }}>
            Edit donation
          </h1>
          <p style={{ margin: "6px 0 0 0", color: colors.blueDark, opacity: 0.8, fontSize: "14px", fontWeight: 500 }}>
            Update your donation item details
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
              <label style={labelStyle}>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={inputStyle}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
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