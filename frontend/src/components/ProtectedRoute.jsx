import { Navigate } from "react-router-dom";
import { getCurrentUserEmail } from "../utils/auth";

export default function ProtectedRoute({ children }) {
  const userEmail = getCurrentUserEmail();

  if (!userEmail) {
    return <Navigate to="/login" />;
  }

  return children;
}
