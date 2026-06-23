import NeedItemsEditor from "./NeedItemsEditor";
import SectionBanner from "./common/SectionBanner";
import { useLanguage } from "../language/useLanguage";

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
  loadingText,
  submitButtonText,
  itemsLabel,
  onUseLocation,
  shellClassName = "form-container",
  itemsSectionClassName = "",
  descriptionClassName = "",
  submitClassName = "",
  compactItems = false,
}) {
  const { t } = useLanguage();
  const resolvedLoadingText = loadingText || t("needForm.saving");
  const resolvedItemsLabel = itemsLabel || t("needForm.items");

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
              <label className="form-label">{t("needForm.title")}</label>
              <input
                name="title"
                type="text"
                placeholder={t("needForm.titlePlaceholder")}
                value={formData.title}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">{t("needForm.location")}</label>
              <input
                name="location"
                type="text"
                placeholder={t("needForm.locationPlaceholder")}
                value={formData.location}
                onChange={handleChange}
                required
                className="form-input"
              />
              {onUseLocation && (
                <button type="button" onClick={onUseLocation} className="post-need-location-button">
                  {t("needForm.useCurrentLocation")}
                </button>
              )}
            </div>

            <div>
              <label className="form-label">{t("needForm.description")}</label>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                className={`form-textarea ${descriptionClassName}`.trim()}
              />
            </div>

            <div className={itemsSectionClassName}>
              <label className="form-label">{resolvedItemsLabel}</label>
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
              {loading ? resolvedLoadingText : submitButtonText}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
