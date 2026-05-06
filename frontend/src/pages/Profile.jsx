import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import { colors } from "../styles/theme";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileStats from "../components/profile/ProfileStats";
import ProfileDonations from "../components/profile/ProfileDonations";
import ProfileNeeds from "../components/profile/ProfileNeeds";

const pageStyle = {
  minHeight: "100vh",
  background: colors.bg,
};

const tabBarStyle = {
  display: "flex",
  gap: 12,
  marginBottom: 24,
  borderBottom: `1px solid ${colors.border}`,
};

export default function Profile() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");

  const [myDonations, setMyDonations] = useState([]);
  const [myNeeds, setMyNeeds] = useState([]);
  const [userType, setUserType] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("donations");

  useEffect(() => {
    async function loadProfileData() {
      try {
        const { data: userData } = await apiFetch(`/auth/user/${userEmail}`);
        setUserType(userData.user_type);

        const { data: donationsData } = await apiFetch("/donations/");
        setMyDonations(donationsData.filter((item) => item.owner_email === userEmail));

        const { data: needsData } = await apiFetch("/needs/");
        setMyNeeds(needsData.filter((item) => item.organization_email === userEmail));
      } catch (err) {
        console.error("Error loading profile data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [userEmail]);

  const availableDonations = useMemo(
    () => myDonations.filter((item) => item.status === "available").length,
    [myDonations]
  );

  const reservedDonations = useMemo(
    () => myDonations.filter((item) => item.status === "reserved").length,
    [myDonations]
  );

  async function handleDeleteDonation(id) {
    if (!window.confirm("Sigur vrei să ștergi definitiv această donație?")) return;

    try {
      const { response } = await apiFetch(`/donations/${id}`, { method: "DELETE" });

      if (!response.ok) {
        alert("Eroare la ștergerea de pe server.");
        return;
      }

      setMyDonations((prev) => prev.filter((item) => item.id !== id));
      alert("Donația a fost ștearsă!");
    } catch (err) {
      console.error("Error:", err);
      alert("Nu s-a putut contacta serverul.");
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      const { response } = await apiFetch(`/donations/${id}/status?new_status=${newStatus}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        alert("Error updating status");
        return;
      }

      setMyDonations((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      alert("Error updating status");
    }
  }

  async function handleDeleteNeed(id) {
    if (!window.confirm("Sigur vrei să ștergi definitiv această listă de necesități?")) return;

    try {
      const { response } = await apiFetch(`/needs/${id}`, { method: "DELETE" });

      if (!response.ok) {
        alert("Eroare la ștergere.");
        return;
      }

      setMyNeeds((prev) => prev.filter((item) => item.id !== id));
      alert("Lista de necesități a fost ștearsă!");
    } catch (err) {
      console.error("Error:", err);
      alert("Nu s-a putut contacta serverul.");
    }
  }

  function renderTabButton(key, label, activeColor, activeTextColor = colors.text) {
    const isActive = tab === key;

    return (
      <button
        onClick={() => setTab(key)}
        style={{
          padding: "12px 20px",
          background: isActive ? activeColor : "transparent",
          color: isActive ? activeTextColor : colors.muted,
          border: "none",
          borderRadius: 10,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    );
  }

  if (loading) {
    return <div style={{ textAlign: "center", marginTop: 60 }}>Loading...</div>;
  }

  return (
    <div className="pattern-bg" style={pageStyle}>
      <ProfileHeader userEmail={userEmail} userType={userType} />

      <ProfileStats
        donationsCount={myDonations.length}
        needsCount={myNeeds.length}
        availableCount={availableDonations}
        reservedCount={reservedDonations}
      />

      <div style={tabBarStyle}>
        {renderTabButton("donations", `My Donations (${myDonations.length})`, colors.blue, colors.white)}
        {userType === "organization" &&
          renderTabButton("needs", `My Needs (${myNeeds.length})`, colors.yellow)}
      </div>

      {tab === "donations" && (
        <ProfileDonations
          myDonations={myDonations}
          handleStatusChange={handleStatusChange}
          handleDeleteDonation={handleDeleteDonation}
        />
      )}

      {tab === "needs" && (
        <ProfileNeeds
          myNeeds={myNeeds}
          navigate={navigate}
          handleDeleteNeed={handleDeleteNeed}
        />
      )}
    </div>
  );
}