import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";

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

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
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

    const userEmail = localStorage.getItem("userEmail");
    const dataToSend = {
      ...formData,
      owner_email: userEmail,
    };

    try {
      const { response } = await apiFetch("/donations/", {
        method: "POST",
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        alert("Donation posted successfully!");
        navigate("/");
      } else {
        alert("Error saving donation.");
      }
    } catch (error) {
      alert("Could not contact backend.");
    }
  };

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
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontSize: "2rem",
            fontWeight: 700,
          }}
        >
          Post a Donation
        </h1>
        <p style={{ margin: "8px 0 0 0", color: "#64748b" }}>
          Share what you have with those in need
        </p>
      </div>

      <div style={{ maxWidth: 500, width: "100%", margin: "0 auto" }} className="glass-container">
        <div style={{ padding: "30px" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              color: "#fff",
              padding: "20px 24px",
              borderRadius: "16px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
              Share items you no longer need with your community
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
            <div className="form-group">
              <label className="modern-label">Title *</label>
              <input
                name="title"
                type="text"
                placeholder="e.g., Winter jacket"
                value={formData.title}
                onChange={handleChange}
                required
                className="modern-input"
              />
            </div>

            <div className="form-group">
              <label className="modern-label">Location *</label>
              <input
                name="location"
                type="text"
                placeholder="e.g., Iași, Victoriei Street"
                value={formData.location}
                onChange={handleChange}
                required
                className="modern-input"
              />
              <button
                type="button"
                onClick={handleUseMyLocation}
                style={{
                  marginTop: 8,
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Use my current location
              </button>
            </div>

            <div className="form-group">
              <label className="modern-label">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="modern-select"
              >
                <option value="clothes">Clothes</option>
                <option value="food">Food</option>
                <option value="education">Education</option>
                <option value="hygiene">Hygiene</option>
                <option value="home">Home</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="modern-label">Description</label>
              <textarea
                name="description"
                placeholder="Tell us more about the item..."
                value={formData.description}
                onChange={handleChange}
                className="modern-textarea"
              />
            </div>

            <div className="form-group">
              <label className="modern-label">Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="modern-file-input"
                style={{ fontSize: "13px" }}
              />
            </div>

            <button type="submit" style={buttonStyle}>
              Post Donation
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 16,
  cursor: "pointer",
  marginTop: "10px",
};