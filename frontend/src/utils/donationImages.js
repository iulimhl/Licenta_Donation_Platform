export function getDonationImages(imageValue) {
  if (!imageValue) return [];

  if (Array.isArray(imageValue)) {
    return imageValue.filter(Boolean);
  }

  try {
    const parsedImages = JSON.parse(imageValue);
    if (Array.isArray(parsedImages)) {
      return parsedImages.filter(Boolean);
    }
  } catch {
    return [imageValue].filter(Boolean);
  }

  return [imageValue].filter(Boolean);
}

export function getFirstDonationImage(imageValue) {
  return getDonationImages(imageValue)[0] || "";
}
