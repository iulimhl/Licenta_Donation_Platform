import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NeedCard from "../components/NeedCard";
import { apiFetch } from "../api/api";
import SectionBanner from "../components/common/SectionBanner";
import "../styles/listingPages.css";

export default function Needs() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");

  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    async function loadPageData() {
      try {
        const { data: needsData } = await apiFetch("/needs/");
        setItems(needsData);

        if (userEmail) {
          const { data: userData } = await apiFetch(`/auth/user/${userEmail}`);
          setUserType(userData.user_type);
          setVerificationStatus(userData.verification_status || "unverified");
        }
      } catch (err) {
        console.error("Eroare la încărcare:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPageData();
  }, [userEmail]);

  async function handleItemCheck(needId, itemIndex, newBrought) {
    try {
      const { response, data } = await apiFetch(
        `/needs/${needId}/item/${itemIndex}?brought=${newBrought}`,
        { method: "PATCH" }
      );

      if (!response.ok) {
        alert("Error updating item.");
        return;
      }

      setItems((prev) => prev.map((item) => (item.id === needId ? data : item)));
    } catch (err) {
      console.error("Network error:", err);
      alert("Failed to update item.");
    }
  }

  const filteredItems = useMemo(() => {
    const query = q.trim().toLowerCase();

    return items.filter((item) => {
      return (
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.organization_email.toLowerCase().includes(query) ||
        item.items.some((needItem) => needItem.name.toLowerCase().includes(query))
      );
    });
  }, [items, q]);

  if (loading) {
    return (
      <div className="listing-loading">
        <h3>Loading needs...</h3>
      </div>
    );
  }

  return (
    <div className="listing-page">
      <SectionBanner
        title="Requirements lists"
        subtitle="Browse organization needs and check off the items you can bring to help out."
      />

      <div className="listing-shell">

      {userType === "organization" && verificationStatus !== "verified" && (
        <div className={`needs-verification-alert ${verificationStatus === "rejected" ? "rejected" : "pending"}`}>
          {verificationStatus === "rejected"
            ? "Your organization account was not approved by admin. You cannot post need lists right now."
            : "Your organization account is waiting for admin approval. You can browse lists, but posting is disabled until verification is complete."}
        </div>
      )}
        <div className="listing-toolbar">
          <div className={`listing-toolbar-row ${userType === "organization" ? "with-action" : ""}`}>
            <div className="listing-search-wrap">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title, location, or item..."
                className="listing-search-input"
              />
            </div>

            {userType === "organization" && (
              <button
                onClick={() => {
                  if (verificationStatus === "verified") {
                    navigate("/postneed");
                  }
                }}
                disabled={verificationStatus !== "verified"}
                className="listing-add-button"
                title={
                  verificationStatus === "verified"
                    ? "Create a new need list"
                    : "Available only after admin approval"
                }
              >
                + Add list
              </button>
            )}
          </div>
        </div>

        
        <div className="listing-results">
          {filteredItems.length > 0 ? (
            <div className="listing-grid">
              {filteredItems.map((need) => (
                <NeedCard
                  key={need.id}
                  need={need}
                  onItemCheck={handleItemCheck}
                  currentUserEmail={userEmail}
                  isOwner={userEmail === need.organization_email}
                />
              ))}
            </div>
          ) : (
            <div className="listing-empty-state">
              <h3>
                No needs found
              </h3>
              <p>
                Try a different search or check back later for new requests.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
