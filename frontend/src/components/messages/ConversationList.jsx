import { buildFileUrl } from "../../api/api";
import { getCleanMessagePreview } from "../../utils/messageFormatting";
import {
  getConversationDisplayName,
  getConversationKey,
} from "../../utils/conversations";
import { useLanguage } from "../../language/useLanguage";

export default function ConversationList({
  conversations,
  variant = "messages",
  loading = false,
  activeKey = "",
  onOpen,
  getConversationLabel,
}) {
  const { t } = useLanguage();

  if (variant === "chat" && loading) {
    return <div className="chat-inbox-state">{t("messages.inboxLoading")}</div>;
  }

  if (conversations.length === 0) {
    return variant === "chat" ? (
      <div className="chat-inbox-state center">{t("messages.empty")}</div>
    ) : (
      <div className="messages-empty">{t("messages.empty")}</div>
    );
  }

  return conversations.map((conversation, index) => {
    const conversationKey = getConversationKey(conversation);
    const displayName = getConversationDisplayName(conversation);
    const isActive = conversationKey === activeKey;
    const preview = getCleanMessagePreview(conversation.last_message);

    if (variant === "chat") {
      return (
        <button
          key={`${conversationKey}-${index}`}
          onClick={() => onOpen(conversation)}
          className={`chat-conversation-button ${isActive ? "active" : ""}`}
        >
          <div className="chat-conversation-top">
            <div className="chat-conversation-main">
              <ConversationAvatar
                logoUrl={conversation.other_logo_url}
                displayName={displayName}
                className="chat-conversation-avatar"
              />

              <div className="chat-conversation-text">
                <div className="chat-conversation-email">{displayName}</div>
                <div className="chat-conversation-context">{getConversationLabel(conversation)}</div>
              </div>
            </div>

            {conversation.unread_count > 0 && (
              <div className="chat-unread-badge">{conversation.unread_count}</div>
            )}
          </div>

          <div className="chat-conversation-preview">{preview}</div>
        </button>
      );
    }

    return (
      <button
        key={`${conversationKey}-${index}`}
        onClick={() => onOpen(conversation)}
        className="messages-conversation"
      >
        <div className="messages-conversation-top">
          <div className="messages-conversation-main">
            <ConversationAvatar
              logoUrl={conversation.other_logo_url}
              displayName={displayName}
              className="messages-avatar"
            />

            <div className="messages-conversation-text">
              <div className="messages-email">{displayName}</div>
              <div className="messages-context">{getConversationLabel(conversation)}</div>
            </div>
          </div>

          <div className="messages-conversation-meta">
            <div>
              {conversation.last_message_date
                ? new Date(conversation.last_message_date).toLocaleDateString()
                : ""}
            </div>

            {conversation.unread_count > 0 && (
              <div className="messages-small-unread">{conversation.unread_count}</div>
            )}
          </div>
        </div>

        <div className="messages-preview">{preview}</div>
      </button>
    );
  });
}

function ConversationAvatar({ logoUrl, displayName, className }) {
  return (
    <div className={className}>
      {logoUrl ? (
        <img src={buildFileUrl(logoUrl)} alt={displayName} />
      ) : (
        displayName?.charAt(0)?.toUpperCase() || "?"
      )}
    </div>
  );
}
