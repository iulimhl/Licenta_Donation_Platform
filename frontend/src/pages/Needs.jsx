import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NeedCard from "../components/NeedCard";
import { apiFetch } from "../api/api";
import ListingPage from "../components/common/ListingPage";
import { isAdminUser } from "../utils/auth";
import { useTimedNotification } from "../hooks/useTimedNotification";
import { useLanguage } from "../language/useLanguage";

export default function Needs() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");
  const isAdmin = isAdminUser();
  const { t } = useLanguage();
  const { notification, showNotification } = useTimedNotification(3200);

  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    async function loadPageData() {
      try {
        const { data: needsData } = await apiFetch("/needs/");
        setItems(Array.isArray(needsData) ? needsData : []);

        if (userEmail) {
          const { data: userData } = await apiFetch(`/auth/user/${userEmail}`);
          setUserType(userData?.user_type || null);
          setVerificationStatus(userData?.verification_status || "unverified");
        }
      } catch (err) {
        console.error("Needs loading error:", err);
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
        showNotification(t("needs.updateError"), "error");
        return;
      }

      setItems((prev) => prev.map((item) => (item.id === needId ? data : item)));
    } catch (err) {
      console.error("Network error:", err);
      showNotification(t("needs.networkError"), "error");
    }
  }

  const filteredItems = useMemo(() => {
    const query = q.trim().toLowerCase();

    return items.filter((item) => {
      return (
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.location?.toLowerCase().includes(query) ||
        item.organization_email?.toLowerCase().includes(query) ||
        item.items?.some((needItem) => needItem.name?.toLowerCase().includes(query))
      );
    });
  }, [items, q]);

  return (
    <ListingPage
      title={t("needs.title")}
      subtitle={t("needs.subtitle")}
      loading={loading}
      loadingText={t("needs.loading")}
      searchValue={q}
      searchPlaceholder={t("needs.search")}
      onSearchChange={setQ}
      notice={
        userType === "organization" && verificationStatus !== "verified" && (
          <div className={`needs-verification-alert ${verificationStatus === "rejected" ? "rejected" : "pending"}`}>
            {verificationStatus === "rejected" ? t("needs.rejected") : t("needs.pending")}
          </div>
        )
      }
      action={
        userType === "organization" && (
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
                ? t("needs.createTitle")
                : t("needs.unavailableTitle")
            }
          >
            {t("needs.add")}
          </button>
        )
      }
      hasResults={filteredItems.length > 0}
      emptyTitle={t("needs.emptyTitle")}
      emptyText={t("needs.emptyText")}
    >
      {notification.message && (
        <div className={`page-notification ${notification.type === "error" ? "error" : "success"}`}>
          {notification.message}
        </div>
      )}

      {filteredItems.map((need) => (
        <NeedCard
          key={need.id}
          need={need}
          onItemCheck={handleItemCheck}
          currentUserEmail={userEmail}
          isOwner={userEmail === need.organization_email}
          isAdmin={isAdmin}
        />
      ))}
    </ListingPage>
  );
}
