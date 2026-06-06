import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import {
  HiOutlineInbox,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import SectionBanner from "../components/common/SectionBanner";
import "../styles/pages/Messages.css";

export default function Messages() {
  const userEmail = localStorage.getItem("userEmail");
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [donationMap, setDonationMap] = useState({});
  const [needMap, setNeedMap] = useState({});

  useEffect(() => {
    if (!userEmail) {
      navigate("/login");
      return;
    }

    loadEverything();
    const interval = setInterval(loadInboxOnly, 5000);
    return () => clearInterval(interval);
  }, [userEmail]);

  const loadEverything = async () => {
    try {
      await Promise.all([loadInboxOnly(), loadContextMaps()]);
    } finally {
      setLoading(false);
    }
  };

  const loadInboxOnly = async () => {
    try {
      const { data: inboxData } = await apiFetch(
        `/messages/inbox?user_email=${encodeURIComponent(userEmail)}`
      );
      setConversations(inboxData || []);

      const { data: unreadData } = await apiFetch(
        `/messages/unread-count?user_email=${encodeURIComponent(userEmail)}`
      );
      setUnreadCount(unreadData?.unread_count || 0);
    } catch (err) {
      console.error("Error loading inbox:", err);
    }
  };

  const loadContextMaps = async () => {
    try {
      const [{ data: donationsData }, { data: needsData }] = await Promise.all([
        apiFetch("/donations/"),
        apiFetch("/needs/"),
      ]);

      const donationLookup = {};
      (donationsData || []).forEach((item) => {
        donationLookup[item.id] = item.title;
      });

      const needLookup = {};
      (needsData || []).forEach((item) => {
        needLookup[item.id] = item.title;
      });

      setDonationMap(donationLookup);
      setNeedMap(needLookup);
    } catch (err) {
      console.error("Error loading conversation context maps:", err);
    }
  };

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const da = a.last_message_date ? new Date(a.last_message_date).getTime() : 0;
      const db = b.last_message_date ? new Date(b.last_message_date).getTime() : 0;
      return db - da;
    });
  }, [conversations]);

  const getConversationLabel = (conv) => {
    if (conv.donation_id) {
      return donationMap[conv.donation_id]
        ? `Regarding donation: ${donationMap[conv.donation_id]}`
        : "Regarding a donation";
    }

    if (conv.need_id) {
      return needMap[conv.need_id]
        ? `Regarding need list: ${needMap[conv.need_id]}`
        : "Regarding a need list";
    }

    return "Direct conversation";
  };

  const openConversation = (conv) => {
    const params = new URLSearchParams();
    if (conv.donation_id) params.set("donationId", conv.donation_id);
    if (conv.need_id) params.set("needId", conv.need_id);

    const query = params.toString();
    navigate(`/chat/${encodeURIComponent(conv.other_email)}${query ? `?${query}` : ""}`);
  };

  if (loading) {
    return <div className="messages-loading">Loading messages...</div>;
  }

  return (
    <div className="messages-page">
      <SectionBanner
        title="Messages"
        subtitle="Keep in touch with donors, recipients, and organizations in one place."
      />

      <div className="messages-shell">
        <div className="messages-layout">
          <div className="messages-inbox-card">
            <div className="messages-inbox-header">
              <div className="messages-inbox-title-row">
                <div className="messages-inbox-icon">
                  <HiOutlineInbox size={20} />
                </div>

                <div className="messages-inbox-title">
                  <h2>Inbox</h2>
                  <p>Your active conversations</p>
                </div>

                {unreadCount > 0 && <div className="messages-unread-badge">{unreadCount}</div>}
              </div>
            </div>

            <div className="messages-list">
              {sortedConversations.length === 0 ? (
                <div className="messages-empty">No conversations yet.</div>
              ) : (
                sortedConversations.map((conv, idx) => (
                  <button
                    key={`${conv.other_email}-${conv.donation_id ?? "none"}-${conv.need_id ?? "none"}-${idx}`}
                    onClick={() => openConversation(conv)}
                    className="messages-conversation"
                  >
                    <div className="messages-conversation-top">
                      <div className="messages-conversation-main">
                        <div className="messages-avatar">
                          {conv.other_email?.charAt(0)?.toUpperCase() || "?"}
                        </div>

                        <div className="messages-conversation-text">
                          <div className="messages-email">{conv.other_email}</div>
                          <div className="messages-context">{getConversationLabel(conv)}</div>
                        </div>
                      </div>

                      <div className="messages-conversation-meta">
                        <div>
                          {conv.last_message_date
                            ? new Date(conv.last_message_date).toLocaleDateString()
                            : ""}
                        </div>

                        {conv.unread_count > 0 && (
                          <div className="messages-small-unread">{conv.unread_count}</div>
                        )}
                      </div>
                    </div>

                    <div className="messages-preview">{conv.last_message}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="messages-placeholder-panel">
            <div className="messages-placeholder-content">
              <div className="messages-placeholder-icon">
                <HiOutlineUserCircle size={34} />
              </div>

              <h3>Select a conversation</h3>
              <p>
                Choose a chat from the left panel to continue the conversation.
                The item context will stay attached to the thread.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
