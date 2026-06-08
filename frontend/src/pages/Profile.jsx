import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, buildFileUrl } from "../api/api";
import SectionBanner from "../components/common/SectionBanner";
import ProfileDonations from "../components/profile/ProfileDonations";
import ProfileNeeds from "../components/profile/ProfileNeeds";
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineCheckBadge,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineGift,
  HiOutlinePhone,
  HiOutlineMapPin,
  HiOutlinePencilSquare,
  HiOutlineGlobeAlt,
} from "react-icons/hi2";
import { GoChecklist } from "react-icons/go";
import "../styles/pages/Profile.css";

function getVerificationBadge(status) {
  if (status === "verified") {
    return {
      text: "Verified organization",
      icon: <HiOutlineCheckBadge size={18} />,
      className: "verified",
    };
  }

  if (status === "pending") {
    return {
      text: "Verification pending",
      icon: <HiOutlineClock size={18} />,
      className: "pending",
    };
  }

  if (status === "rejected") {
    return {
      text: "Verification rejected",
      icon: <HiOutlineXCircle size={18} />,
      className: "rejected",
    };
  }

  return {
    text: "Not verified yet",
    icon: <HiOutlineClock size={18} />,
    className: "unverified",
  };
}

function DetailItem({ icon, label, value }) {
  if (!value) return null;

  return (
    <div className="profile-detail-item">
      <span className="profile-detail-icon" aria-hidden="true">{icon}</span>
      <div className="profile-detail-text">
        <strong>{label}</strong>
        <span>{value}</span>
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");

  const [myDonations, setMyDonations] = useState([]);
  const [myNeeds, setMyNeeds] = useState([]);
  const [userType, setUserType] = useState("");
  const [userName, setUserName] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [verificationScore, setVerificationScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("donations");
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    async function loadProfileData() {
      try {
        const { data: fetchedUserData } = await apiFetch(`/auth/user/${userEmail}`);

        if (!fetchedUserData) {
          setLoading(false);
          return;
        }

        setUserData(fetchedUserData);
        setUserType(fetchedUserData.user_type);
        setUserName(fetchedUserData.name || userEmail);
        setVerificationStatus(fetchedUserData.verification_status || "unverified");
        setVerificationScore(fetchedUserData.verification_score ?? null);

        const { data: donationsData } = await apiFetch("/donations/");
        setMyDonations((donationsData || []).filter((item) => item.owner_email === userEmail));

        const { data: needsData } = await apiFetch("/needs/");
        setMyNeeds((needsData || []).filter((item) => item.organization_email === userEmail));
      } catch (err) {
        console.error("Error loading profile data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [userEmail]);

  const activeDonations = useMemo(
    () => myDonations.filter((item) => item.status === "available" || item.status === "reserved").length,
    [myDonations]
  );

  async function handleDeleteDonation(id) {
    if (!window.confirm("Sigur vrei sa stergi definitiv aceasta donatie?")) return;

    try {
      const params = new URLSearchParams({ actor_email: userEmail });
      const { response } = await apiFetch(`/donations/${id}?${params.toString()}`, { method: "DELETE" });

      if (!response.ok) {
        alert("Eroare la stergerea de pe server.");
        return;
      }

      setMyDonations((prev) => prev.filter((item) => item.id !== id));
      alert("Donatia a fost stearsa!");
    } catch (err) {
      console.error("Error:", err);
      alert("Nu s-a putut contacta serverul.");
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      const params = new URLSearchParams({ new_status: newStatus });
      if (userEmail) params.set("user_email", userEmail);

      const { response, data } = await apiFetch(`/donations/${id}/status?${params.toString()}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        alert(data?.detail || "Error updating status");
        return;
      }

      setMyDonations((prev) =>
        prev.map((item) => (item.id === id ? data : item))
      );
    } catch (err) {
      alert("Error updating status");
    }
  }

  async function handleDeleteNeed(id) {
    if (!window.confirm("Sigur vrei sa stergi definitiv aceasta lista de necesitati?")) return;

    try {
      const params = new URLSearchParams({ actor_email: userEmail });
      const { response } = await apiFetch(`/needs/${id}?${params.toString()}`, { method: "DELETE" });

      if (!response.ok) {
        alert("Eroare la stergere.");
        return;
      }

      setMyNeeds((prev) => prev.filter((item) => item.id !== id));
      alert("Lista de necesitati a fost stearsa!");
    } catch (err) {
      console.error("Error:", err);
      alert("Nu s-a putut contacta serverul.");
    }
  }

  function renderTabButton(key, label, icon) {
    const isActive = tab === key;

    return (
      <button
        onClick={() => setTab(key)}
        className={`profile-tab-button ${isActive ? "active" : ""}`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  if (loading) {
    return <div className="profile-loading">Loading...</div>;
  }

  const isOrganization = userType === "organization";
  const verificationBadge = getVerificationBadge(verificationStatus);
  const coverImage = isOrganization ? buildFileUrl(userData?.cover_image_url) : "";
  const avatarImage = buildFileUrl(userData?.logo_url);
  const galleryImages = isOrganization ? (userData?.gallery_images || []).map(buildFileUrl).filter(Boolean) : [];

  return (
    <div className="pattern-bg profile-page">
      <SectionBanner
        title="My Profile"
        subtitle={isOrganization ? "Manage your organization profile and activity." : "Manage your profile and donations."}
      />

      <div className="profile-container">
        <section className="profile-hero">
          {isOrganization && coverImage ? (
            <div className="profile-cover">
              <img src={coverImage} alt="Profile cover" />
            </div>
          ) : (
            <div className="profile-cover empty" />
          )}

          <div className="profile-summary">
            <div className={`profile-avatar ${!avatarImage ? "empty" : ""}`}>
              {avatarImage ? (
                <img src={avatarImage} alt={userName} />
              ) : (
                <span>{userName?.charAt(0)?.toUpperCase() || "U"}</span>
              )}
            </div>

            <div className="profile-identity">
              <div className="profile-title-row">
                <div>
                  <h1>{userName}</h1>
                  <p>{isOrganization ? "Organization account" : "Personal account"}</p>
                </div>

                <button onClick={() => navigate("/edit-profile")} className="profile-edit-button">
                  <HiOutlinePencilSquare size={18} />
                  <span>Edit profile</span>
                </button>
              </div>

            </div>

            {isOrganization && (
              <div className="profile-status-row">
                <div className={`profile-verification-badge ${verificationBadge.className}`}>
                  {verificationBadge.icon}
                  <span>{verificationBadge.text}</span>
                  {verificationScore !== null && <span>({verificationScore}%)</span>}
                </div>
              </div>
            )}

            <div className="profile-details">
              <DetailItem
                icon={<HiOutlineUser size={18} />}
                label="Type"
                value={isOrganization ? "Organization" : "User"}
              />
              <DetailItem icon={<HiOutlineEnvelope size={18} />} label="Email" value={userEmail} />
              <DetailItem icon={<HiOutlinePhone size={18} />} label="Phone" value={userData?.phone} />
              <DetailItem
                icon={<HiOutlineMapPin size={18} />}
                label="Location"
                value={userData?.city || userData?.location}
              />
              {isOrganization && (
                <DetailItem icon={<HiOutlineGlobeAlt size={18} />} label="Website" value={userData?.website} />
              )}
            </div>
          </div>

          {isOrganization && galleryImages.length > 0 && (
            <div className="profile-gallery-strip">
              {galleryImages.slice(0, 4).map((image, index) => (
                <img key={index} src={image} alt={`Gallery ${index + 1}`} />
              ))}
            </div>
          )}

          {isOrganization && verificationStatus !== "verified" && (
            <div className={`profile-verification-alert ${verificationStatus === "rejected" ? "rejected" : "pending"}`}>
              <h3>
                {verificationStatus === "rejected"
                  ? "Organization access is restricted"
                  : "Organization verification is still pending"}
              </h3>

              <p>
                {verificationStatus === "rejected"
                  ? "You cannot post need lists until your account is reviewed again by admin."
                  : "You can complete your profile and browse the platform, but posting need lists is disabled until an admin approves your organization account."}
              </p>
            </div>
          )}
        </section>

        <section className="profile-posts-section">
          <div className="profile-posts-header">
            <div>
              <h2>My posts</h2>
              <p>
                {isOrganization
                  ? `${myDonations.length} donations, ${myNeeds.length} need lists`
                  : `${myDonations.length} donations, ${activeDonations} active`}
              </p>
            </div>

            <div className="profile-tabs">
              {renderTabButton("donations", `Donations (${myDonations.length})`, <HiOutlineGift size={18} />)}

              {isOrganization &&
                renderTabButton("needs", `Need lists (${myNeeds.length})`, <GoChecklist size={18} />)}
            </div>
          </div>

          {tab === "donations" && (
            <ProfileDonations
              myDonations={myDonations}
              handleStatusChange={handleStatusChange}
              handleDeleteDonation={handleDeleteDonation}
            />
          )}

          {tab === "needs" && (
            <ProfileNeeds myNeeds={myNeeds} navigate={navigate} handleDeleteNeed={handleDeleteNeed} />
          )}
        </section>
      </div>
    </div>
  );
}
