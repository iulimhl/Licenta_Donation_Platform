export const ADMIN_ROLE = "admin";

export function getCurrentUserEmail() {
  return localStorage.getItem("userEmail");
}

export function getCurrentUserType() {
  return localStorage.getItem("userType");
}

export function saveAuthSession(session) {
  localStorage.setItem("userEmail", session.email);
  localStorage.setItem("userType", session.user_type);
  localStorage.setItem("authToken", session.auth_token);
}

export function clearAuthSession() {
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userType");
  localStorage.removeItem("authToken");
  localStorage.removeItem("demoUser");
}

export function isAdminUser() {
  return getCurrentUserType() === ADMIN_ROLE;
}
