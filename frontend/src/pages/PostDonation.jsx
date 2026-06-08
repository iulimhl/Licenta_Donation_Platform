import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import { reverseGeocode, getShortAddress } from "../api/geo";
import DonationForm from "../components/DonationForm";
import { isAdminUser } from "../utils/auth";
import "../styles/formPages.css";

export default function PostDonation() {
  const userEmail = localStorage.getItem("userEmail");
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
    if (formData.images.length === 0) return alert("Please add at least one photo.");
    setLoading(true);

    const payload = {
      ...formData,
      image: JSON.stringify(formData.images),
      owner_email: localStorage.getItem("userEmail"),
    };

    try {
      const { response } = await apiFetch("/donations/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (response.ok) navigate("/donations");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="donation-form-page">
      <DonationForm
        pageTitle="Post a Donation"
        pageSubtitle="Share what you don't need anymore. Add clear photos and details to help it find a new home."
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        loading={loading}
        submitButtonText="Post Donation"
        onUseLocation={handleUseMyLocation}
      />
    </div>
  );
}
