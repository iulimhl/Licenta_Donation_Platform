export const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Geocoding failed", err);
    return null;
  }
};

export const getShortAddress = (data) => {
  if (!data || !data.address) return "Locație necunoscută";

  const city = data.address.city || data.address.town || data.address.village || data.address.municipality || "";
  const county = data.address.county || data.address.state_district || data.address.state || data.address.region || "";
  if (city && county && city !== county) return `${city}, ${county}`;
  if (city) return city;
  if (county) return county;
  const parts = data.display_name.split(',').map(s => s.trim());
  const cleanParts = parts.filter(part =>
    part.toLowerCase() !== 'românia' &&
    part.toLowerCase() !== 'romania' &&
    !/^\d{4,6}$/.test(part)
  );

  return cleanParts.slice(-2).join(", ");
};