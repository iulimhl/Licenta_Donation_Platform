import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, API_BASE, buildFileUrl } from "../api/api";
import SectionBanner from "../components/common/SectionBanner";
import "../styles/formPages.css";
import "../styles/pages/EditProfile.css";

function cleanAddressPart(value) {
  return String(value || "")
    .replace(/[()[\]{}]/g, " ")
    .replace(/[;]/g, ",")
    .replace(/\bjud\.?\b/gi, "judetul")
    .replace(/\bmun\.?\b/gi, "municipiul")
    .replace(/\bcom\.?\b/gi, "comuna")
    .replace(/\bsat\.?\b/gi, "sat")
    .replace(/\bstr\.?\b/gi, "strada")
    .replace(/\bnr\.?\b/gi, "numarul")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueValues(values) {
  return values.filter((value, index, array) => value && array.indexOf(value) === index);
}

function getGeocodingQueries(form) {
  const pickupAddress = cleanAddressPart(form.pickup_address);
  const location = cleanAddressPart(form.location);
  const city = cleanAddressPart(form.city);

  return uniqueValues([
    [pickupAddress, city, "Romania"].filter(Boolean).join(", "),
    [location, city, "Romania"].filter(Boolean).join(", "),
    [pickupAddress, location, "Romania"].filter(Boolean).join(", "),
    [pickupAddress, "Romania"].filter(Boolean).join(", "),
    [location, "Romania"].filter(Boolean).join(", "),
    [city, "Romania"].filter(Boolean).join(", "),
  ]);
}

function hasProfileAddress(form) {
  return [form.pickup_address, form.location, form.city].some((value) => String(value || "").trim());
}

export default function EditProfile() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");
  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [mapStatus, setMapStatus] = useState("");
  const [userType, setUserType] = useState("");

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

  async function geocodeProfileLocation() {
    if (userType !== "organization") {
      return { lat: null, lng: null };
    }

    if (form.lat && form.lng) {
      return { lat: form.lat, lng: form.lng };
    }

    const queries = getGeocodingQueries(form);

    if (!queries.length) {
      return { lat: null, lng: null };
    }

    for (const query of queries) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=ro&limit=1&q=${encodeURIComponent(query)}`
        );
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          };
        }
      } catch (err) {
        console.error("Profile geocoding failed:", err);
      }
    }

    return { lat: null, lng: null };
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

    const formData = new FormData();
    formData.append("file", logoFile);

    const response = await fetch(`${API_BASE}/auth/user/${userEmail}/upload-logo`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.detail || "Could not upload logo.");
    }

    return data.logo_url;
  }

  async function uploadCoverIfNeeded() {
    if (!coverFile) return form.cover_image_url || null;

    const formData = new FormData();
    formData.append("file", coverFile);

    const response = await fetch(`${API_BASE}/auth/user/${userEmail}/upload-cover`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.detail || "Could not upload cover.");
    }

    return data.cover_image_url;
  }

  async function uploadGalleryIfNeeded() {
    if (!galleryFiles.length) return form.gallery_images || [];

    const formData = new FormData();
    galleryFiles.forEach((file) => formData.append("files", file));

    const response = await fetch(`${API_BASE}/auth/user/${userEmail}/upload-gallery`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.detail || "Could not upload gallery.");
    }

    return data.gallery_images || [];
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
          className={`form-card edit-profile-card ${userType === "organization" ? "has-media-sidebar" : ""}`}
        >
          {userType === "organization" && (
            <section className="edit-profile-section edit-profile-media-section">
              <div className="edit-profile-section-head">
                <h2>Profile photos</h2>
                <p>Update the logo, cover and gallery shown on your organization profile.</p>
              </div>

              <input
                ref={logoInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={(e) => handleLogoFile(e.target.files?.[0])}
                className="edit-profile-hidden-file"
              />
              <input
                ref={coverInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={(e) => handleCoverFile(e.target.files?.[0])}
                className="edit-profile-hidden-file"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                multiple
                onChange={(e) => handleGalleryFiles(e.target.files)}
                className="edit-profile-hidden-file"
              />

              <div className="edit-profile-photo-stack">
                <button
                  type="button"
                  className="edit-profile-logo-preview"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logoPreview || form.logo_url ? (
                    <img src={logoPreview || buildFileUrl(form.logo_url)} alt="Logo" />
                  ) : (
                    <span className="edit-profile-media-plus">+</span>
                  )}
                  <span>Change logo</span>
                </button>

                <button
                  type="button"
                  className="edit-profile-cover-preview"
                  onClick={() => coverInputRef.current?.click()}
                >
                  {coverPreview || form.cover_image_url ? (
                    <img src={coverPreview || buildFileUrl(form.cover_image_url)} alt="Cover" />
                  ) : (
                    <span className="edit-profile-media-plus">+</span>
                  )}
                  <span>Change cover</span>
                </button>
              </div>

              <div className="edit-profile-gallery-block">
                <div className="edit-profile-gallery-head">
                  <h3>Gallery</h3>
                  <button type="button" onClick={() => galleryInputRef.current?.click()}>
                    Add photos
                  </button>
                </div>

                <div className="edit-profile-gallery">
                  {(galleryPreviews.length ? galleryPreviews : form.gallery_images?.map(buildFileUrl) || []).map((img, index) => (
                    <img key={index} src={img} alt={`Gallery ${index + 1}`} />
                  ))}

                  <button
                    type="button"
                    className="edit-profile-add-photo"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    <span>+</span>
                    Add Photo
                  </button>
                </div>
              </div>
            </section>
          )}

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
