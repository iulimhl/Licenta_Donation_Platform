import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/api";
import NeedForm from "../components/NeedForm";
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

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (field === "quantity") {
          const minimumQuantity = Math.max(1, item.brought || 0);
          const nextQuantity = Math.max(minimumQuantity, parseInt(value, 10) || minimumQuantity);
          return { ...item, quantity: nextQuantity };
        }

        return { ...item, [field]: value };
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedItems = items.map((item) => ({
      ...item,
      name: item.name.trim(),
      quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
      brought: Math.max(0, parseInt(item.brought, 10) || 0),
    }));

    if (!formData.title || !formData.location || normalizedItems.length === 0) {
      alert("Fill all fields");
      return;
    }

    if (normalizedItems.some((item) => !item.name || item.quantity < item.brought)) {
      alert("Check item names and quantities.");
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({ actor_email: userEmail });
      const { response, data } = await apiFetch(`/needs/${id}?${params.toString()}`, {
        method: "PATCH",
        body: JSON.stringify({ ...formData, items: normalizedItems }),
      });

      if (response.ok) {
        alert("Need updated successfully!");
        navigate("/profile");
      } else {
        alert(data?.detail || "Error updating need");
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
      <NeedForm
        pageTitle="Edit need"
        pageSubtitle="Update your list of requirements."
        formData={formData}
        setFormData={setFormData}
        items={items}
        currentItem={currentItem}
        onCurrentItemChange={handleItemChange}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onUpdateItem={updateItem}
        onSubmit={handleSubmit}
        loading={loading}
        submitButtonText="Save Changes"
        shellClassName="edit-need-shell"
        itemsSectionClassName="edit-need-items-section"
        descriptionClassName="edit-need-description"
        submitClassName="edit-need-submit"
        compactItems
      />
    </div>
  );
}
