import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginGuard({ children }) {
  const { currentUser } = useAuth();

  return currentUser.email === "adriellam@hawaiilions.org" ? children : <Navigate to="/" />;
}
