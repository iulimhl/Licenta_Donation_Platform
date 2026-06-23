import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/api";
import DonationForm from "../components/DonationForm";
import { useTimedNotification } from "../hooks/useTimedNotification";
import { useLanguage } from "../language/useLanguage";
import { getDonationImages } from "../utils/donationImages";
import "../styles/formPages.css";

export default function EditDonation() {
  const navigate = useNavigate();
  const { id } = useParams();
  const userEmail = localStorage.getItem("userEmail");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { notification, showNotification } = useTimedNotification();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    category: "clothes",
    images: [],
  });

  const showErrorToast = (msg) => {
    showNotification(msg, "error");
  };

  useEffect(() => {
    if (!userEmail) return navigate("/login");

    const loadDonation = async () => {
      try {
        const { data } = await apiFetch(`/donations/${id}`);
        const dbEmail = (data?.owner_email || data?.user_email || data?.donor_email || "")
          .toLowerCase()
          .trim();

        if (dbEmail !== userEmail.toLowerCase().trim()) {
          showNotification(t("editDonation.ownOnly"), "error");
          return setTimeout(() => navigate("/profile"), 2000);
        }

        const existingImages = getDonationImages(data.image);

        setFormData({
          title: data.title || "",
          description: data.description || "",
          location: data.location || "",
          category: data.category || "clothes",
          images: existingImages.filter(Boolean),
        });
        setChecking(false);
      } catch {
        showNotification(t("editDonation.loadError"), "error");
        setTimeout(() => navigate("/profile"), 2000);
      }
    };
    loadDonation();
  }, [id, userEmail, navigate, showNotification, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.location) return showErrorToast(t("editDonation.requiredFields"));
    setLoading(true);

    try {
      const { response } = await apiFetch(`/donations/${id}`, {
        method: "PUT",
        body: JSON.stringify({ ...formData, image: JSON.stringify(formData.images) }),
      });

      if (response.ok) {
        showNotification(t("editDonation.success"));
        setTimeout(() => navigate(`/donation/${id}`), 1500);
      } else {
        showErrorToast(t("editDonation.updateError"));
      }
    } catch (err) {
      showErrorToast(t("editDonation.networkError").replace("{message}", err.message));
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <div className="donation-page-loading">{t("editDonation.loading")}</div>;

  return (
    <div className="donation-form-page">
      {notification.message && (
        <div className={`donation-page-toast ${notification.type === "error" ? "error" : "success"}`}>
          {notification.message}
        </div>
      )}

      <DonationForm
        pageTitle={t("editDonation.title")}
        pageSubtitle={t("editDonation.subtitle")}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        loading={loading}
        submitButtonText={t("editDonation.submit")}
      />
    </div>
  );
}
