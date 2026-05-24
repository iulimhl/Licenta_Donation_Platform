import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { apiFetch } from "../api/api";
import { colors, radius, shadow } from "../styles/theme";

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
  const [needDetails, setNeedDetails] = useState(null);
  const [isFulfilling, setIsFulfilling] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const scrollContainerRef = useRef(null);

  const searchParams = new URLSearchParams(location.search);
  const donationId = searchParams.get("donationId");
  const needId = searchParams.get("needId");

  useEffect(() => {
    if (!userEmail) {
      navigate("/login");
      return;
    }
    loadConversation();
    loadUserInfo();

    const interval = setInterval(loadConversation, 3000);
    return () => clearInterval(interval);
  }, [otherEmail, userEmail, donationId, needId]);

  useEffect(() => {
    if (messages.length > 0 && scrollContainerRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (isFirstLoad || lastMessage.sender_email === userEmail) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: isFirstLoad ? "auto" : "smooth"
        });
        if (isFirstLoad) setIsFirstLoad(false);
      }
    }
  }, [messages, isFirstLoad, userEmail]);

  useEffect(() => {
    if (
      messages.length === 0 &&
      needDetails &&
      userEmail !== needDetails.organization_email &&
      !newMessage
    ) {
      setNewMessage(`Hi! I would like to help with your request: "${needDetails.title}". I can bring the needed items.`);
    }
  }, [messages, needDetails, userEmail]);

  const loadConversation = async () => {
    try {
      // REPARAT: Construim calea dinamic, incluzând need_id pentru izolare totală
      let path = `/messages/conversation?other_email=${otherEmail}&user_email=${userEmail}`;
      if (donationId) path += `&donation_id=${donationId}`;
      if (needId) path += `&need_id=${needId}`;

      const { data } = await apiFetch(path);
      setMessages(data);
    } catch (err) {
      console.error("Error loading conversation:", err);
    }
  };

  const loadUserInfo = async () => {
    try {
      const { data } = await apiFetch(`/auth/user/${otherEmail}`);
      setOtherUserName(data.organization_name || data.full_name || otherEmail);
    } catch (err) {
      console.error("Error loading user info:", err);
    }

    if (donationId) {
      try {
        const { data } = await apiFetch("/donations/");
        const donation = data.find(d => d.id === parseInt(donationId));
        if (donation) setDonationTitle(donation.title);
      } catch (err) {
        console.error("Error loading donation:", err);
      }
    }

    if (needId) {
      try {
        const { data } = await apiFetch(`/needs/${needId}`);
        if (data) setNeedDetails(data);
      } catch (err) {
        console.error("Error loading need details:", err);
      }
    }
  };

  const handleConfirmFulfillment = async () => {
    if (!needDetails) return;
    setIsFulfilling(true);
    setShowModal(false);
    try {
      const items = needDetails.items || [];
      for (let idx = 0; idx < items.length; idx++) {
        await apiFetch(`/needs/${needDetails.id}/item/${idx}?brought=${items[idx].quantity}`, {
          method: "PATCH"
        });
      }

      await apiFetch(`/messages/?sender_email=${userEmail}`, {
        method: "POST",
        body: JSON.stringify({
          recipient_email: otherEmail,
          content: `✓ [SYSTEM] The request "${needDetails.title}" has been successfully marked as fulfilled! Thank you for your generous support!`,
          donation_id: null,
          need_id: needId ? parseInt(needId) : null,
        }),
      });

      const { data } = await apiFetch(`/needs/${needId}`);
      setNeedDetails(data);
      loadConversation();
    } catch (err) {
      console.error("Fulfillment process error:", err);
    } finally {
      setIsFulfilling(false);
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
            need_id: needId ? parseInt(needId) : null, // <-- REPARAT: Trimitem și need_id la salvare
          }),
      });

      if (response.ok) {
          setMessages([...messages, data]);
          setNewMessage("");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setLoading(false);
    }
  };

  const isNeedComplete = needDetails
    ? (needDetails.items || []).every(i => i.brought >= i.quantity)
    : false;

  return (
    <div className="pattern-bg" style={{ minHeight: "100vh", backgroundColor: colors.bg, padding: "40px 20px", boxSizing: "border-box" }}>

      <div style={{ maxWidth: "760px", width: "100%", margin: "0 auto" }}>

        {/* BARA DE TITLU - Stil elegant uniformizat ca pe Home */}
        <div style={{
          background: colors.blueLight,
          padding: "35px 40px",
          borderRadius: radius.xl,
          marginTop: "20px",
          marginBottom: "30px",
          boxShadow: shadow.soft
        }}>
          <h2 style={{ margin: 0, fontSize: "28px", color: colors.blueDark, fontWeight: 800 }}>
            {otherUserName}
          </h2>
          <p style={{ margin: "8px 0 0 0", color: colors.blueDark, opacity: 0.8, fontWeight: 500 }}>
            {donationTitle ? `Regarding Donation: "${donationTitle}"` : needDetails ? `Regarding Need List: "${needDetails.title}"` : "Direct conversation"}
          </p>
        </div>

        {/* WIDGET STATUS ONG */}
        {needDetails && userEmail === needDetails.organization_email && (
          <div style={{
            backgroundColor: isNeedComplete ? colors.blueLight : colors.yellowLight,
            border: `1px solid ${isNeedComplete ? colors.blue : colors.yellow}`,
            padding: "12px 20px", borderRadius: radius.md, marginBottom: "20px",
            display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: shadow.soft
          }}>
            <div style={{ flex: 1, paddingRight: "10px" }}>
              <h4 style={{ margin: 0, color: colors.text, fontWeight: 700, fontSize: "14px" }}>
                {isNeedComplete ? "✓ Request fulfilled!" : "Did they complete the request?"}
              </h4>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: colors.muted, lineHeight: 1.4 }}>
                {isNeedComplete
                  ? "Items delivered and system updated."
                  : "Mark this request as resolved if the items were received."}
              </p>
            </div>
            {!isNeedComplete && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                disabled={isFulfilling}
                style={{
                  backgroundColor: colors.blueDark, color: colors.white, border: "none",
                  padding: "8px 16px", borderRadius: radius.sm, fontWeight: "700",
                  cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap"
                }}
              >
                {isFulfilling ? "..." : "Confirm Delivery"}
              </button>
            )}
          </div>
        )}

        {/* CASETA DE CHAT */}
        <div style={{
          backgroundColor: colors.card,
          padding: "32px",
          borderRadius: radius.xl,
          boxShadow: shadow.card,
          border: `1px solid ${colors.border}`,
          height: "560px",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box"
        }}>

          <div
            ref={scrollContainerRef}
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              paddingRight: "6px",
              marginBottom: "20px"
            }}
          >
            {messages.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
                <p style={{ color: colors.muted, fontSize: "14px" }}>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.sender_email === userEmail;
                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>

                    {/* REPARAT: Etichetă de nume mică deasupra bulei de text pentru claritate completă */}
                    <span style={{ fontSize: "11px", color: colors.muted, marginBottom: "3px", padding: "0 4px", fontWeight: 600 }}>
                      {isMe ? "You" : otherUserName}
                    </span>

                    <div style={{
                      maxWidth: "75%", padding: "12px 16px", borderRadius: radius.md,
                      background: isMe ? colors.blueDark : colors.bg,
                      color: isMe ? colors.white : colors.text,
                      wordWrap: "break-word",
                      border: isMe ? "none" : `1px solid ${colors.border}`,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.01)"
                    }}>
                      <p style={{ margin: "0 0 4px 0", fontSize: 14, lineHeight: 1.4 }}>{msg.content}</p>
                      <p style={{ margin: 0, fontSize: "10px", opacity: 0.6, textAlign: "right" }}>
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "10px" }}>
            <input
              type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..." disabled={loading}
              style={{
                flex: 1, padding: "14px 16px", border: `2px solid ${colors.border}`,
                borderRadius: radius.md, fontSize: "14px", backgroundColor: colors.bg,
                outline: "none", color: colors.text
              }}
            />
            <button
              type="submit" disabled={loading || !newMessage.trim()}
              style={{
                padding: "0 24px", background: colors.blueDark, color: colors.white,
                border: "none", borderRadius: radius.md, fontWeight: 700, cursor: "pointer",
                opacity: loading || !newMessage.trim() ? 0.5 : 1
              }}
            >
              Send
            </button>
          </form>

        </div>
      </div>

      {/* POPUP MODAL */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(47, 59, 82, 0.6)",
          backdropFilter: "blur(4px)", display: "flex", justifyContent: "center",
          alignItems: "center", zIndex: 9999
        }}>
          <div style={{
            backgroundColor: colors.card, padding: "30px", borderRadius: radius.xl,
            maxWidth: "420px", width: "90%", boxShadow: shadow.card,
            border: `1px solid ${colors.border}`, textAlign: "center"
          }}>
            <h3 style={{ margin: "0 0 10px 0", color: colors.text, fontWeight: 800, fontSize: "20px" }}>
              Confirm Fulfillment?
            </h3>
            <p style={{ margin: "0 0 24px 0", color: colors.muted, fontSize: "14px", lineHeight: 1.5 }}>
              Are you sure you want to mark all items in this request as fully delivered?
              This will automatically update the listing progress and log a confirmation in the chat.
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  padding: "10px 20px", borderRadius: radius.md, border: `2px solid ${colors.border}`,
                  backgroundColor: colors.bg, color: colors.muted, fontWeight: 700, cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmFulfillment}
                style={{
                  padding: "10px 20px", borderRadius: radius.md, border: "none",
                  backgroundColor: colors.blueDark, color: colors.white, fontWeight: 700, cursor: "pointer"
                }}
              >
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}