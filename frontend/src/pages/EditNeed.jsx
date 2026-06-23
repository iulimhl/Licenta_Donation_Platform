import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/api";
import NeedForm from "../components/NeedForm";
import { useTimedNotification } from "../hooks/useTimedNotification";
import { useLanguage } from "../language/useLanguage";
import "../styles/formPages.css";

export default function EditNeed() {
  const navigate = useNavigate();
  const { id } = useParams();
  const userEmail = localStorage.getItem("userEmail");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { notification, showNotification } = useTimedNotification(3200);
  const { t } = useLanguage();

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
          showNotification(t("editNeed.ownOnly"), "error");
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
        showNotification(t("editNeed.loadError"), "error");
        navigate("/profile");
      } finally {
        setChecking(false);
      }
    };

    loadNeed();
  }, [id, userEmail, navigate, showNotification, t]);

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
      showNotification(t("editNeed.enterItemName"), "error");
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
      showNotification(t("editNeed.fillAll"), "error");
      return;
    }

    if (normalizedItems.some((item) => !item.name || item.quantity < item.brought)) {
      showNotification(t("editNeed.checkItems"), "error");
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
        showNotification(t("editNeed.success"));
        navigate("/profile");
      } else {
        showNotification(data?.detail || t("editNeed.updateError"), "error");
      }
    } catch (err) {
      showNotification(err.message || t("editNeed.serverError"), "error");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <div className="form-loading">{t("editNeed.loading")}</div>;
  }

  return (
    <div className="form-page edit-need-page">
      {notification.message && (
        <div className={`page-notification centered ${notification.type === "error" ? "error" : "success"}`}>
          {notification.message}
        </div>
      )}

      <NeedForm
        pageTitle={t("editNeed.title")}
        pageSubtitle={t("editNeed.subtitle")}
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
        submitButtonText={t("editNeed.submit")}
        shellClassName="edit-need-shell"
        itemsSectionClassName="edit-need-items-section"
        descriptionClassName="edit-need-description"
        submitClassName="edit-need-submit"
        compactItems
      />
    </div>
  );
}
