export function getRemainingNeedQuantity(item) {
  return Math.max((item?.quantity || 0) - (item?.brought || 0), 0);
}

export function clampNeedOfferAmount(item, value) {
  const remaining = getRemainingNeedQuantity(item);
  return Math.max(1, Math.min(Number(value) || 1, remaining || 1));
}

export function buildNeedOfferMessage(itemIndex, amount, itemName) {
  return `[OFFER:item_index=${itemIndex};amount=${amount}] I can bring ${amount} ${itemName}.`;
}
