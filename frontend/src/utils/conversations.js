export function getConversationDisplayName(conversation) {
  return conversation?.other_name || conversation?.other_email || "";
}

export function getConversationKey(conversation) {
  return [
    conversation?.other_email || "",
    conversation?.donation_id ?? "none",
    conversation?.need_id ?? "none",
  ].join("-");
}

export function buildConversationPath(conversation) {
  const params = new URLSearchParams();
  if (conversation.donation_id) params.set("donationId", conversation.donation_id);
  if (conversation.need_id) params.set("needId", conversation.need_id);

  const query = params.toString();
  return `/chat/${encodeURIComponent(conversation.other_email)}${query ? `?${query}` : ""}`;
}

export function sortConversationsByDate(conversations) {
  return [...conversations].sort((first, second) => {
    const firstDate = first.last_message_date ? new Date(first.last_message_date).getTime() : 0;
    const secondDate = second.last_message_date ? new Date(second.last_message_date).getTime() : 0;
    return secondDate - firstDate;
  });
}

export function getConversationContextLabel(conversation, donationMap, needMap, mode = "regarding", customLabels) {
  const defaultLabels = {
    regarding: {
      donation: "Regarding donation",
      donationFallback: "Regarding a donation",
      need: "Regarding need list",
      needFallback: "Regarding a need list",
      direct: "Direct conversation",
    },
    short: {
      donation: "Donation",
      donationFallback: "Donation conversation",
      need: "Need list",
      needFallback: "Need list conversation",
      direct: "Direct conversation",
    },
  };

  const labels = customLabels || defaultLabels;
  const copy = labels[mode] || labels.regarding;

  if (conversation.donation_id) {
    return donationMap[conversation.donation_id]
      ? `${copy.donation}: ${donationMap[conversation.donation_id]}`
      : copy.donationFallback;
  }

  if (conversation.need_id) {
    return needMap[conversation.need_id]
      ? `${copy.need}: ${needMap[conversation.need_id]}`
      : copy.needFallback;
  }

  return copy.direct;
}
