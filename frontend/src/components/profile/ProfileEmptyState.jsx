export default function ProfileEmptyState({ text, action, onAction }) {
  return (
    <div className="profile-empty-state surface-card">
      <p>{text}</p>
      {action && (
        <button type="button" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}
