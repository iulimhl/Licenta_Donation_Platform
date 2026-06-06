import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import { reverseGeocode, getShortAddress } from "../api/geo";
import NeedItemsEditor from "../components/NeedItemsEditor";
import "../styles/formPages.css";

export default function PostNeed() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const userEmail = localStorage.getItem("userEmail");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    lat: null,
    lng: null,
  });
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({ name: "", quantity: 1 });
  const [verificationStatus, setVerificationStatus] = useState(null);

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
          return;
        }

        setVerificationStatus(data.verification_status || "unverified");
      })
      .catch(() => {
        setChecking(false);
        navigate("/login");
      });
  }, [userEmail, navigate]);

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
    }
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const data = await reverseGeocode(latitude, longitude);
      if (data) {
        setFormData((prev) => ({
          ...prev,
          location: getShortAddress(data),
          lat: latitude,
          lng: longitude,
        }));
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return alert("Please add at least one item.");

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

      if (response.ok) navigate("/needs");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <div className="form-loading">Checking permissions...</div>;
  }

  if (verificationStatus !== "verified") {
    const isRejected = verificationStatus === "rejected";

    return (
      <div className="form-page">
        <FormBanner />

        <div className="form-container">
          <div className="form-card center">
            <h2 className="post-need-status-title">
              {isRejected ? "Posting is disabled" : "Approval pending"}
            </h2>

            <p className="post-need-status-text">
              {isRejected
                ? "Your organization account was not approved by admin, so you cannot post requirement lists at the moment."
                : "Your organization account is waiting for admin approval. You will be able to post requirement lists after verification is completed."}
            </p>

            <button onClick={() => navigate("/profile")} className="form-button">
              Back to profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <FormBanner />

      <div className="form-container">
        <div className="form-card">
          <form onSubmit={handleSubmit} className="form-grid">
            <div>
              <label className="form-label">Title *</label>
              <input
                name="title"
                type="text"
                placeholder="e.g., School supplies"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Location *</label>
              <input
                name="location"
                type="text"
                placeholder="e.g. Copou, Iasi"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                className="form-input"
              />
              <button type="button" onClick={handleUseMyLocation} className="post-need-location-button">
                Use my current location
              </button>
            </div>

            <div>
              <label className="form-label">Add items to list *</label>
              <NeedItemsEditor
                items={items}
                currentItem={currentItem}
                onCurrentItemChange={handleItemChange}
                onAddItem={addItem}
                onRemoveItem={removeItem}
              />
            </div>

            <button type="submit" disabled={loading} className="form-button primary post-need-submit">
              {loading ? "Posting..." : "Post Requirements"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function FormBanner() {
  return (
    <section className="form-banner">
      <h1>Post a requirement list</h1>
      <p>Tell the community what your organization needs.</p>
    </section>
  );
}
