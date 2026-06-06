import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, API_BASE } from "../api/api";
import { colors } from "../styles/theme";
import {
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineBuildingOffice2,
  HiOutlineEnvelope,
  HiOutlineMapPin,
  HiOutlineIdentification,
  HiOutlineXMark,
  HiOutlineDocumentText,
} from "react-icons/hi2";
import "../styles/pages/AdminVerification.css";

const ADMIN_EMAIL = "mihalescu_iulia@yahoo.com";

export default function AdminVerification() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null);

  useEffect(() => {
    if (!userEmail) {
      navigate("/login");
      return;
    }

    if (userEmail !== ADMIN_EMAIL) {
      navigate("/");
      return;
    }

    loadPendingOrganizations();
  }, [userEmail, navigate]);

  async function loadPendingOrganizations() {
    try {
      setLoading(true);
      const params = new URLSearchParams({ admin_email: userEmail });
      const { response, data } = await apiFetch(`/verification/pending?${params.toString()}`);

      if (response.ok) {
        setOrganizations(data || []);
      } else {
        setOrganizations([]);
      }
    } catch (err) {
      console.error("Error loading pending organizations:", err);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(userId) {
    try {
      setActionLoadingId(userId);
      const params = new URLSearchParams({ admin_email: userEmail });
      const { response } = await apiFetch(`/verification/approve/${userId}?${params.toString()}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        alert("Could not approve organization.");
        return;
      }

      setOrganizations((prev) => prev.filter((org) => org.id !== userId));

      if (selectedOrg?.id === userId) {
        setSelectedOrg(null);
      }
    } catch (err) {
      console.error("Approve error:", err);
      alert("Server error while approving.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReject(userId) {
    try {
      setActionLoadingId(userId);
      const params = new URLSearchParams({ admin_email: userEmail });
      const { response } = await apiFetch(`/verification/reject/${userId}?${params.toString()}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        alert("Could not reject organization.");
        return;
      }

      setOrganizations((prev) => prev.filter((org) => org.id !== userId));

      if (selectedOrg?.id === userId) {
        setSelectedOrg(null);
      }
    } catch (err) {
      console.error("Reject error:", err);
      alert("Server error while rejecting.");
    } finally {
      setActionLoadingId(null);
    }
  }

  function openDocumentModal(org) {
    setSelectedOrg(org);
  }

  function closeDocumentModal() {
    setSelectedOrg(null);
  }

  const selectedDocUrl =
    selectedOrg?.document_url ? `${API_BASE}${selectedOrg.document_url}` : null;

  const isImage =
    selectedDocUrl &&
    (selectedDocUrl.endsWith(".png") ||
      selectedDocUrl.endsWith(".jpg") ||
      selectedDocUrl.endsWith(".jpeg") ||
      selectedDocUrl.endsWith(".webp"));

  const isPdf = selectedDocUrl && selectedDocUrl.endsWith(".pdf");

  return (
    <div className="admin-verification-page">
      <section className="admin-verification-hero">
        <div className="admin-verification-hero-overlay" />

        <div className="admin-verification-hero-content">
          <div className="admin-verification-eyebrow">
            <HiOutlineShieldCheck size={16} />
            <span>Admin panel</span>
          </div>

          <h1 className="admin-verification-title">Organization Verification</h1>

          <p className="admin-verification-subtitle">
            Review pending organization accounts and approve only trusted entities.
          </p>
        </div>
      </section>

      <div className="admin-verification-container">
        {loading ? (
          <div className="admin-verification-loading">
            Loading pending organizations...
          </div>
        ) : organizations.length === 0 ? (
          <div className="admin-verification-empty">
            <h3>No pending organizations</h3>
            <p>All organization verification requests have been reviewed.</p>
          </div>
        ) : (
          <div className="admin-verification-grid">
            {organizations.map((org) => (
              <div key={org.id} className="admin-verification-card">
                <div className="admin-verification-card-header">
                  <div className="admin-verification-card-icon">
                    <HiOutlineBuildingOffice2 size={22} />
                  </div>

                  <div>
                    <h3>{org.name || "Unnamed organization"}</h3>
                    <p>Pending verification</p>
                  </div>
                </div>

                <InfoRow
                  icon={<HiOutlineEnvelope size={17} />}
                  label="Email"
                  value={org.email}
                />

                <InfoRow
                  icon={<HiOutlineIdentification size={17} />}
                  label="CIF"
                  value={org.cif || "Not provided"}
                />

                <InfoRow
                  icon={<HiOutlineMapPin size={17} />}
                  label="Location"
                  value={org.location || "Not provided"}
                />

                <InfoRow
                  icon={<HiOutlineDocumentText size={17} />}
                  label="Matched name"
                  value={org.matched_name || "No match found"}
                />

                <InfoRow
                  icon={<HiOutlineIdentification size={17} />}
                  label="Matched CIF"
                  value={org.matched_cif || "No CIF match"}
                />

                <InfoRow
                  icon={<HiOutlineShieldCheck size={17} />}
                  label="Registry source"
                  value={org.verification_source || "Unknown source"}
                />

                {org.document_url ? (
                  <button
                    onClick={() => openDocumentModal(org)}
                    className="admin-verification-doc-btn"
                  >
                    <HiOutlineDocumentText size={18} />
                    <span>View document</span>
                  </button>
                ) : (
                  <div className="admin-verification-no-doc">
                    No document uploaded
                  </div>
                )}

                <div className="admin-verification-score-box">
                  <div className="admin-verification-score-label">
                    Verification score
                  </div>

                  <div className="admin-verification-score-value">
                    {org.verification_score ?? 0}
                  </div>

                  <div className="admin-verification-score-text">
                    {getScoreLabel(org.verification_score ?? 0)}
                  </div>
                </div>

                <div className="admin-verification-actions">
                  <button
                    onClick={() => handleApprove(org.id)}
                    disabled={actionLoadingId === org.id}
                    className={`admin-verification-approve-btn ${
                      actionLoadingId === org.id ? "admin-verification-btn-disabled" : ""
                    }`}
                  >
                    <HiOutlineCheckCircle size={18} />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => handleReject(org.id)}
                    disabled={actionLoadingId === org.id}
                    className={`admin-verification-reject-btn ${
                      actionLoadingId === org.id ? "admin-verification-btn-disabled" : ""
                    }`}
                  >
                    <HiOutlineXCircle size={18} />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedOrg && (
        <div onClick={closeDocumentModal} className="admin-verification-modal-overlay">
          <div
            onClick={(e) => e.stopPropagation()}
            className="admin-verification-modal"
          >
            <div className="admin-verification-modal-header">
              <div>
                <h3>Review document</h3>
                <p>
                  {selectedOrg.name || "Organization"} • {selectedOrg.email}
                </p>
              </div>

              <button
                onClick={closeDocumentModal}
                className="admin-verification-modal-x"
              >
                <HiOutlineXMark size={22} />
              </button>
            </div>

            <div className="admin-verification-modal-body">
              {isImage ? (
                <img
                  src={selectedDocUrl}
                  alt="Verification document"
                  className="admin-verification-modal-image"
                />
              ) : isPdf ? (
                <iframe
                  src={selectedDocUrl}
                  title="Verification document"
                  className="admin-verification-modal-pdf"
                />
              ) : (
                <a
                  href={selectedDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-verification-modal-link"
                >
                  Open document in new tab
                </a>
              )}
            </div>

            <div className="admin-verification-modal-footer">
              <button
                onClick={closeDocumentModal}
                className="admin-verification-close-btn"
              >
                Close
              </button>

              <button
                onClick={() => handleReject(selectedOrg.id)}
                disabled={actionLoadingId === selectedOrg.id}
                className={`admin-verification-modal-reject-btn ${
                  actionLoadingId === selectedOrg.id ? "admin-verification-btn-disabled" : ""
                }`}
              >
                Reject
              </button>

              <button
                onClick={() => handleApprove(selectedOrg.id)}
                disabled={actionLoadingId === selectedOrg.id}
                className={`admin-verification-modal-approve-btn ${
                  actionLoadingId === selectedOrg.id ? "admin-verification-btn-disabled" : ""
                }`}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getScoreLabel(score) {
  if (score >= 80) return "Strong match";
  if (score >= 40) return "Possible match";
  if (score > 0) return "Weak match";
  return "No match";
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
