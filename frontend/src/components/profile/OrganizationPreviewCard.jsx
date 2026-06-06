import { useNavigate } from "react-router-dom";
import { colors, radius, shadow } from "../../styles/theme";
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
    <div
      style={{
        background: colors.white,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.xl,
        boxShadow: shadow.soft,
        padding: "22px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "18px",
            background: "#eef4ec",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            marginBottom: "16px",
          }}
        >
          {organization.logo_url ? (
            <img
              src={buildFileUrl(organization.logo_url)}
              alt={organization.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span
              style={{
                fontWeight: 800,
                fontSize: "22px",
                color: colors.primaryDark,
              }}
            >
              {organization.name?.charAt(0)?.toUpperCase() || "O"}
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "10px",
            flexWrap: "wrap",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "24px",
              color: colors.text,
              fontWeight: 800,
            }}
          >
            {organization.name}
          </h3>

          {isVerified && (
            <HiOutlineCheckBadge size={20} color={colors.primaryDark} />
          )}
        </div>

        {organization.city && (
          <p
            style={{
              margin: "0 0 8px 0",
              color: colors.textSoft,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <HiOutlineMapPin size={15} />
            {organization.city}
          </p>
        )}

        {organization.website && (
          <p
            style={{
              margin: "0 0 12px 0",
              color: colors.textSoft,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <HiOutlineGlobeAlt size={15} />
            {organization.website}
          </p>
        )}

        <p
          style={{
            margin: "0 0 16px 0",
            color: colors.textSoft,
            lineHeight: 1.6,
            fontSize: "14px",
          }}
        >
          {organization.description ||
            "This organization supports donation and community need lists."}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "10px",
          }}
        >
          <div
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              padding: "12px",
              background: "#fafaf8",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: colors.textSoft,
                marginBottom: "4px",
              }}
            >
              Active need lists
            </div>
            <div
              style={{
                fontWeight: 800,
                color: colors.text,
                fontSize: "20px",
              }}
            >
              {organization.active_need_lists}
            </div>
          </div>

          <div
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              padding: "12px",
              background: "#fafaf8",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: colors.textSoft,
                marginBottom: "4px",
              }}
            >
              Gallery photos
            </div>
            <div
              style={{
                fontWeight: 800,
                color: colors.text,
                fontSize: "20px",
              }}
            >
              {organization.gallery_count || organization.gallery_images?.length || 0}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() =>
          navigate(`/organization/${encodeURIComponent(organization.email)}`)
        }
        style={{
          marginTop: "18px",
          background: colors.primary,
          color: colors.white,
          border: "none",
          borderRadius: radius.md,
          padding: "12px 16px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        View organization profile
      </button>
    </div>
  );
}
