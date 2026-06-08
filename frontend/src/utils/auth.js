export const ADMIN_ROLE = "admin";

export function isAdminUser() {
  return localStorage.getItem("userType") === ADMIN_ROLE;
}
