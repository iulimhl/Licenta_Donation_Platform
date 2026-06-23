export default function EditProfileVerificationSection({
  userType,
  verificationStatus,
  rejectionReason,
  verificationFile,
  resubmittingVerification,
  inputRef,
  onFileChange,
  onResubmit,
}) {
  if (userType !== "organization" || verificationStatus === "verified") {
    return null;
  }

  return (
    <section className="edit-profile-section">
      <div className="edit-profile-section-head">
        <h2>Organization verification</h2>
        <p>
          {verificationStatus === "pending"
            ? "Your verification request is waiting for admin review."
            : "Upload the fiscal registration certificate again and send the account back to admin review."}
        </p>
        {verificationStatus === "rejected" && rejectionReason && (
          <p className="edit-profile-rejection-note">
            Admin note: {rejectionReason}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.pdf"
        onChange={(event) => onFileChange(event.target.files?.[0])}
        className="edit-profile-hidden-file"
      />

      {verificationStatus === "pending" ? (
        <div className="edit-profile-map-tools">
          <p>No action is needed right now. An admin can approve or reject the request.</p>
        </div>
      ) : (
        <div className="edit-profile-map-tools">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="edit-profile-location-button"
          >
            Choose verification document
          </button>

          {verificationFile && <p>{verificationFile.name}</p>}

          <button
            type="button"
            onClick={onResubmit}
            disabled={resubmittingVerification || !verificationFile}
            className="form-button primary"
          >
            {resubmittingVerification ? "Sending..." : "Request review again"}
          </button>
        </div>
      )}
    </section>
  );
}
