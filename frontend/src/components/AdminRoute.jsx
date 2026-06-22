import { Navigate } from "react-router-dom";
import { getCurrentUserEmail, isAdminUser } from "../utils/auth";

export default function AdminRoute({ children }) {
  const userEmail = getCurrentUserEmail();

  if (!userEmail) {
    return <Navigate to="/login" />;
  }

  if (!isAdminUser()) {
    return <Navigate to="/" />;
  }

  return children;
}
