import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/api";
import NeedItemsEditor from "../components/NeedItemsEditor";
import "../styles/formPages.css";

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
        body: JSON.stringify({ ...formData, items }),
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
    return <div className="form-loading">Loading...</div>;
  }

  return (
    <div className="form-page edit-need-page">
      <div className="edit-need-shell">
        <div className="edit-need-header">
          <h1>Edit need</h1>
          <p>Update your list of requirements</p>
        </div>

        <div className="form-card">
          <form onSubmit={handleSubmit} className="form-grid">
            <div>
              <label className="form-label">Title *</label>
              <input
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Location *</label>
              <input
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-textarea edit-need-description"
              />
            </div>

            <div className="edit-need-items-section">
              <label className="form-label">Items *</label>
              <NeedItemsEditor
                items={items}
                currentItem={currentItem}
                onCurrentItemChange={handleItemChange}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                compact
              />
            </div>

            <button type="submit" disabled={loading} className="form-button primary edit-need-submit">
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
