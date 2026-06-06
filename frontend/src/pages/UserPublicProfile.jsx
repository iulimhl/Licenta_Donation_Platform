import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch, buildFileUrl } from "../api/api";
import { HiOutlineArrowLeft, HiOutlineMapPin, HiOutlineXMark } from "react-icons/hi2";
import "../styles/pages/PublicProfile.css";

export default function UserPublicProfile() {
  const { email } = useParams();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState("");

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const { response, data } = await apiFetch(
          `/auth/public/${encodeURIComponent(email)}`
        );

        if (response.ok) {
          setUserProfile(data);
        }
      } catch (err) {
        console.error("User profile error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [email]);

  if (loading) {
    return (
      <div className="public-profile-page">
        <div className="public-profile-box">Loading user profile...</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="public-profile-page">
        <div className="public-profile-box">User not found.</div>
      </div>
    );
  }

  return (
    <div className="public-profile-page">
      <button onClick={() => navigate(-1)} className="public-profile-back">
        <HiOutlineArrowLeft size={16} />
        <span>Back</span>
      </button>

      <div className="public-profile-card">
        <div className="public-profile-header center">
          <div className="public-profile-avatar round">
            {userProfile.logo_url ? (
              <button
                type="button"
                className="public-profile-avatar-button"
                onClick={() => setLightboxImage(buildFileUrl(userProfile.logo_url))}
              >
                <img src={buildFileUrl(userProfile.logo_url)} alt={userProfile.name} />
              </button>
            ) : (
              <span>{userProfile.name?.charAt(0)?.toUpperCase() || "U"}</span>
            )}
          </div>

          <div>
            <h1 className="public-profile-title small">{userProfile.name || "User"}</h1>

            {(userProfile.city || userProfile.location) && (
              <p className="public-profile-meta top-gap">
                <HiOutlineMapPin size={16} />
                {userProfile.city || userProfile.location}
              </p>
            )}
          </div>
        </div>

        <div className="public-profile-section">
          <h3>Active donations</h3>

          {userProfile.active_donations?.length > 0 ? (
            <div className="public-profile-grid">
              {userProfile.active_donations.map((donation) => (
                <div
                  key={donation.id}
                  onClick={() => navigate(`/donation/${donation.id}`)}
                  className="public-profile-donation-card"
                >
                  <div className="public-profile-donation-image">
                    {donation.image ? (
                      <img src={donation.image} alt={donation.title} />
                    ) : (
                      <div className="public-profile-placeholder">No image</div>
                    )}
                  </div>

                  <div className="public-profile-donation-body">
                    <h4>{donation.title}</h4>
                    <p>{donation.location}</p>
                    <p>{donation.category}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="public-profile-empty">This user has no active donations right now.</div>
          )}
        </div>
      </div>

      {lightboxImage && (
        <div className="public-profile-lightbox" onClick={() => setLightboxImage("")}>
          <div className="public-profile-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="public-profile-lightbox-image-wrap">
              <button
                type="button"
                className="public-profile-lightbox-close"
                onClick={() => setLightboxImage("")}
              >
                <HiOutlineXMark size={24} />
              </button>
              <img src={lightboxImage} alt="Profile" className="public-profile-lightbox-image" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
