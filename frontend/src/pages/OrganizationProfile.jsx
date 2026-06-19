import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch, buildFileUrl } from "../api/api";
import NeedCard from "../components/NeedCard";
import ProfileHeroCard from "../components/profile/ProfileHeroCard";
import {
  HiOutlineArrowLeft,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineXMark,
  HiOutlineMapPin,
  HiOutlineGlobeAlt,
  HiOutlinePhone,
  HiOutlineEnvelope,
} from "react-icons/hi2";
import "../styles/pages/Profile.css";
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

  const galleryImages = (organization.gallery_images || []).map(buildFileUrl);
  const needLists = organization.need_lists || [];
  const currentUserEmail = localStorage.getItem("userEmail");
  const displayLocation = organization.city || organization.location;
  const coverImage = buildFileUrl(organization.cover_image_url);
  const avatarImage = buildFileUrl(organization.logo_url);
  const publicDetails = [
    {
      icon: <HiOutlineEnvelope size={18} />,
      label: "Email",
      value: organization.email,
      href: `mailto:${organization.email}`,
    },
    organization.phone_visible && organization.phone && {
      icon: <HiOutlinePhone size={18} />,
      label: "Phone",
      value: organization.phone,
      href: `tel:${organization.phone}`,
    },
    displayLocation && {
      icon: <HiOutlineMapPin size={18} />,
      label: "Location",
      value: displayLocation,
    },
    organization.website && {
      icon: <HiOutlineGlobeAlt size={18} />,
      label: "Website",
      value: organization.website,
      href: organization.website.startsWith("http") ? organization.website : `https://${organization.website}`,
    },
    organization.pickup_address && {
      icon: <HiOutlineMapPin size={18} />,
      label: "Pickup address",
      value: organization.pickup_address,
    },
  ].filter(Boolean);

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

      <ProfileHeroCard
        title={organization.name}
        subtitle="Organization account"
        coverImage={coverImage}
        avatarImage={avatarImage}
        details={publicDetails}
        galleryImages={galleryImages}
        about={organization.description || "No description added yet."}
        onCoverClick={() => openLightbox([coverImage], 0, "Cover image")}
        onAvatarClick={() => openLightbox([avatarImage], 0, "Profile image")}
        onGalleryImageClick={(index) => openLightbox(galleryImages, index, "Gallery image")}
      />

      <div className="public-profile-card public-profile-content-card">
        {organization.mission && (
          <div className="public-profile-section">
            <h3>Mission</h3>
            <p>{organization.mission}</p>
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
