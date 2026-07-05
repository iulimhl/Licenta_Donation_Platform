import { buildFileUrl } from "../../api/api";

export default function EditProfileMediaSection({
  userType,
  form,
  logoInputRef,
  coverInputRef,
  galleryInputRef,
  logoPreview,
  coverPreview,
  galleryPreviews,
  onLogoFile,
  onCoverFile,
  onGalleryFiles,
  onRemoveLogo,
  onRemoveCover,
  onRemoveExistingGalleryImage,
  onRemoveNewGalleryImage,
}) {
  const isOrganization = userType === "organization";
  const existingGalleryImages = form.gallery_images?.map(buildFileUrl) || [];

  return (
    <section className="edit-profile-section edit-profile-media-section">
      <div className="edit-profile-section-head">
        <h2>Profile media</h2>
        <p>
          {isOrganization
            ? "Update the logo, cover and gallery shown on your organization profile."
            : "Update the photo shown on your profile and in conversations."}
        </p>
      </div>

      <input
        ref={logoInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        onChange={(event) => onLogoFile(event.target.files?.[0])}
        className="edit-profile-hidden-file"
      />

      {isOrganization && (
        <>
          <input
            ref={coverInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            onChange={(event) => onCoverFile(event.target.files?.[0])}
            className="edit-profile-hidden-file"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            multiple
            onChange={(event) => onGalleryFiles(event.target.files)}
            className="edit-profile-hidden-file"
          />
        </>
      )}

      <div className="edit-profile-photo-stack">
        <div className="edit-profile-media-item compact">
          <div className="edit-profile-media-item-head">
            <h3>Profile picture</h3>
          </div>

          <div className="edit-profile-media-preview-wrap compact">
            <button
              type="button"
              className={`edit-profile-logo-preview ${!isOrganization ? "user-avatar" : ""}`}
              onClick={() => logoInputRef.current?.click()}
            >
              {logoPreview || form.logo_url ? (
                <img src={logoPreview || buildFileUrl(form.logo_url)} alt="Profile" />
              ) : (
                <>
                  <span className="edit-profile-media-plus">+</span>
                  <strong>{isOrganization ? "Add logo" : "Add photo"}</strong>
                </>
              )}
              {(logoPreview || form.logo_url) && (
                <span>{isOrganization ? "Change logo" : "Change photo"}</span>
              )}
            </button>

            {(logoPreview || form.logo_url) && (
              <button
                type="button"
                className="edit-profile-remove-media"
                onClick={onRemoveLogo}
                aria-label="Remove logo"
              >
                x
              </button>
            )}
          </div>
        </div>

        {isOrganization && (
          <div className="edit-profile-media-item">
            <div className="edit-profile-media-item-head">
              <h3>Cover photo</h3>
            </div>

            <div className="edit-profile-media-preview-wrap">
              <button
                type="button"
                className="edit-profile-cover-preview"
                onClick={() => coverInputRef.current?.click()}
              >
                {coverPreview || form.cover_image_url ? (
                  <img src={coverPreview || buildFileUrl(form.cover_image_url)} alt="Cover" />
                ) : (
                  <>
                    <span className="edit-profile-media-plus">+</span>
                    <strong>Add cover</strong>
                  </>
                )}
                {(coverPreview || form.cover_image_url) && <span>Change cover</span>}
              </button>

              {(coverPreview || form.cover_image_url) && (
                <button
                  type="button"
                  className="edit-profile-remove-media"
                  onClick={onRemoveCover}
                  aria-label="Remove cover photo"
                >
                  x
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {isOrganization && (
        <div className="edit-profile-gallery-block">
          <div className="edit-profile-gallery-head">
            <h3>Gallery</h3>
          </div>

          <div className="edit-profile-gallery">
            {existingGalleryImages.map((image, index) => (
              <div key={`existing-${index}`} className="edit-profile-gallery-item">
                <img src={image} alt={`Gallery ${index + 1}`} />
                <button
                  type="button"
                  className="edit-profile-gallery-remove"
                  onClick={() => onRemoveExistingGalleryImage(index)}
                  aria-label="Remove gallery photo"
                >
                  x
                </button>
              </div>
            ))}

            {galleryPreviews.map((image, index) => (
              <div key={`new-${index}`} className="edit-profile-gallery-item">
                <img src={image} alt={`New gallery ${index + 1}`} />
                <button
                  type="button"
                  className="edit-profile-gallery-remove"
                  onClick={() => onRemoveNewGalleryImage(index)}
                  aria-label="Remove selected photo"
                >
                  x
                </button>
              </div>
            ))}

            <button
              type="button"
              className="edit-profile-add-photo"
              onClick={() => galleryInputRef.current?.click()}
            >
              <span>+</span>
              Add Photo
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
