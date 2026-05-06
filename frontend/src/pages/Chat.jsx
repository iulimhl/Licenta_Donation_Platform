import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function Chat() {
  const { otherEmail } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = localStorage.getItem("userEmail");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [otherUserName, setOtherUserName] = useState(otherEmail);
  const [donationTitle, setDonationTitle] = useState("");
  const messagesEndRef = useRef(null);

  // Extract donationId from query params
  const searchParams = new URLSearchParams(location.search);
  const donationId = searchParams.get("donationId");
  useEffect(() => {
    if (!userEmail) {
      navigate("/login");
      return;
    }
    loadConversation();
    loadUserInfo();

    // Auto-refresh messages every 3 seconds
    const interval = setInterval(loadConversation, 3000);
    return () => clearInterval(interval);
  }, [otherEmail, userEmail, donationId]);

  const loadConversation = async () => {
    try {
      const path = donationId
        ? `/messages/conversation?other_email=${otherEmail}&user_email=${userEmail}&donation_id=${donationId}`
        : `/messages/conversation?other_email=${otherEmail}&user_email=${userEmail}`;

      const { data } = await apiFetch(path);
      setMessages(data);
    } catch (err) {
      console.error("Error loading conversation:", err);
    }
  };

  const loadUserInfo = async () => {
    try {
      const { data } = await apiFetch(`/auth/user/${otherEmail}`);
      setOtherUserName(data.organization_name || otherEmail);
    } catch (err) {
      console.error("Error loading user info:", err);
    }

    if (donationId) {
      try {
        const { data } = await apiFetch("/donations/");
        const donation = data.find(d => d.id === parseInt(donationId));
        if (donation) {
          setDonationTitle(donation.title);
        }
      } catch (err) {
        console.error("Error loading donation:", err);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const { response, data } = await apiFetch(`/messages/?sender_email=${userEmail}`, {
          method: "POST",
          body: JSON.stringify({
            recipient_email: otherEmail,
            content: newMessage,
            donation_id: donationId ? parseInt(donationId) : null,
          }),
      });

      if (response.ok) {
          setMessages([...messages, data]);
          setNewMessage("");
      } else {
          console.error("Error response:", data);
          alert("Error sending message: " + (data.detail || "Unknown error"));
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Error sending message: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pattern-bg" style={{ minHeight: "100vh", padding: "20px" }}>
      {/* Header with glassmorphism */}
      <div className="glass-container" style={{
        marginBottom: "24px",
        padding: "20px",
        textAlign: "center"
      }}>
        <h1 style={{
          margin: 0,
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          fontSize: "2rem",
          fontWeight: 700
        }}>
          {otherUserName}
        </h1>
        <p style={{
          margin: "8px 0 0 0",
          color: "#64748b"
        }}>
          {donationTitle ? `About: ${donationTitle}` : "Direct conversation"}
        </p>
      </div>

      {/* Messages Container */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginBottom: "16px",
          padding: "8px 4px",
        }}
      >
        {messages.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
            <p style={{ color: "#94a3b8", textAlign: "center" }}>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: msg.sender_email === userEmail ? "flex-end" : "flex-start",
                marginBottom: idx === messages.length - 1 ? 0 : 4,
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: msg.sender_email === userEmail ? "#6366f1" : "#fff",
                  color: msg.sender_email === userEmail ? "#fff" : "#1e293b",
                  wordWrap: "break-word",
                  boxShadow: msg.sender_email === userEmail ? "0 2px 8px rgba(99, 102, 241, 0.2)" : "0 1px 3px rgba(0, 0, 0, 0.1)",
                }}
              >
                <p style={{ margin: "0 0 4px 0", fontSize: 14, lineHeight: 1.4 }}>{msg.content}</p>
                <p style={{ margin: 0, fontSize: "11px", opacity: 0.7 }}>
                  {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "14px 16px",
            border: "2px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "12px",
            fontSize: "14px",
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            outline: "none",
            color: "#334155",
          }}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !newMessage.trim()}
          style={{
            padding: "12px 24px",
            background: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            opacity: loading || !newMessage.trim() ? 0.5 : 1,
            transition: "all 0.2s",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
