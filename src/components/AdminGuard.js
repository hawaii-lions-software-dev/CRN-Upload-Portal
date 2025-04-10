import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { isAdmin } from "../utils/authHelpers";

export default function LoginGuard({ children }) {
  const { currentUser } = useAuth();

  return isAdmin(currentUser.email) ? children : <Navigate to="/" />;
}
