import { useRef } from "react";
import { colors, radius, shadow } from "../styles/theme";
import { donationCategories } from "../constants/donationCategories";

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
      const promises = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then(newImages => {
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
      <section
        style={{
          background: "linear-gradient(90deg, #1d4f2d 0%, #4e7d44 100%)",
          color: "white",
          padding: "56px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: 42, fontWeight: 900, lineHeight: 1.1 }}>{pageTitle}</h1>
          <p style={{ margin: "14px auto 0", maxWidth: 700, fontSize: 17, opacity: 0.9 }}>{pageSubtitle}</p>
        </div>
      </section>

      <div style={{ maxWidth: "1800px", width: "calc(100% - 64px)", margin: "40px auto 0", boxSizing: "border-box" }}>
        <div style={{
          backgroundColor: colors.white, padding: "56px", borderRadius: radius.xl,
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: `1px solid ${colors.border}`,
          display: "flex", flexWrap: "wrap", gap: "80px"
        }}>

          <div style={{ flex: "1 1 450px" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "22px", color: colors.text, fontWeight: 800 }}>Item Photos *</h3>
            <p style={{ fontSize: "15px", color: colors.textSoft, marginTop: 0, marginBottom: "24px" }}>
              Add up to 10 photos. The first photo will be the main cover. Click the X to remove.
            </p>

            <input type="file" accept="image/*" multiple onChange={handleFileChange} ref={fileInputRef} style={{ display: "none" }} />

            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              {formData.images.map((img, idx) => (
                <div key={idx} style={{ position: "relative", width: "200px", height: "160px", borderRadius: "14px", boxShadow: shadow.soft }}>
                  <img src={img} alt={`Preview ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "14px" }} />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    style={{
                      position: "absolute", top: "-10px", right: "-10px", background: colors.white, color: colors.danger, border: "none",
                      borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", fontSize: "15px", fontWeight: "900", boxShadow: "0 4px 10px rgba(0,0,0,0.15)", transition: "transform 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >✕</button>
                </div>
              ))}

              {formData.images.length < 10 && (
                <div
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    width: "160px", height: "160px", borderRadius: "14px", border: "2px dashed #cbd5e1", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#2f6b39", backgroundColor: "#f8fafc", transition: "all 0.2s ease"
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = "#2f6b39"; e.currentTarget.style.backgroundColor = "#eef5ec"; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                >
                  <span style={{ fontSize: "42px", fontWeight: "300", marginBottom: "-4px" }}>+</span>
                  <span style={{ fontSize: "15px", fontWeight: "700" }}>Add Photo</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ flex: "2 1 600px" }}>
            <h3 style={{ margin: "0 0 24px 0", fontSize: "22px", color: colors.text, fontWeight: 800 }}>Details</h3>

            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <label style={labelStyle}>Title *</label>
                <input name="title" type="text" value={formData.title} onChange={handleChange} required style={inputStyle} placeholder="e.g., Warm Winter Coat" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div>
                  <label style={labelStyle}>Location *</label>
                  <input name="location" type="text" value={formData.location} onChange={handleChange} required style={inputStyle} placeholder="City, Area" />

                  {onUseLocation && (
                    <button
                      type="button"
                      onClick={onUseLocation}
                      style={{
                        marginTop: "12px",
                        padding: "12px 18px",
                        borderRadius: radius.md,
                        border: `2px solid ${colors.primaryLight}`,
                        backgroundColor: colors.surface,
                        color: colors.primary,
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "14px",
                        transition: "all 0.2s ease",
                        boxShadow: shadow.soft
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.primaryLight;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.surface;
                      }}
                    >
                      Use my current location
                    </button>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange} style={inputStyle}>
                    {donationCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  name="description" value={formData.description} onChange={handleChange}
                  style={{ ...inputStyle, resize: "vertical", minHeight: "200px", lineHeight: "1.6" }}
                  placeholder="Describe the condition, size, or any other helpful details..."
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                <button
                  type="submit" disabled={loading}
                  style={{
                    padding: "16px 40px", borderRadius: radius.md, border: "none", background: "linear-gradient(135deg, #2f5d34 0%, #3d7443 100%)",
                    color: colors.white, fontWeight: 800, fontSize: "16px", cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1, boxShadow: "0 8px 20px rgba(47,93,52,0.2)", transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 24px rgba(47,93,52,0.3)"; } }}
                  onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(47,93,52,0.2)"; } }}
                >
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

const labelStyle = { display: "block", marginBottom: 10, fontWeight: 700, color: colors.text, fontSize: 15 };
const inputStyle = { padding: "16px 18px", borderRadius: radius.md, border: `1px solid ${colors.border}`, background: "#fcfdfc", color: colors.text, fontSize: 16, width: "100%", boxSizing: "border-box", outline: "none", fontFamily: "inherit", transition: "border-color 0.2s" };
