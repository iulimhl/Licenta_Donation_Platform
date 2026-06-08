import { Navigate } from "react-router-dom";
import { isAdminUser } from "../utils/auth";

export default function AdminRoute({ children }) {
  const userEmail = localStorage.getItem("userEmail");

  if (!userEmail) {
    return <Navigate to="/login" />;
  }

  if (!isAdminUser()) {
    return <Navigate to="/" />;
  }

  return children;
}
