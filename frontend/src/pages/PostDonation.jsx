import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import { reverseGeocode, getShortAddress } from "../api/geo";
import DonationForm from "../components/DonationForm";
import { isAdminUser } from "../utils/auth";
import { useTimedNotification } from "../hooks/useTimedNotification";
import { useLanguage } from "../language/useLanguage";
import "../styles/formPages.css";

export default function PostDonation() {
  const isAdmin = isAdminUser();
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    category: "clothes",
    status: "available",
    description: "",
    images: [],
    lat: null,
    lng: null,
  });
  const [loading, setLoading] = useState(false);
  const { notification, showNotification } = useTimedNotification(3200);
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) {
      navigate("/admin/verifications");
    }
  }, [isAdmin, navigate]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const data = await reverseGeocode(latitude, longitude);
      if (data) {
        const shortLocation = getShortAddress(data);
        setFormData((prev) => ({ ...prev, location: shortLocation, lat: latitude, lng: longitude }));
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.images.length === 0) {
      showNotification(t("postDonation.missingPhoto"), "error");
      return;
    }
    setLoading(true);

    const payload = {
      ...formData,
      image: JSON.stringify(formData.images),
    };

    try {
      const { response } = await apiFetch("/donations/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        navigate("/donations");
      } else {
        showNotification(t("postDonation.createError"), "error");
      }
    } catch (error) {
      console.error(error);
      showNotification(t("postDonation.serverError"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="donation-form-page">
      {notification.message && (
        <div className={`page-notification centered ${notification.type === "error" ? "error" : "success"}`}>
          {notification.message}
        </div>
      )}

      <DonationForm
        pageTitle={t("postDonation.title")}
        pageSubtitle={t("postDonation.subtitle")}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        loading={loading}
        submitButtonText={t("postDonation.submit")}
        onUseLocation={handleUseMyLocation}
      />
    </div>
  );
}
