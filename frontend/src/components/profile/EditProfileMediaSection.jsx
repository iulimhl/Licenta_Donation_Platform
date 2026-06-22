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
}) {
  const isOrganization = userType === "organization";
  const galleryImages = galleryPreviews.length ? galleryPreviews : form.gallery_images?.map(buildFileUrl) || [];

  return (
    <section className="edit-profile-section edit-profile-media-section">
      <div className="edit-profile-section-head">
        <h2>Profile photo</h2>
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
        <button
          type="button"
          className={`edit-profile-logo-preview ${!isOrganization ? "user-avatar" : ""}`}
          onClick={() => logoInputRef.current?.click()}
        >
          {logoPreview || form.logo_url ? (
            <img src={logoPreview || buildFileUrl(form.logo_url)} alt="Profile" />
          ) : (
            <span className="edit-profile-media-plus">+</span>
          )}
          <span>{isOrganization ? "Change logo" : "Change photo"}</span>
        </button>

        {isOrganization && (
          <button
            type="button"
            className="edit-profile-cover-preview"
            onClick={() => coverInputRef.current?.click()}
          >
            {coverPreview || form.cover_image_url ? (
              <img src={coverPreview || buildFileUrl(form.cover_image_url)} alt="Cover" />
            ) : (
              <span className="edit-profile-media-plus">+</span>
            )}
            <span>Change cover</span>
          </button>
        )}
      </div>

      {isOrganization && (
        <div className="edit-profile-gallery-block">
          <div className="edit-profile-gallery-head">
            <h3>Gallery</h3>
            <button type="button" onClick={() => galleryInputRef.current?.click()}>
              Add photos
            </button>
          </div>

          <div className="edit-profile-gallery">
            {galleryImages.map((image, index) => (
              <img key={index} src={image} alt={`Gallery ${index + 1}`} />
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
