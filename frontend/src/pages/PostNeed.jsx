import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import { reverseGeocode, getShortAddress } from "../api/geo";
import NeedForm from "../components/NeedForm";
import SectionBanner from "../components/common/SectionBanner";
import { useTimedNotification } from "../hooks/useTimedNotification";
import { useLanguage } from "../language/useLanguage";
import "../styles/formPages.css";

export default function PostNeed() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { notification, showNotification } = useTimedNotification(3200);
  const { t } = useLanguage();
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
    if (items.length === 0) {
      showNotification(t("postNeed.missingItem"), "error");
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
        navigate("/needs");
      } else {
        showNotification(t("postNeed.createError"), "error");
      }
    } catch (err) {
      console.error(err);
      showNotification(t("postNeed.serverError"), "error");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <div className="form-loading">{t("postNeed.checking")}</div>;
  }

  if (verificationStatus !== "verified") {
    const isRejected = verificationStatus === "rejected";

    return (
      <div className="form-page">
        <FormBanner title={t("postNeed.title")} subtitle={t("postNeed.subtitle")} />

        <div className="form-container">
          <div className="form-card center">
            <h2 className="post-need-status-title">
              {isRejected ? t("postNeed.disabledTitle") : t("postNeed.pendingTitle")}
            </h2>

            <p className="post-need-status-text">
              {isRejected
                ? t("postNeed.disabledText")
                : t("postNeed.pendingText")}
            </p>

            <button onClick={() => navigate("/profile")} className="form-button">
              {t("postNeed.backToProfile")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      {notification.message && (
        <div className={`page-notification centered ${notification.type === "error" ? "error" : "success"}`}>
          {notification.message}
        </div>
      )}

      <NeedForm
        pageTitle={t("postNeed.title")}
        pageSubtitle={t("postNeed.subtitle")}
        formData={formData}
        setFormData={setFormData}
        items={items}
        currentItem={currentItem}
        onCurrentItemChange={handleItemChange}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onSubmit={handleSubmit}
        loading={loading}
        loadingText={t("postNeed.posting")}
        submitButtonText={t("postNeed.submit")}
        itemsLabel={t("postNeed.itemsLabel")}
        onUseLocation={handleUseMyLocation}
        submitClassName="post-need-submit"
      />
    </div>
  );
}

function FormBanner({ title, subtitle }) {
  return (
    <SectionBanner
      title={title}
      subtitle={subtitle}
    />
  );
}
