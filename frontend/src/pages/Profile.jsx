export default function Profile({ user }) {
  return (
    <div>
      <h2>My Profile</h2>
      <div
        style={{
          border: "1px solid #333",
          borderRadius: 12,
          padding: 16,
          maxWidth: 420,
          background: "#111",
        }}
      >
        <p><b>Name:</b> {user.name}</p>
        <p><b>Email:</b> {user.email}</p>
      </div>
    </div>
  );
}