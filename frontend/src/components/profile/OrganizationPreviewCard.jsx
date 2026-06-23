import { useNavigate } from "react-router-dom";
import { buildFileUrl } from "../../api/api";
import {
  HiOutlineMapPin,
  HiOutlineGlobeAlt,
  HiOutlineCheckBadge,
} from "react-icons/hi2";

export default function OrganizationPreviewCard({ organization }) {
  const navigate = useNavigate();
  const isVerified = organization.verification_status === "verified";

  return (
    <div className="organization-preview-card surface-card">
      <div>
        <div className="organization-preview-logo">
          {organization.logo_url ? (
            <img
              src={buildFileUrl(organization.logo_url)}
              alt={organization.name}
            />
          ) : (
            <span>
              {organization.name?.charAt(0)?.toUpperCase() || "O"}
            </span>
          )}
        </div>

        <div className="organization-preview-title-row">
          <h3>
            {organization.name}
          </h3>

          {isVerified && (
            <HiOutlineCheckBadge size={20} />
          )}
        </div>

        {organization.city && (
          <p className="organization-preview-meta">
            <HiOutlineMapPin size={15} />
            {organization.city}
          </p>
        )}

        {organization.website && (
          <p className="organization-preview-meta">
            <HiOutlineGlobeAlt size={15} />
            {organization.website}
          </p>
        )}

        <p className="organization-preview-description">
          {organization.description ||
            "This organization supports donation and community need lists."}
        </p>

        <div className="organization-preview-stats">
          <div className="organization-preview-stat">
            <div>
              Active need lists
            </div>
            <strong>
              {organization.active_need_lists}
            </strong>
          </div>

          <div className="organization-preview-stat">
            <div>
              Gallery photos
            </div>
            <strong>
              {organization.gallery_count || organization.gallery_images?.length || 0}
            </strong>
          </div>
        </div>
      </div>

      <button
        onClick={() =>
          navigate(`/organization/${encodeURIComponent(organization.email)}`)
        }
        className="organization-preview-button action-button primary"
      >
        View organization profile
      </button>
    </div>
  );
}
