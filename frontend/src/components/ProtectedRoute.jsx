import { Navigate } from "react-router-dom";
import { getCurrentUserEmail, getCurrentUserType } from "../utils/auth";

export default function ProtectedRoute({ children, blockedUserTypes = [], redirectTo = "/profile" }) {
  const userEmail = getCurrentUserEmail();
  const userType = getCurrentUserType();

  if (!userEmail) {
    return <Navigate to="/login" />;
  }

  if (blockedUserTypes.includes(userType)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
