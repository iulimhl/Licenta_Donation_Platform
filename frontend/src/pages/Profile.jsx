import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, buildFileUrl } from "../api/api";
import SectionBanner from "../components/common/SectionBanner";
import ProfileHeroCard from "../components/profile/ProfileHeroCard";
import ProfileActivity from "../components/profile/ProfileActivity";
import ProfileDonations from "../components/profile/ProfileDonations";
import ProfileNeeds from "../components/profile/ProfileNeeds";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { useTimedNotification } from "../hooks/useTimedNotification";
import { useLanguage } from "../language/useLanguage";
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

function getVerificationBadge(status, t) {
  if (status === "verified") {
    return {
      text: t("profile.verified"),
      icon: <HiOutlineCheckBadge size={18} />,
      className: "verified",
    };
  }

  if (status === "pending") {
    return {
      text: t("profile.pending"),
      icon: <HiOutlineClock size={18} />,
      className: "pending",
    };
  }

  if (status === "rejected") {
    return {
      text: t("profile.rejected"),
      icon: <HiOutlineXCircle size={18} />,
      className: "rejected",
    };
  }

  return {
    text: t("profile.unverified"),
    icon: <HiOutlineClock size={18} />,
    className: "unverified",
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");
  const { confirm, confirmDialog } = useConfirmDialog();
  const { notification, showNotification } = useTimedNotification(3200);
  const { t } = useLanguage();

  const [myDonations, setMyDonations] = useState([]);
  const [myNeeds, setMyNeeds] = useState([]);
  const [reservedDonations, setReservedDonations] = useState([]);
  const [sentOffers, setSentOffers] = useState([]);
  const [userType, setUserType] = useState("");
  const [userName, setUserName] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
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

        const { data: donationsData } = await apiFetch("/donations/");
        const donations = donationsData || [];
        setMyDonations(donations.filter((item) => item.owner_email === userEmail));
        setReservedDonations(
          donations.filter((item) => item.status === "reserved" && item.reserved_by_email === userEmail)
        );

        const { data: needsData } = await apiFetch("/needs/");
        setMyNeeds((needsData || []).filter((item) => item.organization_email === userEmail));

        const { response: offersResponse, data: offersData } = await apiFetch("/messages/sent-offers");
        setSentOffers(offersResponse.ok ? offersData || [] : []);
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
    const confirmed = await confirm({
      title: t("profile.deleteDonationTitle"),
      message: t("profile.deleteDonationText"),
      confirmLabel: t("profile.deleteConfirm"),
    });
    if (!confirmed) return;

    try {
      const params = new URLSearchParams({ actor_email: userEmail });
      const { response } = await apiFetch(`/donations/${id}?${params.toString()}`, { method: "DELETE" });

      if (!response.ok) {
        showNotification(t("profile.deleteDonationError"), "error");
        return;
      }

      setMyDonations((prev) => prev.filter((item) => item.id !== id));
      showNotification(t("profile.deleteDonationSuccess"));
    } catch (err) {
      console.error("Error:", err);
      showNotification(t("profile.serverError"), "error");
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
        showNotification(data?.detail || t("profile.statusUpdateError"), "error");
        return;
      }

      setMyDonations((prev) => prev.map((item) => (item.id === id ? data : item)));
      setReservedDonations((prev) => {
        const withoutCurrent = prev.filter((item) => item.id !== id);
        if (data.status === "reserved" && data.reserved_by_email === userEmail) {
          return [data, ...withoutCurrent];
        }
        return withoutCurrent;
      });
    } catch {
      showNotification(t("profile.statusUpdateError"), "error");
    }
  }

  async function handleDeleteNeed(id) {
    const confirmed = await confirm({
      title: t("profile.deleteNeedTitle"),
      message: t("profile.deleteNeedText"),
      confirmLabel: t("profile.deleteConfirm"),
    });
    if (!confirmed) return;

    try {
      const params = new URLSearchParams({ actor_email: userEmail });
      const { response } = await apiFetch(`/needs/${id}?${params.toString()}`, { method: "DELETE" });

      if (!response.ok) {
        showNotification(t("profile.deleteNeedError"), "error");
        return;
      }

      setMyNeeds((prev) => prev.filter((item) => item.id !== id));
      showNotification(t("profile.deleteNeedSuccess"));
    } catch (err) {
      console.error("Error:", err);
      showNotification(t("profile.serverError"), "error");
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
    return <div className="profile-loading">{t("profile.loading")}</div>;
  }

  const isOrganization = userType === "organization";
  const showUserActivityTabs = !isOrganization;
  const verificationBadge = getVerificationBadge(verificationStatus, t);
  const coverImage = isOrganization ? buildFileUrl(userData?.cover_image_url) : "";
  const avatarImage = buildFileUrl(userData?.logo_url);
  const galleryImages = isOrganization ? (userData?.gallery_images || []).map(buildFileUrl).filter(Boolean) : [];
  const profileDetails = [
    {
      icon: <HiOutlineUser size={18} />,
      label: t("profile.type"),
      value: isOrganization ? t("profile.organization") : t("profile.user"),
    },
    {
      icon: <HiOutlineEnvelope size={18} />,
      label: t("profile.email"),
      value: userEmail,
    },
    {
      icon: <HiOutlinePhone size={18} />,
      label: t("profile.phone"),
      value: userData?.phone,
    },
    {
      icon: <HiOutlineMapPin size={18} />,
      label: t("profile.location"),
      value: userData?.city || userData?.location,
    },
    isOrganization && {
      icon: <HiOutlineGlobeAlt size={18} />,
      label: t("profile.website"),
      value: userData?.website,
    },
  ].filter(Boolean);
  const profileAction = (
    <button onClick={() => navigate("/edit-profile")} className="profile-edit-button">
      <HiOutlinePencilSquare size={18} />
      <span>{t("profile.editProfile")}</span>
    </button>
  );
  const profileStatus = isOrganization ? (
    <div className={`profile-verification-badge ${verificationBadge.className}`}>
      {verificationBadge.icon}
      <span>{verificationBadge.text}</span>
    </div>
  ) : null;

  return (
    <div className="pattern-bg profile-page">
      <SectionBanner
        title={t("profile.title")}
        subtitle={isOrganization ? t("profile.subtitleOrganization") : t("profile.subtitleUser")}
      />

      {notification.message && (
        <div className={`page-notification centered ${notification.type === "error" ? "error" : "success"}`}>
          {notification.message}
        </div>
      )}

      <div className="profile-container">
        <ProfileHeroCard
          title={userName}
          subtitle={isOrganization ? t("profile.organizationAccount") : t("profile.personalAccount")}
          coverImage={coverImage}
          avatarImage={avatarImage}
          details={profileDetails}
          galleryImages={galleryImages}
          action={profileAction}
          status={profileStatus}
        >
          {isOrganization && verificationStatus !== "verified" && (
            <div className={`profile-verification-alert ${verificationStatus === "rejected" ? "rejected" : "pending"}`}>
              <h3>
                {verificationStatus === "rejected"
                  ? t("profile.restrictedTitle")
                  : t("profile.pendingTitle")}
              </h3>

              <p>
                {verificationStatus === "rejected"
                  ? t("profile.restrictedText")
                  : t("profile.pendingText")}
              </p>

              {verificationStatus === "rejected" && userData?.rejection_reason && (
                <p className="profile-verification-reason">
                  <strong>{t("profile.adminNote")}:</strong> {userData.rejection_reason}
                </p>
              )}
            </div>
          )}
        </ProfileHeroCard>

        <section className="profile-posts-section">
          <div className="profile-posts-header">
            <div>
              <h2>{t("profile.myPosts")}</h2>
              <p>
                {isOrganization
                  ? `${myDonations.length} ${t("profile.donations")}, ${myNeeds.length} ${t("profile.needLists")}`
                  : `${myDonations.length} ${t("profile.donations")}, ${activeDonations} ${t("profile.active")}, ${reservedDonations.length} ${t("profile.reserved")}`}
              </p>
            </div>

            <div className="profile-tabs">
              {renderTabButton("donations", `${t("profile.donationsTab")} (${myDonations.length})`, <HiOutlineGift size={18} />)}

              {isOrganization &&
                renderTabButton("needs", `${t("profile.needListsTab")} (${myNeeds.length})`, <GoChecklist size={18} />)}

              {showUserActivityTabs &&
                renderTabButton("reservations", `${t("profile.reservationsTab")} (${reservedDonations.length})`, <HiOutlineClock size={18} />)}

              {showUserActivityTabs &&
                renderTabButton("offers", `${t("profile.offersTab")} (${sentOffers.length})`, <HiOutlineEnvelope size={18} />)}
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

          {tab === "reservations" && (
            <ProfileActivity
              type="reservations"
              reservedDonations={reservedDonations}
              sentOffers={sentOffers}
              onReserve={handleStatusChange}
              currentUserEmail={userEmail}
            />
          )}

          {tab === "offers" && (
            <ProfileActivity
              type="offers"
              reservedDonations={reservedDonations}
              sentOffers={sentOffers}
              onReserve={handleStatusChange}
              currentUserEmail={userEmail}
            />
          )}
        </section>
      </div>
      {confirmDialog}
    </div>
  );
}
