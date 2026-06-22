import { clearAuthSession } from "../utils/auth";

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export function buildFileUrl(path) {
  if (!path) return "";
  if (path.startsWith("data:")) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path}`;
}

export function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 401 && !options.skipAuthRedirect) {
    clearAuthSession();

    if (window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
  }

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    console.warn("Response parsing failed:", err);
    data = null;
  }

  return { response, data };
}
