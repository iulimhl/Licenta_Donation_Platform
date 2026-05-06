import { colors, radius } from "../../styles/theme";

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
  marginBottom: 28,
};

const statCardStyle = {
  background: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.lg,
  padding: 18,
};

function StatCard({ label, value, valueColor = colors.text }) {
  return (
    <div style={statCardStyle}>
      <p style={{ margin: 0, fontSize: 13, color: colors.muted }}>{label}</p>
      <h3 style={{ margin: "8px 0 0 0", fontSize: 26, color: valueColor }}>{value}</h3>
    </div>
  );
}

export default function ProfileStats({
  donationsCount,
  needsCount,
  availableCount,
  reservedCount,
}) {
  return (
    <div style={statsGridStyle}>
      <StatCard label="Donations posted" value={donationsCount} />
      <StatCard label="Needs posted" value={needsCount} />
      <StatCard label="Available donations" value={availableCount} valueColor={colors.blueDark} />
      <StatCard label="Reserved donations" value={reservedCount} valueColor="#c59d1b" />
    </div>
  );
}