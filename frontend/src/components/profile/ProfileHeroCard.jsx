function DetailItem({ icon, label, value, href }) {
  if (!value) return null;

  return (
    <div className="profile-detail-item">
      <span className="profile-detail-icon" aria-hidden="true">{icon}</span>
      <div className="profile-detail-text">
        <strong>{label}</strong>
        {href ? (
          <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
            {value}
          </a>
        ) : (
          <span>{value}</span>
        )}
      </div>
    </div>
  );
}

export default function ProfileHeroCard({
  title,
  subtitle,
  coverImage,
  avatarImage,
  details = [],
  galleryImages = [],
  about,
  action,
  status,
  onCoverClick,
  onAvatarClick,
  onGalleryImageClick,
  children,
}) {
  const hasCoverAction = Boolean(coverImage && onCoverClick);

  return (
    <section className="profile-hero">
      {hasCoverAction ? (
        <button
          type="button"
          className="profile-cover profile-cover-button"
          onClick={onCoverClick}
          aria-label="Open cover image"
        >
          <img src={coverImage} alt="Profile cover" />
        </button>
      ) : coverImage ? (
        <div className="profile-cover">
          <img src={coverImage} alt="Profile cover" />
        </div>
      ) : (
        <div className="profile-cover empty" />
      )}

      <div className="profile-summary">
        <div className={`profile-avatar ${!avatarImage ? "empty" : ""}`}>
          {avatarImage ? (
            onAvatarClick ? (
              <button
                type="button"
                className="profile-avatar-button"
                onClick={onAvatarClick}
                aria-label="Open profile image"
              >
                <img src={avatarImage} alt={title} />
              </button>
            ) : (
              <img src={avatarImage} alt={title} />
            )
          ) : (
            <span>{title?.charAt(0)?.toUpperCase() || "U"}</span>
          )}
        </div>

        <div className="profile-identity">
          <div className="profile-title-row">
            <div>
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>

            {action}
          </div>
        </div>

        {status && <div className="profile-status-row">{status}</div>}

        {about && (
          <div className="profile-about">
            <h3>About</h3>
            <p>{about}</p>
          </div>
        )}

        {details.length > 0 && (
          <div className="profile-details">
            {details.map((detail) => (
              <DetailItem key={detail.label} {...detail} />
            ))}
          </div>
        )}
      </div>

      {galleryImages.length > 0 && (
        <div className="profile-gallery-strip">
          {galleryImages.slice(0, 4).map((image, index) =>
            onGalleryImageClick ? (
              <button
                key={index}
                type="button"
                className="profile-gallery-button"
                onClick={() => onGalleryImageClick(index)}
                aria-label={`Open gallery image ${index + 1}`}
              >
                <img src={image} alt={`Gallery ${index + 1}`} />
              </button>
            ) : (
              <img key={index} src={image} alt={`Gallery ${index + 1}`} />
            )
          )}
        </div>
      )}

      {children}
    </section>
  );
}
