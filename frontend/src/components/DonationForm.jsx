import { useRef } from "react";
import { donationCategories } from "../constants/donationCategories";
import SectionBanner from "./common/SectionBanner";
import { useLanguage } from "../language/useLanguage";
import "../styles/components/DonationForm.css";

export default function DonationForm({
  pageTitle,
  pageSubtitle,
  formData,
  setFormData,
  onSubmit,
  loading,
  submitButtonText,
  onUseLocation
}) {
  const fileInputRef = useRef(null);
  const { t } = useLanguage();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const promises = files.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then((newImages) => {
        setFormData((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  return (
    <>
      <SectionBanner title={pageTitle} subtitle={pageSubtitle} />

      <div className="donation-form-shell">
        <div className="donation-form-card">
          <div className="donation-form-photos">
            <h3>{t("donationForm.photos")}</h3>
            <p>{t("donationForm.photosHelp")}</p>

            <input
              className="donation-form-hidden-input"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              ref={fileInputRef}
            />

            <div className="donation-form-preview-grid">
              {formData.images.map((img, idx) => (
                <div key={idx} className="donation-form-preview">
                  <img src={img} alt={`Preview ${idx}`} />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="donation-form-remove"
                    aria-label={t("donationForm.removePhoto")}
                  >
                    x
                  </button>
                </div>
              ))}

              {formData.images.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="donation-form-add-photo"
                >
                  <span>+</span>
                  <strong>{t("donationForm.addPhoto")}</strong>
                </button>
              )}
            </div>
          </div>

          <div className="donation-form-details">
            <h3>{t("donationForm.details")}</h3>

            <form onSubmit={onSubmit} className="donation-form-fields">
              <div className="donation-form-field">
                <label>{t("donationForm.title")}</label>
                <input
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder={t("donationForm.titlePlaceholder")}
                />
              </div>

              <div className="donation-form-two-col">
                <div className="donation-form-field">
                  <label>{t("donationForm.location")}</label>
                  <input
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder={t("donationForm.locationPlaceholder")}
                  />

                  {onUseLocation && (
                    <button
                      type="button"
                      onClick={onUseLocation}
                      className="donation-form-location-button"
                    >
                      {t("donationForm.useCurrentLocation")}
                    </button>
                  )}
                </div>

                <div className="donation-form-field">
                  <label>{t("donationForm.category")}</label>
                  <select name="category" value={formData.category} onChange={handleChange}>
                    {donationCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="donation-form-field">
                <label>{t("donationForm.description")}</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={t("donationForm.descriptionPlaceholder")}
                />
              </div>

              <div className="donation-form-submit-row">
                <button type="submit" disabled={loading} className="donation-form-submit">
                  {loading ? t("donationForm.processing") : submitButtonText}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
