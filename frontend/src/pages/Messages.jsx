import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineInbox,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import SectionBanner from "../components/common/SectionBanner";
import ConversationList from "../components/messages/ConversationList";
import { useInbox } from "../hooks/useInbox";
import { buildConversationPath } from "../utils/conversations";
import "../styles/pages/Messages.css";

export default function Messages() {
  const userEmail = localStorage.getItem("userEmail");
  const navigate = useNavigate();
  const {
    loading,
    unreadCount,
    sortedConversations,
    getConversationLabel,
  } = useInbox({
    userEmail,
    enabled: Boolean(userEmail),
    pollMs: 5000,
    includeUnreadCount: true,
    labelMode: "regarding",
  });

  useEffect(() => {
    if (!userEmail) {
      navigate("/login");
    }
  }, [navigate, userEmail]);

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
              <ConversationList
                conversations={sortedConversations}
                onOpen={(conversation) => navigate(buildConversationPath(conversation))}
                getConversationLabel={getConversationLabel}
              />
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
