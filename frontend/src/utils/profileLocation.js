import { geocodeAddress } from "../api/geo";

export function hasProfileAddress(form) {
  return [form.pickup_address, form.location, form.city].some((value) => String(value || "").trim());
}

export async function resolveProfileCoordinates(form, userType) {
  if (userType !== "organization") {
    return { lat: null, lng: null };
  }

  if (form.lat && form.lng) {
    return { lat: form.lat, lng: form.lng };
  }

  if (!hasProfileAddress(form)) {
    return { lat: null, lng: null };
  }

  return geocodeAddress(form);
}
