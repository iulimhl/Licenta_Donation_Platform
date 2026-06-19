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

export const cleanAddressPart = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[()[\]{}]/g, " ")
  .replace(/[;]/g, ",")
  .replace(/\bjud\.?(?=\s|,|$)/gi, "judetul")
  .replace(/\bmun\.?(?=\s|,|$)/gi, "municipiul")
  .replace(/\bcom\.?(?=\s|,|$)/gi, "comuna")
  .replace(/\bsat\.?(?=\s|,|$)/gi, "sat")
  .replace(/\bstr\.?(?=\s|,|$)/gi, "strada")
  .replace(/\bnr\.?(?=\s|,|$)/gi, "numarul")
  .replace(/\bromania\b/gi, "")
  .replace(/\bclui\b/gi, "cluj")
  .replace(/\bflorestl\b/gi, "floresti")
  .replace(/\s+/g, " ")
  .trim();

const uniqueValues = (values) => values.filter((value, index, array) => value && array.indexOf(value) === index);

const makeRomaniaQuery = (...parts) => {
  const cleanParts = parts.filter(Boolean);
  return cleanParts.length ? [...cleanParts, "Romania"].join(", ") : "";
};

const getAdministrativeLocation = (location) => {
  const cleaned = cleanAddressPart(location);
  const countyMatch = cleaned.match(/\bjudetul\s+([^,]+?)(?=\s+\b(?:sat|comuna|oras|municipiul|strada|numarul)\b|,|$)/i);
  const localityMatch = cleaned.match(/\b(?:sat|comuna|oras|municipiul)\s+([^,]+?)(?=\s+\b(?:sat|comuna|oras|municipiul|strada|numarul|judetul)\b|,|$)/i);
  const county = countyMatch?.[1]?.trim();
  const locality = localityMatch?.[1]?.trim();

  if (locality && county) return `${locality}, ${county}`;
  if (locality) return locality;
  if (county) return county;
  return "";
};

export const getGeocodingQueries = ({ location, city, pickup_address }) => {
  const pickupAddress = cleanAddressPart(pickup_address);
  const cleanLocation = cleanAddressPart(location);
  const cleanCity = cleanAddressPart(city);
  const administrativeLocation = getAdministrativeLocation(location);

  return uniqueValues([
    makeRomaniaQuery(pickupAddress, cleanCity),
    makeRomaniaQuery(administrativeLocation),
    makeRomaniaQuery(cleanLocation, cleanCity),
    makeRomaniaQuery(pickupAddress, cleanLocation),
    makeRomaniaQuery(pickupAddress),
    makeRomaniaQuery(cleanLocation),
    makeRomaniaQuery(cleanCity),
  ]);
};

export const geocodeAddress = async (addressData) => {
  const queries = getGeocodingQueries(addressData);

  for (const query of queries) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=ro&limit=1&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
    } catch (err) {
      console.error("Address geocoding failed", err);
    }
  }

  return { lat: null, lng: null };
};

export const getShortAddress = (data) => {
  if (!data || !data.address) return "Locatie necunoscuta";

  const city = data.address.city || data.address.town || data.address.village || data.address.municipality || "";
  const county = data.address.county || data.address.state_district || data.address.state || data.address.region || "";
  if (city && county && city !== county) return `${city}, ${county}`;
  if (city) return city;
  if (county) return county;

  const parts = data.display_name.split(",").map((part) => part.trim());
  const cleanParts = parts.filter((part) =>
    part.toLowerCase() !== "romania" &&
    !/^\d{4,6}$/.test(part)
  );

  return cleanParts.slice(-2).join(", ");
};
