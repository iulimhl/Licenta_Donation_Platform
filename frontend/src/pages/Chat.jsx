import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiFetch, buildFileUrl } from "../api/api";
import {
  HiOutlineInbox,
  HiOutlinePaperAirplane,
  HiOutlineCheckCircle,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import SectionBanner from "../components/common/SectionBanner";
import ConversationList from "../components/messages/ConversationList";
import { useInbox } from "../hooks/useInbox";
import { useLanguage } from "../language/useLanguage";
import {
  addReservationMetadata,
  parseReservationMessage,
} from "../utils/messageFormatting";
import {
  buildConversationPath,
  getConversationKey,
} from "../utils/conversations";
import "../styles/pages/Chat.css";

export default function Chat() {
  const { otherEmail } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = localStorage.getItem("userEmail");

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [otherUserName, setOtherUserName] = useState(otherEmail);
  const [otherUserLogo, setOtherUserLogo] = useState("");
  const [donationTitle, setDonationTitle] = useState("");
  const [needDetails, setNeedDetails] = useState(null);
  const [isFulfilling, setIsFulfilling] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [reservationDraftActive, setReservationDraftActive] = useState(false);
  const [threadError, setThreadError] = useState("");
  const [sendError, setSendError] = useState("");
  const { t } = useLanguage();

  const scrollContainerRef = useRef(null);

  const searchParams = new URLSearchParams(location.search);
  const donationId = searchParams.get("donationId");
  const needId = searchParams.get("needId");
  const draftMessage = searchParams.get("draft");
  const draftType = searchParams.get("draftType");
  const {
    loading: loadingInbox,
    sortedConversations,
    refreshInbox,
    getConversationLabel,
  } = useInbox({
    userEmail,
    enabled: Boolean(userEmail),
    pollMs: 3000,
    labelMode: "short",
  });

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
      !newMessage &&
      !draftMessage
    ) {
      setNewMessage(
        `Hi! I would like to help with your request: "${needDetails.title}". I can bring the needed items.`
      );
    }
  }, [messages, needDetails, userEmail, newMessage, draftMessage]);

  useEffect(() => {
    if (draftMessage && !newMessage) {
      setNewMessage(draftMessage);
      setReservationDraftActive(draftType === "reserve");
    }
  }, [draftMessage, draftType, newMessage]);

  const loadConversation = useCallback(async () => {
    try {
      let path = `/messages/conversation?other_email=${encodeURIComponent(
        otherEmail
      )}&user_email=${encodeURIComponent(userEmail)}`;

      if (donationId) path += `&donation_id=${encodeURIComponent(donationId)}`;
      if (needId) path += `&need_id=${encodeURIComponent(needId)}`;

      const { response, data } = await apiFetch(path);
      if (!response.ok) {
        setThreadError(data?.detail || t("messages.threadLoadError"));
        return;
      }

      setThreadError("");
      setMessages(data || []);
    } catch (err) {
      console.error("Error loading conversation:", err);
      setThreadError(t("messages.threadLoadError"));
    }
  }, [donationId, needId, otherEmail, userEmail, t]);

  const loadUserInfo = useCallback(async () => {
    try {
      const { data } = await apiFetch(`/auth/public/${encodeURIComponent(otherEmail)}`);
      setOtherUserName(data?.name || otherEmail);
      setOtherUserLogo(data?.logo_url || "");
    } catch (err) {
      console.error("Error loading user info:", err);
      setOtherUserLogo("");
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
  }, [donationId, needId, otherEmail]);

  useEffect(() => {
    if (!userEmail) {
      navigate("/login");
      return;
    }

    loadConversation();
    loadUserInfo();

    const interval = setInterval(loadConversation, 3000);

    return () => clearInterval(interval);
  }, [loadConversation, loadUserInfo, navigate, userEmail]);

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

  const confirmedOfferIds = useMemo(() => {
    const ids = new Set();

    messages.forEach((message) => {
      const match = message.content?.match(/^\[CONFIRMED_OFFER:offer_id=(\d+)/);
      if (match) ids.add(Number(match[1]));
    });

    return ids;
  }, [messages]);

  const parseOfferMessage = (message) => {
    const content = message?.content || "";
    const match = content.match(/^\[OFFER:item_index=(\d+)(?:;amount=(\d+))?\]\s*(.*)$/);
    if (!match) return null;

    const itemIndex = Number(match[1]);
    const amount = Number(match[2] || 0);
    const item = needDetails?.items?.[itemIndex];
    const remaining = item ? Math.max((item.quantity || 0) - (item.brought || 0), 0) : 0;
    const offeredAmount = amount > 0 ? amount : remaining || item?.quantity || 1;

    return {
      messageId: message.id,
      itemIndex,
      amount: offeredAmount,
      text: match[3] || "I can bring this item.",
      item,
      isConfirmed: confirmedOfferIds.has(message.id) || (item ? item.brought >= item.quantity && item.quantity > 0 : false),
    };
  };

  const handleConfirmOffer = async (offer) => {
    if (!needDetails?.items?.[offer.itemIndex]) return;

    const item = needDetails.items[offer.itemIndex];
    const currentBrought = item.brought || 0;
    const nextBrought = Math.min(currentBrought + offer.amount, item.quantity);

    try {
      const { response } = await apiFetch(
        `/needs/${needDetails.id}/item/${offer.itemIndex}?brought=${nextBrought}`,
        { method: "PATCH" }
      );

      if (!response.ok) {
        setSendError("Could not confirm this item.");
        return;
      }

      await apiFetch(`/messages/?sender_email=${encodeURIComponent(userEmail)}`, {
        method: "POST",
        body: JSON.stringify({
          recipient_email: otherEmail,
          content: `[CONFIRMED_OFFER:offer_id=${offer.messageId};item_index=${offer.itemIndex};amount=${offer.amount}] Confirmed received: ${offer.amount} ${item.name}.`,
          donation_id: null,
          need_id: needId ? parseInt(needId) : null,
        }),
      });

      const { data } = await apiFetch(`/needs/${needId}`);
      setNeedDetails(data);
      loadConversation();
    } catch (err) {
      console.error("Confirm offer error:", err);
      setSendError("Could not contact the server.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    setSendError("");
    try {
      const messageContent =
        reservationDraftActive && donationId
          ? addReservationMetadata(newMessage, donationId)
          : newMessage;

      const { response, data } = await apiFetch(
        `/messages/?sender_email=${encodeURIComponent(userEmail)}`,
        {
          method: "POST",
          body: JSON.stringify({
            recipient_email: otherEmail,
            content: messageContent,
            donation_id: donationId ? parseInt(donationId) : null,
            need_id: needId ? parseInt(needId) : null,
          }),
        }
      );

      if (!response.ok) {
        setSendError(data?.detail || t("messages.sendError"));
        return;
      }

      const msg = {
        ...data,
        created_at: data?.created_at ?? new Date().toISOString(),
      };
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
      setReservationDraftActive(false);
      refreshInbox();
    } catch (err) {
      console.error("Error sending message:", err);
      setSendError(t("messages.sendError"));
    } finally {
      setLoading(false);
    }
  };

  const isNeedComplete = needDetails
    ? (needDetails.items || []).every((i) => i.brought >= i.quantity)
    : false;

  const activeKey = getConversationKey({
    other_email: otherEmail,
    donation_id: donationId,
    need_id: needId,
  });

  return (
    <div className="chat-page">
      <SectionBanner
        title={t("messages.title")}
        subtitle={t("messages.subtitle")}
      />

      <div className="chat-shell">
        <div className="chat-layout">
          <aside className="chat-inbox-card surface-card">
            <div className="chat-inbox-header">
              <div className="chat-inbox-title-row">
                <div className="chat-icon-box">
                  <HiOutlineInbox size={20} />
                </div>

                <div>
                  <h2>{t("messages.inbox")}</h2>
                  <p>{t("messages.activeConversations")}</p>
                </div>
              </div>
            </div>

            <div className="chat-inbox-list">
              <ConversationList
                variant="chat"
                loading={loadingInbox}
                conversations={sortedConversations}
                activeKey={activeKey}
                onOpen={(conversation) => navigate(buildConversationPath(conversation))}
                getConversationLabel={getConversationLabel}
              />
            </div>
          </aside>

          <main className="chat-main-card surface-card">
            <div className="chat-thread-header">
              <div className="chat-thread-title-row">
                <div className="chat-icon-box large">
                  {otherUserLogo ? (
                    <img src={buildFileUrl(otherUserLogo)} alt={otherUserName} />
                  ) : (
                    <HiOutlineUserCircle size={24} />
                  )}
                </div>

                <div>
                  <h2>{otherUserName}</h2>
                  <p>
                    {donationTitle
                      ? `${t("conversations.regardingDonation")}: "${donationTitle}"`
                      : needDetails
                      ? `${t("conversations.regardingNeed")}: "${needDetails.title}"`
                      : t("conversations.direct")}
                  </p>
                </div>
              </div>
            </div>

            {threadError && <div className="chat-feedback error">{threadError}</div>}

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
                <div className="chat-empty-thread">{t("messages.emptyThread")}</div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_email === userEmail;
                  const offer = parseOfferMessage(msg);
                  const reservation = parseReservationMessage(msg);
                  const isSystemMessage =
                    msg.content?.startsWith("[SYSTEM]") ||
                    msg.content?.startsWith("[CONFIRMED_OFFER:");
                  const visibleContent = isSystemMessage
                    ? msg.content
                        .replace("[SYSTEM]", "")
                        .replace(/^\[CONFIRMED_OFFER:[^\]]+\]/, "")
                        .trim()
                    : offer
                    ? offer.text
                    : reservation
                    ? reservation.text
                    : msg.content;

                  return (
                    <div
                      key={idx}
                      className={`chat-message-row ${isMe ? "me" : "other"} ${isSystemMessage ? "system" : ""}`}
                    >
                      <span className="chat-message-author">{isMe ? t("messages.you") : otherUserName}</span>

                      <div className="chat-message-bubble">
                        {offer && <div className="chat-offer-label">Item offer</div>}
                        {reservation && <div className="chat-offer-label">Reservation request</div>}
                        <p>{visibleContent}</p>
                        {offer?.item && (
                          <div className="chat-offer-card">
                            <div>
                              <strong>{offer.item.name}</strong>
                              <span>Offered: {offer.amount}</span>
                              <span>{offer.item.brought || 0}/{offer.item.quantity} received</span>
                            </div>

                            {userEmail === needDetails?.organization_email && !offer.isConfirmed && (
                              <button type="button" onClick={() => handleConfirmOffer(offer)}>
                                Confirm received
                              </button>
                            )}

                            {offer.isConfirmed && (
                              <span className="chat-offer-confirmed">Confirmed</span>
                            )}
                          </div>
                        )}
                        {reservation && (
                          <div className="chat-offer-card">
                            <div>
                              <strong>{donationTitle || "Donation"}</strong>
                              <span>Reservation request</span>
                              <span>Discuss pickup details in chat</span>
                            </div>
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
              {sendError && <div className="chat-feedback error compose-error">{sendError}</div>}
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t("messages.typeMessage")}
                disabled={loading}
              />
              <button type="submit" disabled={loading || !newMessage.trim()}>
                <HiOutlinePaperAirplane size={18} />
                <span>{loading ? t("messages.sending") : t("messages.send")}</span>
              </button>
            </form>
          </main>
        </div>
      </div>

      {showModal && (
        <div className="chat-modal-backdrop">
          <div className="chat-modal surface-card">
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
