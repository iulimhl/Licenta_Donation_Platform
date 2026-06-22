import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import SectionBanner from "../components/common/SectionBanner";
import EditProfileMediaSection from "../components/profile/EditProfileMediaSection";
import EditProfileVerificationSection from "../components/profile/EditProfileVerificationSection";
import { hasProfileAddress, resolveProfileCoordinates } from "../utils/profileLocation";
import {
  uploadProfileCover,
  uploadProfileGallery,
  uploadProfileLogo,
} from "../utils/profileUploads";
import "../styles/formPages.css";
import "../styles/pages/EditProfile.css";

export default function EditProfile() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");
  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const verificationDocumentInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [mapStatus, setMapStatus] = useState("");
  const [userType, setUserType] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [cif, setCif] = useState("");
  const [verificationFile, setVerificationFile] = useState(null);
  const [resubmittingVerification, setResubmittingVerification] = useState(false);

  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [logoPreview, setLogoPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  const [form, setForm] = useState({
    name: "",
    location: "",
    lat: null,
    lng: null,
    phone: "",
    phone_visible: false,
    website: "",
    city: "",
    description: "",
    founded_year: "",
    mission: "",
    pickup_address: "",
    logo_url: "",
    cover_image_url: "",
    gallery_images: [],
  });

  useEffect(() => {
    async function loadUser() {
      try {
        const { response, data } = await apiFetch(`/auth/user/${userEmail}`);
        if (!response.ok || !data) {
          alert("Could not load profile.");
          return;
        }

        setUserType(data.user_type || "");
        setVerificationStatus(data.verification_status || "");
        setCif(data.cif || "");
        setForm({
          name: data.name || "",
          location: data.location || "",
          lat: data.lat ?? null,
          lng: data.lng ?? null,
          phone: data.phone || "",
          phone_visible: data.phone_visible ?? false,
          website: data.website || "",
          city: data.city || "",
          description: data.description || "",
          founded_year: data.founded_year ?? "",
          mission: data.mission || "",
          pickup_address: data.pickup_address || "",
          logo_url: data.logo_url || "",
          cover_image_url: data.cover_image_url || "",
          gallery_images: data.gallery_images || [],
        });
      } catch (err) {
        console.error(err);
        alert("Server error while loading profile.");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [userEmail]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "location" || name === "city" || name === "pickup_address"
        ? { lat: null, lng: null }
        : {}),
    }));

    if (name === "location" || name === "city" || name === "pickup_address") {
      setMapStatus("");
    }
  }

  function handleLogoFile(file) {
    setLogoFile(file || null);
    setLogoPreview(file ? URL.createObjectURL(file) : "");
  }

  function handleCoverFile(file) {
    setCoverFile(file || null);
    setCoverPreview(file ? URL.createObjectURL(file) : "");
  }

  function handleGalleryFiles(files) {
    const nextFiles = Array.from(files || []);
    setGalleryFiles(nextFiles);
    setGalleryPreviews(nextFiles.map((file) => URL.createObjectURL(file)));
  }

  function handleVerificationFile(file) {
    setVerificationFile(file || null);
  }

  async function geocodeProfileLocation() {
    return resolveProfileCoordinates(form, userType);
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setMapStatus("Geolocation is not supported by this browser.");
      return;
    }

    setLoadingLocation(true);
    setMapStatus("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let detectedLocation = "Detected location";

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          detectedLocation = data.display_name || detectedLocation;
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
        }

        setForm((prev) => ({
          ...prev,
          location: detectedLocation,
          lat: latitude,
          lng: longitude,
        }));
        setMapStatus("Current location detected. Save changes to update the map.");
        setLoadingLocation(false);
      },
      () => {
        setMapStatus("Access to current location was denied.");
        setLoadingLocation(false);
      }
    );
  }

  async function resolveCoordinatesForSubmit() {
    setGeocoding(true);
    const coordinates = await geocodeProfileLocation();
    setGeocoding(false);
    return coordinates;
  }

  async function uploadLogoIfNeeded() {
    if (!logoFile) return form.logo_url || null;
    return uploadProfileLogo(userEmail, logoFile);
  }

  async function uploadCoverIfNeeded() {
    if (!coverFile) return form.cover_image_url || null;
    return uploadProfileCover(userEmail, coverFile);
  }

  async function uploadGalleryIfNeeded() {
    if (!galleryFiles.length) return form.gallery_images || [];
    return uploadProfileGallery(userEmail, galleryFiles);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const uploadedLogoUrl = await uploadLogoIfNeeded();
      const uploadedCoverUrl = await uploadCoverIfNeeded();
      const uploadedGallery = userType === "organization" ? await uploadGalleryIfNeeded() : [];
      const coordinates = await resolveCoordinatesForSubmit();

      const payload = {
        name: form.name || null,
        location: form.location || null,
        lat: coordinates.lat,
        lng: coordinates.lng,
        phone: form.phone || null,
        phone_visible: !!form.phone_visible,
        website: form.website || null,
        city: form.city || null,
        description: form.description || null,
        founded_year: form.founded_year === "" ? null : Number(form.founded_year),
        mission: form.mission || null,
        pickup_address: form.pickup_address || null,
        logo_url: uploadedLogoUrl,
        cover_image_url: uploadedCoverUrl,
        gallery_images: uploadedGallery,
      };

      const { response, data } = await apiFetch(`/auth/user/${userEmail}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        alert(data?.detail || "Could not save profile.");
        return;
      }

      if (userType === "organization" && hasProfileAddress(form) && (!coordinates.lat || !coordinates.lng)) {
        alert("Profile updated, but the map location could not be found. Add a clearer city, county, and street for the pin to appear.");
      } else {
        alert("Profile updated successfully!");
      }

      navigate("/profile");
    } catch (err) {
      console.error(err);
      alert(err.message || "Server error while saving profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResubmitVerification() {
    if (!verificationFile) {
      alert("Please upload the fiscal registration certificate first.");
      return;
    }

    if (!cif) {
      alert("Your account has no CIF saved. Please contact an admin or register again with the correct CIF.");
      return;
    }

    setResubmittingVerification(true);

    try {
      const documentForm = new FormData();
      documentForm.append("email", userEmail);
      documentForm.append("file", verificationFile);

      const { response: uploadResponse, data: uploadData } = await apiFetch("/verification/upload-document", {
        method: "POST",
        body: documentForm,
      });

      if (!uploadResponse.ok) {
        alert(uploadData?.detail || "Document upload failed.");
        return;
      }

      const { response: verifyResponse, data: verifyData } = await apiFetch("/verification/organization", {
        method: "POST",
        body: JSON.stringify({
          email: userEmail,
          name: form.name || userEmail,
          cif,
        }),
      });

      if (!verifyResponse.ok) {
        alert(verifyData?.detail || "Verification could not be submitted.");
        return;
      }

      setVerificationStatus("pending");
      setVerificationFile(null);
      alert("Verification request sent again. An admin can review it now.");
      navigate("/profile");
    } catch (err) {
      console.error(err);
      alert(err.message || "Server error while resubmitting verification.");
    } finally {
      setResubmittingVerification(false);
    }
  }

  if (loading) {
    return <div className="form-loading">Loading...</div>;
  }

  return (
    <div className="form-page edit-profile-page">
      <SectionBanner
        title="Edit profile"
        subtitle="Update your account information and public profile details."
      />
      <div className="form-container wide edit-profile-container">
        <form
          onSubmit={handleSubmit}
          className="form-card edit-profile-card has-media-sidebar"
        >
          <EditProfileMediaSection
            userType={userType}
            form={form}
            logoInputRef={logoInputRef}
            coverInputRef={coverInputRef}
            galleryInputRef={galleryInputRef}
            logoPreview={logoPreview}
            coverPreview={coverPreview}
            galleryPreviews={galleryPreviews}
            onLogoFile={handleLogoFile}
            onCoverFile={handleCoverFile}
            onGalleryFiles={handleGalleryFiles}
          />

          <EditProfileVerificationSection
            userType={userType}
            verificationStatus={verificationStatus}
            verificationFile={verificationFile}
            resubmittingVerification={resubmittingVerification}
            inputRef={verificationDocumentInputRef}
            onFileChange={handleVerificationFile}
            onResubmit={handleResubmitVerification}
          />

          <section className="edit-profile-section">
            <div className="edit-profile-grid">
              <div className="edit-profile-field large">
                <label className="form-label">
                  {userType === "organization" ? "Organization name" : "Full name"}
                </label>
                <input name="name" value={form.name} onChange={handleChange} className="form-input" />
              </div>

              {userType === "organization" && (
                <div className="edit-profile-field small">
                  <label className="form-label">Founded year</label>
                  <input
                    type="number"
                    name="founded_year"
                    value={form.founded_year}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              )}

              <div className="edit-profile-field full">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="form-textarea edit-profile-textarea"
                />
              </div>

              {userType === "organization" && (
                <div className="edit-profile-field full">
                  <label className="form-label">Mission</label>
                  <textarea
                    name="mission"
                    value={form.mission}
                    onChange={handleChange}
                    className="form-textarea edit-profile-textarea"
                  />
                </div>
              )}
            </div>
          </section>

          <section className="edit-profile-section">
            <div className="edit-profile-grid">
              <div className="edit-profile-field full">
                <label className="form-label">Location</label>
                <input name="location" value={form.location} onChange={handleChange} className="form-input" />
                {userType === "organization" && (
                  <div className="edit-profile-map-tools">
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={loadingLocation || geocoding}
                      className="edit-profile-location-button"
                    >
                      {loadingLocation ? "Detecting..." : "Use current location"}
                    </button>
                    {mapStatus && <p>{mapStatus}</p>}
                  </div>
                )}
              </div>

              <div className="edit-profile-field">
                <label className="form-label">City</label>
                <input name="city" value={form.city} onChange={handleChange} className="form-input" />
              </div>

              {userType === "organization" && (
                <div className="edit-profile-field">
                  <label className="form-label">Pickup address</label>
                  <input
                    name="pickup_address"
                    value={form.pickup_address}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              )}

              <div className="edit-profile-field">
                <label className="form-label">Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="form-input" />

                <label className="edit-profile-check">
                  <input
                    type="checkbox"
                    name="phone_visible"
                    checked={!!form.phone_visible}
                    onChange={handleChange}
                  />
                  <span>Show my phone number publicly</span>
                </label>
              </div>

              <div className="edit-profile-field">
                <label className="form-label">Website</label>
                <input
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="https://..."
                />
              </div>
            </div>
          </section>

          <div className="form-actions">
            <button type="button" onClick={() => navigate("/profile")} className="form-button secondary">
              Cancel
            </button>

            <button type="submit" disabled={saving} className="form-button primary">
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
