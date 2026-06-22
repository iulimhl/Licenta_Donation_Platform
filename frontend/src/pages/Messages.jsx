import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineInbox,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import SectionBanner from "../components/common/SectionBanner";
import ConversationList from "../components/messages/ConversationList";
import { useInbox } from "../hooks/useInbox";
import { useLanguage } from "../language/useLanguage";
import { buildConversationPath } from "../utils/conversations";
import "../styles/pages/Messages.css";

export default function Messages() {
  const userEmail = localStorage.getItem("userEmail");
  const navigate = useNavigate();
  const { t } = useLanguage();
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
    return <div className="messages-loading">{t("messages.loading")}</div>;
  }

  return (
    <div className="messages-page">
      <SectionBanner
        title={t("messages.title")}
        subtitle={t("messages.subtitle")}
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
                  <h2>{t("messages.inbox")}</h2>
                  <p>{t("messages.activeConversations")}</p>
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

              <h3>{t("messages.selectTitle")}</h3>
              <p>{t("messages.selectText")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
