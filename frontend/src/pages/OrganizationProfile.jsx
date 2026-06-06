import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch, buildFileUrl } from "../api/api";
import NeedCard from "../components/NeedCard";
import {
  HiOutlineArrowLeft,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineXMark,
  HiOutlineMapPin,
  HiOutlineGlobeAlt,
  HiOutlinePhone,
  HiOutlineCheckBadge,
  HiOutlineCalendarDays,
} from "react-icons/hi2";
import "../styles/pages/PublicProfile.css";

export default function OrganizationProfile() {
  const { email } = useParams();
  const navigate = useNavigate();

  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    async function loadOrganization() {
      try {
        const { response, data } = await apiFetch(
          `/organizations/public/${encodeURIComponent(email)}`
        );

        if (response.ok) {
          setOrganization(data);
        }
      } catch (err) {
        console.error("Organization profile error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadOrganization();
  }, [email]);

  if (loading) {
    return (
      <div className="public-profile-page">
        <div className="public-profile-box">Loading organization...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="public-profile-page">
        <div className="public-profile-box">Organization not found.</div>
      </div>
    );
  }

  const isVerified = organization.verification_status === "verified";
  const galleryImages = (organization.gallery_images || []).map(buildFileUrl);
  const needLists = organization.need_lists || [];
  const currentUserEmail = localStorage.getItem("userEmail");

  function openLightbox(images, index = 0, label = "Profile image") {
    setLightbox({ images, index, label, showCounter: images.length > 1 });
  }

  function closeLightbox() {
    setLightbox(null);
  }

  function goToLightboxImage(direction) {
    setLightbox((prev) => {
      if (!prev || prev.images.length <= 1) return prev;
      const nextIndex = (prev.index + direction + prev.images.length) % prev.images.length;
      return { ...prev, index: nextIndex };
    });
  }

  return (
    <div className="public-profile-page">
      <button onClick={() => navigate(-1)} className="public-profile-back">
        <HiOutlineArrowLeft size={16} />
        <span>Back</span>
      </button>

      {organization.cover_image_url && (
        <button
          type="button"
          className="public-profile-cover public-profile-image-button"
          onClick={() =>
            openLightbox([buildFileUrl(organization.cover_image_url)], 0, "Cover image")
          }
        >
          <img
            src={buildFileUrl(organization.cover_image_url)}
            alt="Organization cover"
          />
        </button>
      )}

      <div className="public-profile-card">
        <div className="public-profile-header">
          <div className="public-profile-avatar">
            {organization.logo_url ? (
              <button
                type="button"
                className="public-profile-avatar-button"
                onClick={() =>
                  openLightbox([buildFileUrl(organization.logo_url)], 0, "Profile image")
                }
              >
                <img
                  src={buildFileUrl(organization.logo_url)}
                  alt={organization.name}
                />
              </button>
            ) : (
              <span>{organization.name?.charAt(0)?.toUpperCase() || "O"}</span>
            )}
          </div>

          <div className="public-profile-main">
            <div className="public-profile-title-row">
              <h1 className="public-profile-title">{organization.name}</h1>
              {isVerified && (
                <HiOutlineCheckBadge size={24} color="#2f5d34" />
              )}
            </div>

            <div className="public-profile-meta-list">
              {organization.city && (
                <p className="public-profile-meta">
                  <HiOutlineMapPin size={16} />
                  {organization.city}
                </p>
              )}

              {organization.pickup_address && (
                <p className="public-profile-meta">
                  <HiOutlineMapPin size={16} />
                  {organization.pickup_address}
                </p>
              )}

              {organization.website && (
                <p className="public-profile-meta">
                  <HiOutlineGlobeAlt size={16} />
                  {organization.website}
                </p>
              )}

              {organization.phone_visible && organization.phone && (
                <p className="public-profile-meta">
                  <HiOutlinePhone size={16} />
                  <a href={`tel:${organization.phone}`}>{organization.phone}</a>
                </p>
              )}

              {organization.founded_year && (
                <p className="public-profile-meta">
                  <HiOutlineCalendarDays size={16} />
                  Founded in {organization.founded_year}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="public-profile-stats">
          <StatBox
            label="Active need lists"
            value={organization.active_need_lists}
          />
          <StatBox
            label="Gallery photos"
            value={organization.gallery_count || galleryImages.length}
          />
        </div>

        <div className="public-profile-section">
          <h3>About</h3>
          <p>{organization.description || "No description added yet."}</p>
        </div>

        {organization.mission && (
          <div className="public-profile-section">
            <h3>Mission</h3>
            <p>{organization.mission}</p>
          </div>
        )}

        {galleryImages.length > 0 && (
          <div className="public-profile-section">
            <h3>Gallery</h3>
            <div className="public-profile-gallery">
              {galleryImages.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  className="public-profile-gallery-item"
                  onClick={() => openLightbox(galleryImages, index, "Gallery image")}
                >
                  <img
                    src={img}
                    alt={`gallery-${index + 1}`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="public-profile-section">
          <h3>Need lists</h3>
          {needLists.length > 0 ? (
            <div className="public-profile-need-grid">
              {needLists.map((need) => (
                <NeedCard
                  key={need.id}
                  need={need}
                  currentUserEmail={currentUserEmail}
                  isOwner={false}
                />
              ))}
            </div>
          ) : (
            <div className="public-profile-empty">
              This organization has no active need lists yet.
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <ProfileImageLightbox
          lightbox={lightbox}
          onClose={closeLightbox}
          onPrevious={() => goToLightboxImage(-1)}
          onNext={() => goToLightboxImage(1)}
        />
      )}
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="public-profile-stat">
      <div className="public-profile-stat-label">{label}</div>
      <div className="public-profile-stat-value">{value}</div>
    </div>
  );
}

function ProfileImageLightbox({ lightbox, onClose, onPrevious, onNext }) {
  const hasMultipleImages = lightbox.images.length > 1;

  return (
    <div className="public-profile-lightbox" onClick={onClose}>
      <div className="public-profile-lightbox-content" onClick={(e) => e.stopPropagation()}>
        <div className="public-profile-lightbox-image-wrap">
          <button type="button" className="public-profile-lightbox-close" onClick={onClose}>
            <HiOutlineXMark size={24} />
          </button>

          <img
            src={lightbox.images[lightbox.index]}
            alt={`${lightbox.label} ${lightbox.index + 1}`}
            className="public-profile-lightbox-image"
          />
        </div>

        {hasMultipleImages && (
          <div className="public-profile-lightbox-controls">
            <button
              type="button"
              className="public-profile-lightbox-nav"
              onClick={onPrevious}
              aria-label="Previous image"
            >
              <HiOutlineChevronLeft size={24} />
            </button>

            <div className="public-profile-lightbox-counter">
              {lightbox.index + 1} din {lightbox.images.length}
            </div>

            <button
              type="button"
              className="public-profile-lightbox-nav"
              onClick={onNext}
              aria-label="Next image"
            >
              <HiOutlineChevronRight size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
