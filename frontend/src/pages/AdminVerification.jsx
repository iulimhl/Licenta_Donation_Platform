import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineEye, HiOutlineGift, HiOutlineShieldCheck, HiOutlineTrash } from "react-icons/hi2";
import { GoChecklist } from "react-icons/go";
import { apiFetch } from "../api/api";
import DocumentModal from "../components/admin/DocumentModal";
import ModerationList from "../components/admin/ModerationList";
import VerificationCard from "../components/admin/VerificationCard";
import SectionBanner from "../components/common/SectionBanner";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { useTimedNotification } from "../hooks/useTimedNotification";
import { useLanguage } from "../language/useLanguage";
import { isAdminUser } from "../utils/auth";
import { filterModerationItems } from "../utils/adminModeration";
import "../styles/pages/AdminVerification.css";

export default function AdminVerification() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");
  const isAdmin = isAdminUser();
  const { confirm, confirmDialog } = useConfirmDialog();
  const { notification, showNotification } = useTimedNotification(3200);
  const { t } = useLanguage();

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [rejectingOrg, setRejectingOrg] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [activeTab, setActiveTab] = useState("verifications");
  const [donations, setDonations] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [moderationSearch, setModerationSearch] = useState("");
  const [moderationStatus, setModerationStatus] = useState("all");
  const [moderationSort, setModerationSort] = useState("newest");
  const [moderationPage, setModerationPage] = useState(1);
  const [moderationPageSize, setModerationPageSize] = useState(10);

  const loadPendingOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ admin_email: userEmail });
      const { response, data } = await apiFetch(`/verification/pending?${params.toString()}`);
      setOrganizations(response.ok ? data || [] : []);
    } catch (err) {
      console.error("Error loading pending organizations:", err);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail) {
      navigate("/login");
      return;
    }

    if (!isAdmin) {
      navigate("/");
      return;
    }

    loadPendingOrganizations();
  }, [userEmail, isAdmin, navigate, loadPendingOrganizations]);

  useEffect(() => {
    if (!isAdmin) return;

    if (activeTab === "donations") {
      loadDonationsForModeration();
    }

    if (activeTab === "needs") {
      loadNeedsForModeration();
    }
  }, [activeTab, isAdmin]);

  useEffect(() => {
    setModerationSearch("");
    setModerationStatus("all");
    setModerationSort("newest");
    setModerationPage(1);
  }, [activeTab]);

  useEffect(() => {
    setModerationPage(1);
  }, [moderationSearch, moderationStatus, moderationSort, moderationPageSize]);

  const isModerationTab = activeTab === "donations" || activeTab === "needs";
  const moderationType = activeTab === "needs" ? "needs" : "donations";
  const moderationSourceItems = moderationType === "needs" ? needs : donations;
  const filteredModerationItems = useMemo(
    () =>
      isModerationTab
        ? filterModerationItems(
            moderationSourceItems,
            moderationType,
            moderationSearch,
            moderationStatus,
            moderationSort
          )
        : [],
    [isModerationTab, moderationSourceItems, moderationSearch, moderationSort, moderationStatus, moderationType]
  );
  const moderationTotalPages = Math.max(1, Math.ceil(filteredModerationItems.length / moderationPageSize));
  const moderationSafePage = Math.min(moderationPage, moderationTotalPages);
  const paginatedModerationItems = filteredModerationItems.slice(
    (moderationSafePage - 1) * moderationPageSize,
    moderationSafePage * moderationPageSize
  );

  async function handleApprove(userId) {
    try {
      setActionLoadingId(userId);
      const params = new URLSearchParams({ admin_email: userEmail });
      const { response } = await apiFetch(`/verification/approve/${userId}?${params.toString()}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        showNotification(t("admin.approveError"), "error");
        return;
      }

      setOrganizations((prev) => prev.filter((org) => org.id !== userId));
      showNotification(t("admin.approveSuccess"));

      if (selectedOrg?.id === userId) {
        setSelectedOrg(null);
      }
    } catch (err) {
      console.error("Approve error:", err);
      showNotification(t("admin.approveServerError"), "error");
    } finally {
      setActionLoadingId(null);
    }
  }

  function openRejectDialog(organization) {
    setSelectedOrg(null);
    setRejectingOrg(organization);
    setRejectReason("");
    setRejectError("");
  }

  function closeRejectDialog() {
    setRejectingOrg(null);
    setRejectReason("");
    setRejectError("");
  }

  async function handleReject() {
    if (!rejectingOrg) return;

    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError(t("admin.rejectReasonRequired"));
      return;
    }

    try {
      const userId = rejectingOrg.id;
      setActionLoadingId(userId);
      const params = new URLSearchParams({ admin_email: userEmail });
      const { response } = await apiFetch(`/verification/reject/${userId}?${params.toString()}`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        setRejectError(t("admin.rejectError"));
        return;
      }

      setOrganizations((prev) => prev.filter((org) => org.id !== userId));
      showNotification(t("admin.rejectSuccess"));

      if (selectedOrg?.id === userId) {
        setSelectedOrg(null);
      }
      closeRejectDialog();
    } catch (err) {
      console.error("Reject error:", err);
      setRejectError(t("admin.rejectServerError"));
    } finally {
      setActionLoadingId(null);
    }
  }

  async function loadDonationsForModeration() {
    try {
      setModerationLoading(true);
      const { response, data } = await apiFetch("/donations/");
      setDonations(response.ok ? data || [] : []);
    } catch (err) {
      console.error("Error loading donations for moderation:", err);
      setDonations([]);
    } finally {
      setModerationLoading(false);
    }
  }

  async function loadNeedsForModeration() {
    try {
      setModerationLoading(true);
      const { response, data } = await apiFetch("/needs/");
      setNeeds(response.ok ? data || [] : []);
    } catch (err) {
      console.error("Error loading needs for moderation:", err);
      setNeeds([]);
    } finally {
      setModerationLoading(false);
    }
  }

  async function handleDeleteDonation(donation) {
    const confirmed = await confirm({
      title: t("admin.deleteDonationTitle"),
      message: t("admin.deleteDonationMessage").replace("{title}", donation.title),
      confirmLabel: t("admin.deleteConfirm"),
    });
    if (!confirmed) return;

    try {
      setActionLoadingId(`donation-${donation.id}`);
      const params = new URLSearchParams({ actor_email: userEmail });
      const { response } = await apiFetch(`/donations/${donation.id}?${params.toString()}`, { method: "DELETE" });

      if (!response.ok) {
        showNotification(t("admin.deleteDonationError"), "error");
        return;
      }

      setDonations((prev) => prev.filter((item) => item.id !== donation.id));
      showNotification(t("admin.deleteDonationSuccess"));
    } catch (err) {
      console.error("Delete donation error:", err);
      showNotification(t("admin.deleteDonationServerError"), "error");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDeleteNeed(need) {
    const confirmed = await confirm({
      title: t("admin.deleteNeedTitle"),
      message: t("admin.deleteNeedMessage").replace("{title}", need.title),
      confirmLabel: t("admin.deleteConfirm"),
    });
    if (!confirmed) return;

    try {
      setActionLoadingId(`need-${need.id}`);
      const params = new URLSearchParams({ actor_email: userEmail });
      const { response } = await apiFetch(`/needs/${need.id}?${params.toString()}`, { method: "DELETE" });

      if (!response.ok) {
        showNotification(t("admin.deleteNeedError"), "error");
        return;
      }

      setNeeds((prev) => prev.filter((item) => item.id !== need.id));
      showNotification(t("admin.deleteNeedSuccess"));
    } catch (err) {
      console.error("Delete need error:", err);
      showNotification(t("admin.deleteNeedServerError"), "error");
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="admin-verification-page">
      <SectionBanner
        title={t("admin.title")}
        subtitle={t("admin.subtitle")}
      />

      {notification.message && (
        <div className={`page-notification centered ${notification.type === "error" ? "error" : "success"}`}>
          {notification.message}
        </div>
      )}

      <div className="admin-verification-container">
        <div className="admin-tabs">
          <button
            type="button"
            className={activeTab === "verifications" ? "active" : ""}
            onClick={() => setActiveTab("verifications")}
          >
            <HiOutlineShieldCheck size={18} />
            <span>Verifications</span>
          </button>

          <button
            type="button"
            className={activeTab === "donations" ? "active" : ""}
            onClick={() => setActiveTab("donations")}
          >
            <HiOutlineGift size={18} />
            <span>Donations</span>
          </button>

          <button
            type="button"
            className={activeTab === "needs" ? "active" : ""}
            onClick={() => setActiveTab("needs")}
          >
            <GoChecklist size={18} />
            <span>Need lists</span>
          </button>

        </div>

        {activeTab === "verifications" && (
          <VerificationQueue
            loading={loading}
            organizations={organizations}
            actionLoadingId={actionLoadingId}
            onApprove={handleApprove}
            onReject={openRejectDialog}
            onOpenDocument={setSelectedOrg}
          />
        )}

        {activeTab === "donations" && (
          <ModerationList
            type="donations"
            loading={moderationLoading}
            emptyTitle="No donations to moderate"
            emptyText="There are no donation posts available right now."
            items={paginatedModerationItems}
            totalItems={donations.length}
            filteredCount={filteredModerationItems.length}
            page={moderationSafePage}
            pageSize={moderationPageSize}
            totalPages={moderationTotalPages}
            search={moderationSearch}
            status={moderationStatus}
            sort={moderationSort}
            onSearchChange={setModerationSearch}
            onStatusChange={setModerationStatus}
            onSortChange={setModerationSort}
            onPageChange={setModerationPage}
            onPageSizeChange={setModerationPageSize}
            renderItem={(donation) => (
              <ModerationCard
                key={donation.id}
                title={donation.title}
                meta={`${donation.location || "No location"} - ${donation.status || "available"}`}
                owner={`Posted by ${donation.donor_name || donation.owner_email || "Unknown user"}`}
                viewLabel="View"
                deleteLabel="Delete"
                deleteLoading={actionLoadingId === `donation-${donation.id}`}
                onView={() => navigate(`/donation/${donation.id}`)}
                onDelete={() => handleDeleteDonation(donation)}
              />
            )}
          />
        )}

        {activeTab === "needs" && (
          <ModerationList
            type="needs"
            loading={moderationLoading}
            emptyTitle="No need lists to moderate"
            emptyText="There are no organization need lists available right now."
            items={paginatedModerationItems}
            totalItems={needs.length}
            filteredCount={filteredModerationItems.length}
            page={moderationSafePage}
            pageSize={moderationPageSize}
            totalPages={moderationTotalPages}
            search={moderationSearch}
            status={moderationStatus}
            sort={moderationSort}
            onSearchChange={setModerationSearch}
            onStatusChange={setModerationStatus}
            onSortChange={setModerationSort}
            onPageChange={setModerationPage}
            onPageSizeChange={setModerationPageSize}
            renderItem={(need) => (
              <ModerationCard
                key={need.id}
                title={need.title}
                meta={need.location || "No location"}
                owner={`Posted by ${need.organization_name || need.organization_email || "Unknown organization"}`}
                viewLabel="View"
                deleteLabel="Delete"
                deleteLoading={actionLoadingId === `need-${need.id}`}
                onView={() => navigate(`/need/${need.id}`)}
                onDelete={() => handleDeleteNeed(need)}
              />
            )}
          />
        )}

      </div>

      <DocumentModal
        organization={selectedOrg}
        actionLoadingId={actionLoadingId}
        onClose={() => setSelectedOrg(null)}
        onApprove={handleApprove}
        onReject={openRejectDialog}
      />
      <RejectReasonModal
        organization={rejectingOrg}
        reason={rejectReason}
        error={rejectError}
        isLoading={actionLoadingId === rejectingOrg?.id}
        onReasonChange={setRejectReason}
        onClose={closeRejectDialog}
        onSubmit={handleReject}
      />
      {confirmDialog}
    </div>
  );
}

function VerificationQueue({
  loading,
  organizations,
  actionLoadingId,
  onApprove,
  onReject,
  onOpenDocument,
}) {
  if (loading) {
    return <div className="admin-verification-loading surface-card">Loading pending organizations...</div>;
  }

  if (organizations.length === 0) {
    return (
      <div className="admin-verification-empty surface-card">
        <h3>No pending organizations</h3>
        <p>All organization verification requests have been reviewed.</p>
      </div>
    );
  }

  return (
    <div className="admin-verification-grid">
      {organizations.map((organization) => (
        <VerificationCard
          key={organization.id}
          organization={organization}
          actionLoadingId={actionLoadingId}
          onApprove={onApprove}
          onReject={onReject}
          onOpenDocument={onOpenDocument}
        />
      ))}
    </div>
  );
}

function RejectReasonModal({
  organization,
  reason,
  error,
  isLoading,
  onReasonChange,
  onClose,
  onSubmit,
}) {
  const { t } = useLanguage();

  if (!organization) return null;
  const organizationLabel = organization.name || organization.email;

  return (
    <div className="admin-reject-modal-overlay" onClick={onClose}>
      <div className="admin-reject-modal" onClick={(event) => event.stopPropagation()}>
        <h3>{t("admin.rejectTitle")}</h3>
        <p>
          {t("admin.rejectText").replace("{name}", organizationLabel)}
        </p>

        <textarea
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder={t("admin.rejectReasonPlaceholder")}
          rows={4}
        />

        {error && <div className="admin-reject-error">{error}</div>}

        <div className="admin-reject-actions">
          <button type="button" onClick={onClose} className="secondary" disabled={isLoading}>
            {t("admin.rejectCancel")}
          </button>

          <button type="button" onClick={onSubmit} className="danger" disabled={isLoading}>
            {isLoading ? t("admin.rejecting") : t("admin.rejectConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModerationCard({
  title,
  meta,
  owner,
  viewLabel,
  deleteLabel,
  deleteLoading,
  onView,
  onDelete,
}) {
  return (
    <div className="admin-moderation-card surface-card">
      <div>
        <h3>{title}</h3>
        <p>{meta}</p>
        <span>{owner}</span>
      </div>

      <div className="admin-moderation-actions">
        <button type="button" onClick={onView}>
          <HiOutlineEye size={17} />
          <span>{viewLabel}</span>
        </button>

        <button type="button" className="danger" disabled={deleteLoading} onClick={onDelete}>
          <HiOutlineTrash size={17} />
          <span>{deleteLabel}</span>
        </button>
      </div>
    </div>
  );
}
