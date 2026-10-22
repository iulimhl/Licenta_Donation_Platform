import { HiOutlineXMark } from "react-icons/hi2";
import { useEffect, useState } from "react";
import { API_BASE, getAuthHeaders } from "../../api/api";

export default function DocumentModal({
  organization,
  actionLoadingId,
  onClose,
  onApprove,
  onReject,
}) {
  const documentPath = organization?.document_url;
  const [document, setDocument] = useState(null);

  useEffect(() => {
    if (!documentPath) return;
    const controller = new AbortController();
    let objectUrl;

    async function loadDocument() {
      try {
        const response = await fetch(`${API_BASE}${documentPath}`, {
          headers: getAuthHeaders(),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Could not load document. Please try again.");
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setDocument({ path: documentPath, url: objectUrl });
      } catch (error) {
        if (!controller.signal.aborted) {
          setDocument({ path: documentPath, error: error.message });
        }
      }
    }

    loadDocument();
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentPath]);

  if (!organization) return null;

  const currentDocument = document?.path === documentPath ? document : null;
  const documentUrl = currentDocument?.url;
  const normalizedUrl = String(documentPath || "").toLowerCase();
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
          {currentDocument?.error ? (
            <p role="alert">{currentDocument.error}</p>
          ) : !documentUrl ? (
            <p>{documentPath ? "Loading document..." : "No document uploaded."}</p>
          ) : isImage ? (
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
