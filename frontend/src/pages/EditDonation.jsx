import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/api";
import DonationForm from "../components/DonationForm";
import "../styles/formPages.css";

export default function EditDonation() {
  const navigate = useNavigate();
  const { id } = useParams();
  const userEmail = localStorage.getItem("userEmail");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    category: "clothes",
    images: [],
  });

  const showErrorToast = (msg) => {
    setNotification({ message: msg, type: "error" });
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
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
          setNotification({ message: "You can only edit your own donations.", type: "error" });
          return setTimeout(() => navigate("/profile"), 2000);
        }

        let existingImages = [];
        try {
          existingImages = JSON.parse(data.image);
          if (!Array.isArray(existingImages)) existingImages = [data.image];
        } catch (e) {
          if (data.image) existingImages = [data.image];
        }

        setFormData({
          title: data.title || "",
          description: data.description || "",
          location: data.location || "",
          category: data.category || "clothes",
          images: existingImages.filter(Boolean),
        });
        setChecking(false);
      } catch (err) {
        setNotification({ message: "Could not load donation details.", type: "error" });
        setTimeout(() => navigate("/profile"), 2000);
      }
    };
    loadDonation();
  }, [id, userEmail, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.location) return showErrorToast("Please fill all required fields.");
    setLoading(true);

    try {
      const { response } = await apiFetch(`/donations/${id}`, {
        method: "PUT",
        body: JSON.stringify({ ...formData, image: JSON.stringify(formData.images) }),
      });

      if (response.ok) {
        setNotification({ message: "Donation updated successfully!", type: "success" });
        setTimeout(() => navigate(`/donation/${id}`), 1500);
      } else {
        showErrorToast("Error updating donation. Please try again.");
      }
    } catch (err) {
      showErrorToast("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <div className="donation-page-loading">Loading details...</div>;

  return (
    <div className="donation-form-page">
      {notification.message && (
        <div className={`donation-page-toast ${notification.type === "error" ? "error" : "success"}`}>
          {notification.type === "error" ? "x" : "✓"} {notification.message}
        </div>
      )}

      <DonationForm
        pageTitle="Edit Donation"
        pageSubtitle="Update your item details or manage photos to help it find a new home."
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        loading={loading}
        submitButtonText="Save Changes"
      />
    </div>
  );
}
