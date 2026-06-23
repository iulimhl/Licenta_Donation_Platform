import { HiOutlineXMark } from "react-icons/hi2";
import { API_BASE } from "../../api/api";

export default function DocumentModal({
  organization,
  actionLoadingId,
  onClose,
  onApprove,
  onReject,
}) {
  if (!organization) return null;

  const documentUrl = organization.document_url ? `${API_BASE}${organization.document_url}` : null;
  const normalizedUrl = String(documentUrl || "").toLowerCase();
  const isImage =
    normalizedUrl.endsWith(".png") ||
    normalizedUrl.endsWith(".jpg") ||
    normalizedUrl.endsWith(".jpeg") ||
    normalizedUrl.endsWith(".webp");
  const isPdf = normalizedUrl.endsWith(".pdf");
  const isLoading = actionLoadingId === organization.id;

  return (
    <div onClick={onClose} className="admin-verification-modal-overlay">
      <div onClick={(event) => event.stopPropagation()} className="admin-verification-modal">
        <div className="admin-verification-modal-header">
          <div>
            <h3>Review document</h3>
            <p>{organization.name || "Organization"} - {organization.email}</p>
          </div>

          <button onClick={onClose} className="admin-verification-modal-x">
            <HiOutlineXMark size={22} />
          </button>
        </div>

        <div className="admin-verification-modal-body">
          {isImage ? (
            <img src={documentUrl} alt="Verification document" className="admin-verification-modal-image" />
          ) : isPdf ? (
            <iframe src={documentUrl} title="Verification document" className="admin-verification-modal-pdf" />
          ) : (
            <a href={documentUrl} target="_blank" rel="noreferrer" className="admin-verification-modal-link">
              Open document in new tab
            </a>
          )}
        </div>

        <div className="admin-verification-modal-footer">
          <button onClick={onClose} className="admin-verification-close-btn">
            Close
          </button>

          <button
            onClick={() => onReject(organization)}
            disabled={isLoading}
            className={`admin-verification-modal-reject-btn ${isLoading ? "admin-verification-btn-disabled" : ""}`}
          >
            Reject
          </button>

          <button
            onClick={() => onApprove(organization.id)}
            disabled={isLoading}
            className={`admin-verification-modal-approve-btn ${isLoading ? "admin-verification-btn-disabled" : ""}`}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
