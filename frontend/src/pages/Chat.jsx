import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/api";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineInbox,
  HiOutlinePaperAirplane,
  HiOutlineCheckCircle,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import "../styles/pages/Chat.css";

export default function Chat() {
  const { otherEmail } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = localStorage.getItem("userEmail");

  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [otherUserName, setOtherUserName] = useState(otherEmail);
  const [donationTitle, setDonationTitle] = useState("");
  const [needDetails, setNeedDetails] = useState(null);
  const [isFulfilling, setIsFulfilling] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [donationMap, setDonationMap] = useState({});
  const [needMap, setNeedMap] = useState({});

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
    loadInbox();
    loadContextMaps();

    const interval = setInterval(() => {
      loadConversation();
      loadInbox();
    }, 3000);

    return () => clearInterval(interval);
  }, [otherEmail, userEmail, donationId, needId]);

  useEffect(() => {
    if (messages.length > 0 && scrollContainerRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (isFirstLoad || lastMessage.sender_email === userEmail) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: isFirstLoad ? "auto" : "smooth",
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
      setNewMessage(
        `Hi! I would like to help with your request: "${needDetails.title}". I can bring the needed items.`
      );
    }
  }, [messages, needDetails, userEmail]);

  const loadConversation = async () => {
    try {
      let path = `/messages/conversation?other_email=${encodeURIComponent(
        otherEmail
      )}&user_email=${encodeURIComponent(userEmail)}`;

      if (donationId) path += `&donation_id=${encodeURIComponent(donationId)}`;
      if (needId) path += `&need_id=${encodeURIComponent(needId)}`;

      const { data } = await apiFetch(path);
      setMessages(data || []);
    } catch (err) {
      console.error("Error loading conversation:", err);
    }
  };

  const loadInbox = async () => {
    try {
      const { data } = await apiFetch(
        `/messages/inbox?user_email=${encodeURIComponent(userEmail)}`
      );
      setConversations(data || []);
    } catch (err) {
      console.error("Error loading inbox:", err);
    } finally {
      setLoadingInbox(false);
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
      console.error("Error loading context maps:", err);
    }
  };

  const loadUserInfo = async () => {
    try {
      const { data } = await apiFetch(`/auth/user/${encodeURIComponent(otherEmail)}`);
      setOtherUserName(data?.name || otherEmail);
    } catch (err) {
      console.error("Error loading user info:", err);
    }

    if (donationId) {
      try {
        const { data } = await apiFetch("/donations/");
        const donation = (data || []).find((d) => d.id === parseInt(donationId));
        if (donation) setDonationTitle(donation.title);
      } catch (err) {
        console.error("Error loading donation:", err);
      }
    } else {
      setDonationTitle("");
    }

    if (needId) {
      try {
        const { data } = await apiFetch(`/needs/${encodeURIComponent(needId)}`);
        if (data) setNeedDetails(data);
      } catch (err) {
        console.error("Error loading need details:", err);
      }
    } else {
      setNeedDetails(null);
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
          method: "PATCH",
        });
      }

      await apiFetch(`/messages/?sender_email=${encodeURIComponent(userEmail)}`, {
        method: "POST",
        body: JSON.stringify({
          recipient_email: otherEmail,
          content: `[SYSTEM] The request "${needDetails.title}" has been successfully marked as fulfilled.`,
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

  const parseOfferMessage = (content) => {
    const match = content?.match(/^\[OFFER:item_index=(\d+)\]\s*(.*)$/);
    if (!match) return null;

    const itemIndex = Number(match[1]);
    const item = needDetails?.items?.[itemIndex];

    return {
      itemIndex,
      text: match[2] || "I can bring this item.",
      item,
      isConfirmed: item ? item.brought >= item.quantity && item.quantity > 0 : false,
    };
  };

  const handleConfirmOffer = async (itemIndex) => {
    if (!needDetails?.items?.[itemIndex]) return;

    const item = needDetails.items[itemIndex];

    try {
      const { response } = await apiFetch(
        `/needs/${needDetails.id}/item/${itemIndex}?brought=${item.quantity}`,
        { method: "PATCH" }
      );

      if (!response.ok) {
        alert("Could not confirm this item.");
        return;
      }

      await apiFetch(`/messages/?sender_email=${encodeURIComponent(userEmail)}`, {
        method: "POST",
        body: JSON.stringify({
          recipient_email: otherEmail,
          content: `[SYSTEM] Confirmed received: ${item.name}.`,
          donation_id: null,
          need_id: needId ? parseInt(needId) : null,
        }),
      });

      const { data } = await apiFetch(`/needs/${needId}`);
      setNeedDetails(data);
      loadConversation();
    } catch (err) {
      console.error("Confirm offer error:", err);
      alert("Could not contact the server.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const { response, data } = await apiFetch(
        `/messages/?sender_email=${encodeURIComponent(userEmail)}`,
        {
          method: "POST",
          body: JSON.stringify({
            recipient_email: otherEmail,
            content: newMessage,
            donation_id: donationId ? parseInt(donationId) : null,
            need_id: needId ? parseInt(needId) : null,
          }),
        }
      );

      if (response.ok) {
        const msg = {
          ...data,
          created_at: data?.created_at ?? new Date().toISOString(),
        };
        setMessages((prev) => [...prev, msg]);
        setNewMessage("");
        loadInbox();
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setLoading(false);
    }
  };

  const isNeedComplete = needDetails
    ? (needDetails.items || []).every((i) => i.brought >= i.quantity)
    : false;

  const getConversationLabel = (conv) => {
    if (conv.donation_id) {
      return donationMap[conv.donation_id]
        ? `Donation: ${donationMap[conv.donation_id]}`
        : "Donation conversation";
    }

    if (conv.need_id) {
      return needMap[conv.need_id]
        ? `Need list: ${needMap[conv.need_id]}`
        : "Need list conversation";
    }

    return "Direct conversation";
  };

  const openConversation = (conv) => {
    const params = new URLSearchParams();
    if (conv.donation_id) params.set("donationId", conv.donation_id);
    if (conv.need_id) params.set("needId", conv.need_id);

    navigate(
      `/chat/${encodeURIComponent(conv.other_email)}${
        params.toString() ? `?${params.toString()}` : ""
      }`
    );
  };

  const activeKey = `${otherEmail}-${donationId ?? "none"}-${needId ?? "none"}`;

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const da = a.last_message_date ? new Date(a.last_message_date).getTime() : 0;
      const db = b.last_message_date ? new Date(b.last_message_date).getTime() : 0;
      return db - da;
    });
  }, [conversations]);

  return (
    <div className="chat-page">
      <section className="chat-banner">
        <div className="chat-banner-inner">
          <div className="chat-kicker">
            <HiOutlineChatBubbleLeftRight size={16} />
            <span>Community messages</span>
          </div>

          <h1>Messages</h1>
          <p>Keep in touch with donors, recipients, and organizations in one place.</p>
        </div>
      </section>

      <div className="chat-shell">
        <div className="chat-layout">
          <aside className="chat-inbox-card">
            <div className="chat-inbox-header">
              <div className="chat-inbox-title-row">
                <div className="chat-icon-box">
                  <HiOutlineInbox size={20} />
                </div>

                <div>
                  <h2>Inbox</h2>
                  <p>Your active conversations</p>
                </div>
              </div>
            </div>

            <div className="chat-inbox-list">
              {loadingInbox ? (
                <div className="chat-inbox-state">Loading inbox...</div>
              ) : sortedConversations.length === 0 ? (
                <div className="chat-inbox-state center">No conversations yet.</div>
              ) : (
                sortedConversations.map((conv, idx) => {
                  const conversationKey = `${conv.other_email}-${conv.donation_id ?? "none"}-${conv.need_id ?? "none"}`;
                  const isActive = conversationKey === activeKey;

                  return (
                    <button
                      key={`${conversationKey}-${idx}`}
                      onClick={() => openConversation(conv)}
                      className={`chat-conversation-button ${isActive ? "active" : ""}`}
                    >
                      <div className="chat-conversation-top">
                        <div className="chat-conversation-text">
                          <div className="chat-conversation-email">{conv.other_email}</div>
                          <div className="chat-conversation-context">{getConversationLabel(conv)}</div>
                        </div>

                        {conv.unread_count > 0 && (
                          <div className="chat-unread-badge">{conv.unread_count}</div>
                        )}
                      </div>

                      <div className="chat-conversation-preview">{conv.last_message}</div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <main className="chat-main-card">
            <div className="chat-thread-header">
              <div className="chat-thread-title-row">
                <div className="chat-icon-box large">
                  <HiOutlineUserCircle size={24} />
                </div>

                <div>
                  <h2>{otherUserName}</h2>
                  <p>
                    {donationTitle
                      ? `Regarding donation: "${donationTitle}"`
                      : needDetails
                      ? `Regarding need list: "${needDetails.title}"`
                      : "Direct conversation"}
                  </p>
                </div>
              </div>
            </div>

            {needDetails && userEmail === needDetails.organization_email && (
              <div className={`chat-fulfillment ${isNeedComplete ? "complete" : "pending"}`}>
                <div>
                  <div className="chat-fulfillment-title">
                    {isNeedComplete ? "Request fulfilled" : "Did they complete the request?"}
                  </div>
                  <div className="chat-fulfillment-text">
                    {isNeedComplete
                      ? "Items delivered and system updated."
                      : "Mark this request as resolved if the items were received."}
                  </div>
                </div>

                {!isNeedComplete && (
                  <button type="button" onClick={() => setShowModal(true)} disabled={isFulfilling}>
                    <HiOutlineCheckCircle size={18} />
                    <span>{isFulfilling ? "..." : "Confirm Delivery"}</span>
                  </button>
                )}
              </div>
            )}

            <div ref={scrollContainerRef} className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-empty-thread">No messages yet. Start the conversation!</div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_email === userEmail;
                  const offer = parseOfferMessage(msg.content);
                  const isSystemMessage = msg.content?.startsWith("[SYSTEM]");
                  const visibleContent = isSystemMessage
                    ? msg.content.replace("[SYSTEM]", "").trim()
                    : offer
                    ? offer.text
                    : msg.content;

                  return (
                    <div
                      key={idx}
                      className={`chat-message-row ${isMe ? "me" : "other"} ${isSystemMessage ? "system" : ""}`}
                    >
                      <span className="chat-message-author">{isMe ? "You" : otherUserName}</span>

                      <div className="chat-message-bubble">
                        {offer && <div className="chat-offer-label">Item offer</div>}
                        <p>{visibleContent}</p>
                        {offer?.item && (
                          <div className="chat-offer-card">
                            <div>
                              <strong>{offer.item.name}</strong>
                              <span>{offer.item.brought || 0}/{offer.item.quantity} received</span>
                            </div>

                            {userEmail === needDetails?.organization_email && !offer.isConfirmed && (
                              <button type="button" onClick={() => handleConfirmOffer(offer.itemIndex)}>
                                Confirm received
                              </button>
                            )}

                            {offer.isConfirmed && (
                              <span className="chat-offer-confirmed">Confirmed</span>
                            )}
                          </div>
                        )}
                        <time>
                          {msg.created_at
                            ? new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </time>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="chat-compose">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={loading}
              />
              <button type="submit" disabled={loading || !newMessage.trim()}>
                <HiOutlinePaperAirplane size={18} />
                <span>Send</span>
              </button>
            </form>
          </main>
        </div>
      </div>

      {showModal && (
        <div className="chat-modal-backdrop">
          <div className="chat-modal">
            <h3>Confirm fulfillment?</h3>

            <p>
              Are you sure you want to mark all items in this request as fully delivered?
              This will update the listing progress and add a confirmation in chat.
            </p>

            <div className="chat-modal-actions">
              <button type="button" onClick={() => setShowModal(false)} className="secondary">
                Cancel
              </button>

              <button type="button" onClick={handleConfirmFulfillment} className="primary">
                Yes, confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
