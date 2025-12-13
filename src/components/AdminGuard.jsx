import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginGuard({ children }) {
  const { isUserAdmin, adminCheckLoading } = useAuth();

  if (adminCheckLoading) {
    return <div>Loading...</div>;
  }

  return isUserAdmin ? children : <Navigate to="/" />;
}
