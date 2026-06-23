import "../styles/components/NeedItemsEditor.css";
import { useLanguage } from "../language/useLanguage";

export default function NeedItemsEditor({
  items,
  currentItem,
  onCurrentItemChange,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  compact = false,
}) {
  const { t } = useLanguage();

  return (
    <div className="need-items-editor">
      <div className={`need-items-editor__row ${compact ? "compact" : ""}`}>
        <input
          type="text"
          name="name"
          placeholder={t("needForm.itemName")}
          value={currentItem.name}
          onChange={onCurrentItemChange}
          className="need-items-editor__input need-items-editor__name"
        />
        <input
          type="number"
          name="quantity"
          min="1"
          value={currentItem.quantity}
          onChange={onCurrentItemChange}
          className="need-items-editor__input need-items-editor__quantity"
        />
        <button type="button" onClick={onAddItem} className="need-items-editor__add">
          {t("needForm.addItem")}
        </button>
      </div>

      {items.length > 0 && (
        <div className="need-items-editor__list">
          {items.map((item, idx) => (
            <div key={`${item.name}-${idx}`} className="need-items-editor__item">
              {onUpdateItem ? (
                <div className="need-items-editor__existing-fields">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(event) => onUpdateItem(idx, "name", event.target.value)}
                    className="need-items-editor__input need-items-editor__existing-name"
                  />
                  <input
                    type="number"
                    min={Math.max(1, item.brought || 0)}
                    value={item.quantity}
                    onChange={(event) => onUpdateItem(idx, "quantity", event.target.value)}
                    className="need-items-editor__input need-items-editor__existing-quantity"
                  />
                </div>
              ) : (
                <span>
                  {item.name} <strong>x{item.quantity}</strong>
                </span>
              )}
              <button type="button" onClick={() => onRemoveItem(idx)}>
                {t("needForm.removeItem")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
