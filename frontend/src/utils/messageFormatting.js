export function getCleanMessagePreview(content = "") {
  const text = String(content || "");

  const offerMatch = text.match(/^\[OFFER:item_index=\d+(?:;amount=\d+)?\]\s*(.*)$/);
  if (offerMatch) return offerMatch[1] || "Item offer";

  const confirmedOfferMatch = text.match(/^\[CONFIRMED_OFFER:[^\]]+\]\s*(.*)$/);
  if (confirmedOfferMatch) return confirmedOfferMatch[1] || "Confirmed item delivery";

  const reserveMatch = text.match(/^\[RESERVE(?::[^\]]*)?\]\s*(.*)$/);
  if (reserveMatch) return reserveMatch[1] || "Reservation request";

  return text.replace(/^\[SYSTEM\]\s*/, "");
}

export function parseReservationMessage(message) {
  const content = message?.content || "";
  const match = content.match(/^\[RESERVE(?::donation_id=(\d+))?\]\s*(.*)$/);
  if (!match) return null;

  return {
    donationId: match[1] ? Number(match[1]) : null,
    text: match[2] || "I want to reserve this donation.",
  };
}

export function addReservationMetadata(content, donationId) {
  const text = String(content || "").trim();
  if (!text || text.startsWith("[RESERVE")) return text;
  return `[RESERVE:donation_id=${donationId}] ${text}`;
}
