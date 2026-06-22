import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/api";
import {
  getConversationContextLabel,
  sortConversationsByDate,
} from "../utils/conversations";
import { useLanguage } from "../language/useLanguage";

export function useInbox({
  userEmail,
  enabled = true,
  pollMs = 0,
  includeUnreadCount = false,
  labelMode = "regarding",
} = {}) {
  const { t } = useLanguage();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [donationMap, setDonationMap] = useState({});
  const [needMap, setNeedMap] = useState({});

  const loadInbox = useCallback(async () => {
    if (!enabled || !userEmail) return;

    try {
      const { data: inboxData } = await apiFetch(
        `/messages/inbox?user_email=${encodeURIComponent(userEmail)}`
      );
      setConversations(inboxData || []);

      if (includeUnreadCount) {
        const { data: unreadData } = await apiFetch(
          `/messages/unread-count?user_email=${encodeURIComponent(userEmail)}`
        );
        setUnreadCount(unreadData?.unread_count || 0);
      }
    } catch (err) {
      console.error("Error loading inbox:", err);
    }
  }, [enabled, includeUnreadCount, userEmail]);

  const loadContextMaps = useCallback(async () => {
    if (!enabled || !userEmail) return;

    try {
      const [{ data: donationsData }, { data: needsData }] = await Promise.all([
        apiFetch("/donations/"),
        apiFetch("/needs/"),
      ]);

      setDonationMap(
        (donationsData || []).reduce((lookup, item) => {
          lookup[item.id] = item.title;
          return lookup;
        }, {})
      );

      setNeedMap(
        (needsData || []).reduce((lookup, item) => {
          lookup[item.id] = item.title;
          return lookup;
        }, {})
      );
    } catch (err) {
      console.error("Error loading conversation context maps:", err);
    }
  }, [enabled, userEmail]);

  const loadEverything = useCallback(async () => {
    if (!enabled || !userEmail) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await Promise.all([loadInbox(), loadContextMaps()]);
    } finally {
      setLoading(false);
    }
  }, [enabled, loadContextMaps, loadInbox, userEmail]);

  useEffect(() => {
    loadEverything();
  }, [loadEverything]);

  useEffect(() => {
    if (!enabled || !userEmail || !pollMs) return undefined;

    const interval = setInterval(loadInbox, pollMs);
    return () => clearInterval(interval);
  }, [enabled, loadInbox, pollMs, userEmail]);

  const sortedConversations = useMemo(
    () => sortConversationsByDate(conversations),
    [conversations]
  );

  const conversationLabels = useMemo(
    () => ({
      regarding: {
        donation: t("conversations.regardingDonation"),
        donationFallback: t("conversations.regardingDonationFallback"),
        need: t("conversations.regardingNeed"),
        needFallback: t("conversations.regardingNeedFallback"),
        direct: t("conversations.direct"),
      },
      short: {
        donation: t("conversations.shortDonation"),
        donationFallback: t("conversations.shortDonationFallback"),
        need: t("conversations.shortNeed"),
        needFallback: t("conversations.shortNeedFallback"),
        direct: t("conversations.direct"),
      },
    }),
    [t]
  );

  const getConversationLabel = useCallback(
    (conversation) => getConversationContextLabel(conversation, donationMap, needMap, labelMode, conversationLabels),
    [conversationLabels, donationMap, labelMode, needMap]
  );

  return {
    conversations,
    sortedConversations,
    loading,
    unreadCount,
    refreshInbox: loadInbox,
    refreshAll: loadEverything,
    getConversationLabel,
  };
}
