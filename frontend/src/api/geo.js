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
const geocodeCache = new Map();

const stripHouseNumber = (value) => cleanAddressPart(value)
  .replace(/\bnumarul\s+\d+[a-z]?\b/gi, "")
  .replace(/\bnr\s*\.?\s*\d+[a-z]?\b/gi, "")
  .replace(/\s+,/g, ",")
  .replace(/,\s*,/g, ",")
  .replace(/\s+/g, " ")
  .replace(/,\s*$/g, "")
  .trim();

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

const getCommaSeparatedLocation = (location) => {
  const parts = cleanAddressPart(location)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`;
  return "";
};

const getStreetFirstAddress = (location) => {
  const parts = cleanAddressPart(location)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 3) return "";

  const [locality, county, ...streetParts] = parts;
  const street = streetParts
    .join(", ")
    .replace(/\bnumarul\s+(\d+[a-z]?)\b/gi, "$1")
    .trim();

  return street ? `${street}, ${locality}, ${county}` : "";
};

export const getGeocodingQueries = ({ location, city, pickup_address }) => {
  const pickupAddress = cleanAddressPart(pickup_address);
  const cleanLocation = cleanAddressPart(location);
  const cleanCity = cleanAddressPart(city);
  const administrativeLocation =
    getAdministrativeLocation(location) ||
    getCommaSeparatedLocation(location) ||
    getAdministrativeLocation(pickup_address) ||
    getCommaSeparatedLocation(pickup_address);
  const streetFirstLocation = getStreetFirstAddress(location) || getStreetFirstAddress(pickup_address);
  const locationWithoutNumber = stripHouseNumber(location);
  const pickupWithoutNumber = stripHouseNumber(pickup_address);

  return uniqueValues([
    makeRomaniaQuery(pickupAddress, cleanCity),
    makeRomaniaQuery(streetFirstLocation),
    makeRomaniaQuery(locationWithoutNumber),
    makeRomaniaQuery(pickupWithoutNumber, cleanCity),
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
  const cacheKey = queries.join("|").toLowerCase();

  if (!queries.length) return { lat: null, lng: null };
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey);

  try {
    const stored = typeof window !== "undefined"
      ? window.sessionStorage.getItem(`geocode:${cacheKey}`)
      : null;
    if (stored) {
      const cached = JSON.parse(stored);
      geocodeCache.set(cacheKey, cached);
      return cached;
    }
  } catch {
    // Session storage is optional; geocoding still works without it.
  }

  for (const query of queries) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=ro&limit=1&q=${encodeURIComponent(query)}`
      );
      if (!response.ok) continue;

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const result = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        geocodeCache.set(cacheKey, result);
        try {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(`geocode:${cacheKey}`, JSON.stringify(result));
          }
        } catch {
          // Ignore storage failures.
        }
        return result;
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
