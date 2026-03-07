import Navbar from "./Navbar";

export default function Layout({ children, user, onLogout }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#fff",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 6 }}>Donation Platform</h1>
        <p style={{ marginTop: 0, color: "#aaa" }}>
          Connect donors with people and organizations in need.
        </p>

        <div style={{ marginBottom: 16 }}>
          <Navbar user={user} onLogout={onLogout} />
        </div>

        <div
          style={{
            padding: 16,
            border: "1px solid #222",
            borderRadius: 14,
            background: "#161616",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}