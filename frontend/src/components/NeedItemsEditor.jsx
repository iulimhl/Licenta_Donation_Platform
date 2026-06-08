import "../styles/components/NeedItemsEditor.css";

export default function NeedItemsEditor({
  items,
  currentItem,
  onCurrentItemChange,
  onAddItem,
  onRemoveItem,
  compact = false,
}) {
  return (
    <div className="need-items-editor">
      <div className={`need-items-editor__row ${compact ? "compact" : ""}`}>
        <input
          type="text"
          name="name"
          placeholder="Item name"
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
          Add
        </button>
      </div>

      {items.length > 0 && (
        <div className="need-items-editor__list">
          {items.map((item, idx) => (
            <div key={`${item.name}-${idx}`} className="need-items-editor__item">
              <span>
                {item.name} <strong>x{item.quantity}</strong>
              </span>
              <button type="button" onClick={() => onRemoveItem(idx)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
