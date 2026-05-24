import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import { colors, radius, shadow } from "../styles/theme";

export default function PostDonation() {
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    category: "clothes",
    status: "available",
    description: "",
    image: "",
    lat: null,
    lng: null,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData((prev) => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        setFormData(prev => ({ ...prev, location: data.display_name || "Detected location", lat: latitude, lng: longitude }));
      } catch (err) { console.error(err); }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const userEmail = localStorage.getItem("userEmail");
    try {
      const { response } = await apiFetch("/donations/", {
        method: "POST",
        body: JSON.stringify({ ...formData, owner_email: userEmail }),
      });
      if (response.ok) navigate("/");
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, padding: "40px 20px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        {/* Bannerul de stil */}
        <div style={{
          background: colors.blueLight, padding: "30px 40px", borderRadius: radius.xl,
          marginBottom: "30px", boxShadow: shadow.soft
        }}>
          <h2 style={{ margin: 0, fontSize: "28px", color: colors.blueDark, fontWeight: 800 }}>Post a donation</h2>
          <p style={{ margin: "8px 0 0 0", color: colors.blueDark, opacity: 0.8, fontWeight: 500 }}>
            Share what you don't need anymore
          </p>
        </div>

        <div style={{ backgroundColor: colors.card, padding: "40px", borderRadius: radius.xl, boxShadow: shadow.card, border: `1px solid ${colors.border}` }}>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input name="title" type="text" placeholder="e.g. Winter jacket" value={formData.title} onChange={handleChange} required style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Location *</label>
              <input name="location" type="text" placeholder="e.g. Copou, Iași" value={formData.location} onChange={handleChange} required style={inputStyle} />
              <button type="button" onClick={handleUseMyLocation} style={secondaryButtonStyle}> Use my current location</button>
            </div>

            <div>
              <label style={labelStyle}>Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} style={inputStyle}>
                <option value="clothes">Clothes</option>
                <option value="food">Food</option>
                <option value="education">Education</option>
                <option value="hygiene">Hygiene</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea name="description" placeholder="Condition, size, etc." value={formData.description} onChange={handleChange} style={{ ...inputStyle, height: 100, resize: "none" }} />
            </div>

            <div>
              <label style={labelStyle}>Photo</label>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ fontSize: 13, color: colors.muted }} />
            </div>

            <button type="submit" disabled={loading} style={primaryButtonStyle}>
              {loading ? "Posting..." : "Post donation"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Stiluri refolosibile bazate pe temă
const labelStyle = { display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600, color: "#2f3b52" };
const inputStyle = { width: "100%", padding: "12px 16px", borderRadius: "12px", border: `2px solid #dbeafe`, backgroundColor: "#f8fbff", outline: "none", boxSizing: "border-box" };
const primaryButtonStyle = { padding: "16px", backgroundColor: "#5f8fe8", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "800", fontSize: "16px", cursor: "pointer", marginTop: 10 };
const secondaryButtonStyle = {
                  marginTop: "12px", padding: "12px", borderRadius: radius.md, border: "none",
                  backgroundColor: colors.yellowLight, color: "#856404",
                  fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                 };