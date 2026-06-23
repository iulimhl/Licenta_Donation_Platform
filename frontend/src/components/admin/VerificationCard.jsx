import {
  HiOutlineBuildingOffice2,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
  HiOutlineEnvelope,
  HiOutlineIdentification,
  HiOutlineMapPin,
  HiOutlineShieldCheck,
  HiOutlineXCircle,
} from "react-icons/hi2";

function getScoreLabel(score) {
  if (score >= 80) return "Strong match";
  if (score >= 40) return "Possible match";
  if (score > 0) return "Weak match";
  return "No match";
}

export default function VerificationCard({
  organization,
  actionLoadingId,
  onApprove,
  onReject,
  onOpenDocument,
}) {
  const score = organization.verification_score ?? 0;
  const isLoading = actionLoadingId === organization.id;

  return (
    <div className="admin-verification-card surface-card">
      <div className="admin-verification-card-header">
        <div className="admin-verification-card-icon">
          <HiOutlineBuildingOffice2 size={22} />
        </div>

        <div>
          <h3>{organization.name || "Unnamed organization"}</h3>
          <p>Pending verification</p>
        </div>
      </div>

      <InfoRow icon={<HiOutlineEnvelope size={17} />} label="Email" value={organization.email} />
      <InfoRow icon={<HiOutlineIdentification size={17} />} label="CIF" value={organization.cif || "Not provided"} />
      <InfoRow icon={<HiOutlineMapPin size={17} />} label="Location" value={organization.location || "Not provided"} />
      <InfoRow icon={<HiOutlineDocumentText size={17} />} label="Matched name" value={organization.matched_name || "No match found"} />
      <InfoRow icon={<HiOutlineIdentification size={17} />} label="Matched CIF" value={organization.matched_cif || "No CIF match"} />
      <InfoRow icon={<HiOutlineShieldCheck size={17} />} label="Registry source" value={organization.verification_source || "Unknown source"} />

      {organization.document_url ? (
        <button onClick={() => onOpenDocument(organization)} className="admin-verification-doc-btn">
          <HiOutlineDocumentText size={18} />
          <span>View document</span>
        </button>
      ) : (
        <div className="admin-verification-no-doc">No document uploaded</div>
      )}

      <div className="admin-verification-score-box">
        <div className="admin-verification-score-label">Verification score</div>
        <div className="admin-verification-score-value">{score}</div>
        <div className="admin-verification-score-text">{getScoreLabel(score)}</div>
      </div>

      <div className="admin-verification-actions">
        <button
          onClick={() => onApprove(organization.id)}
          disabled={isLoading}
          className={`admin-verification-approve-btn ${isLoading ? "admin-verification-btn-disabled" : ""}`}
        >
          <HiOutlineCheckCircle size={18} />
          <span>Approve</span>
        </button>

        <button
          onClick={() => onReject(organization)}
          disabled={isLoading}
          className={`admin-verification-reject-btn ${isLoading ? "admin-verification-btn-disabled" : ""}`}
        >
          <HiOutlineXCircle size={18} />
          <span>Reject</span>
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="admin-info-row">
      <div className="admin-info-row-icon">{icon}</div>

      <div>
        <div className="admin-info-row-label">{label}</div>
        <div className="admin-info-row-value">{value}</div>
      </div>
    </div>
  );
}
