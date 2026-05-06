import { colors, radius, shadow } from "../../styles/theme";

const inputStyle = {
  minWidth: 240,
  flex: 1,
  padding: "11px 16px",
  borderRadius: radius.md,
  border: "1.5px solid #e2e8f0",
  background: "#fff",
  color: "#334155",
  fontSize: 14,
  outline: "none",
  fontFamily: "'Inter', sans-serif",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const buttonStyle = {
  background: `linear-gradient(135deg, ${colors.blue || '#3b82f6'}, ${colors.blueDark || '#1e40af'})`,
  color: "#fff",
  border: "none",
  borderRadius: radius.md,
  padding: "11px 20px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "'Inter', sans-serif",
  whiteSpace: "nowrap",
  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
  transition: "transform 0.2s, box-shadow 0.2s",

};

export default function PageToolbar({
  value,
  onChange,
  placeholder,
  showSelect = false,
  selectValue,
  onSelectChange,
  options = [],
  buttonText,
  onButtonClick,
  showButton = true,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        margin: "18px 0 28px 0",
        alignItems: "center",
      }}
    >
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={inputStyle}
      />

      {showSelect && (
        <select value={selectValue} onChange={onSelectChange} style={inputStyle}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
      )}

      {showButton && (
        <button
          onClick={onButtonClick}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(37, 99, 235, 0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.25)";
          }}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}
