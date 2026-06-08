import { useRef } from "react";
import { donationCategories } from "../constants/donationCategories";
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
      <section className="donation-form-banner">
        <div className="donation-form-banner-inner">
          <h1>{pageTitle}</h1>
          <p>{pageSubtitle}</p>
        </div>
      </section>

      <div className="donation-form-shell">
        <div className="donation-form-card">
          <div className="donation-form-photos">
            <h3>Item Photos *</h3>
            <p>Add up to 10 photos. The first photo will be the main cover. Click the X to remove.</p>

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
                    aria-label="Remove photo"
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
                  <strong>Add Photo</strong>
                </button>
              )}
            </div>
          </div>

          <div className="donation-form-details">
            <h3>Details</h3>

            <form onSubmit={onSubmit} className="donation-form-fields">
              <div className="donation-form-field">
                <label>Title *</label>
                <input
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Warm Winter Coat"
                />
              </div>

              <div className="donation-form-two-col">
                <div className="donation-form-field">
                  <label>Location *</label>
                  <input
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="City, Area"
                  />

                  {onUseLocation && (
                    <button
                      type="button"
                      onClick={onUseLocation}
                      className="donation-form-location-button"
                    >
                      Use my current location
                    </button>
                  )}
                </div>

                <div className="donation-form-field">
                  <label>Category *</label>
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
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the condition, size, or any other helpful details..."
                />
              </div>

              <div className="donation-form-submit-row">
                <button type="submit" disabled={loading} className="donation-form-submit">
                  {loading ? "Processing..." : submitButtonText}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
