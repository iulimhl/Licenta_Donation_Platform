import NeedItemsEditor from "./NeedItemsEditor";
import SectionBanner from "./common/SectionBanner";

export default function NeedForm({
  pageTitle,
  pageSubtitle,
  formData,
  setFormData,
  items,
  currentItem,
  onCurrentItemChange,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onSubmit,
  loading,
  loadingText = "Saving...",
  submitButtonText,
  itemsLabel = "Items *",
  onUseLocation,
  shellClassName = "form-container",
  itemsSectionClassName = "",
  descriptionClassName = "",
  submitClassName = "",
  compactItems = false,
}) {
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <SectionBanner title={pageTitle} subtitle={pageSubtitle} />

      <div className={shellClassName}>
        <div className="form-card">
          <form onSubmit={onSubmit} className="form-grid">
            <div>
              <label className="form-label">Title *</label>
              <input
                name="title"
                type="text"
                placeholder="e.g., School supplies"
                value={formData.title}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Location *</label>
              <input
                name="location"
                type="text"
                placeholder="e.g. Copou, Iasi"
                value={formData.location}
                onChange={handleChange}
                required
                className="form-input"
              />
              {onUseLocation && (
                <button type="button" onClick={onUseLocation} className="post-need-location-button">
                  Use my current location
                </button>
              )}
            </div>

            <div>
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                className={`form-textarea ${descriptionClassName}`.trim()}
              />
            </div>

            <div className={itemsSectionClassName}>
              <label className="form-label">{itemsLabel}</label>
              <NeedItemsEditor
                items={items}
                currentItem={currentItem}
                onCurrentItemChange={onCurrentItemChange}
                onAddItem={onAddItem}
                onRemoveItem={onRemoveItem}
                onUpdateItem={onUpdateItem}
                compact={compactItems}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`form-button primary ${submitClassName}`.trim()}
            >
              {loading ? loadingText : submitButtonText}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
