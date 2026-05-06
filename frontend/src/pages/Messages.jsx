import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function Messages() {
  const userEmail = localStorage.getItem("userEmail");
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userEmail) {
      navigate("/login");
      return;
    }

    loadInbox();
    const interval = setInterval(loadInbox, 5000);
    return () => clearInterval(interval);
  }, [userEmail]);

  const loadInbox = async () => {
    try {
      const { data: inboxData } = await apiFetch(`/messages/inbox?user_email=${userEmail}`);
      setConversations(inboxData);

      const { data: unreadData } = await apiFetch(`/messages/unread-count?user_email=${userEmail}`);
      setUnreadCount(unreadData.unread_count);
    } catch (err) {
      console.error("Error loading inbox:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "40px" }}>Loading messages...</div>;
  }

  return (
    <div className="pattern-bg" style={{ minHeight: "100vh", padding: "20px" }}>
      <div
        className="glass-container"
        style={{
          marginBottom: "24px",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontSize: "2rem",
            fontWeight: 700,
          }}
        >
          Messages
        </h1>
        <p
          style={{
            margin: "8px 0 0 0",
            color: "#64748b",
          }}
        >
          Connect with donors and recipients
        </p>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
        <h1 style={{ margin: "0 0 24px 0", fontSize: "24px", color: "#1e293b", fontWeight: 700 }}>
          Messages
          {unreadCount > 0 && (
            <span
              style={{
                marginLeft: "12px",
                background: "#ef4444",
                color: "#fff",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {unreadCount} new
            </span>
          )}
        </h1>

        {conversations.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "#f8fafc",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          >
            <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>
              💬 No messages yet. Start connecting with other users!
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {conversations.map((conv, idx) => (
              <button
                key={idx}
                onClick={() => navigate(`/chat/${conv.other_email}`)}
                style={{
                  padding: "16px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  background: "#fff",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                  display: "block",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: "0 0 4px 0", color: "#1e293b", fontWeight: 600, fontSize: 15 }}>
                      {conv.other_email}
                      {conv.unread_count > 0 && (
                        <span
                          style={{
                            marginLeft: "8px",
                            background: "#ef4444",
                            color: "#fff",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          {conv.unread_count}
                        </span>
                      )}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "#64748b",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {conv.last_message}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {conv.last_message_date ? new Date(conv.last_message_date).toLocaleDateString() : ""}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}