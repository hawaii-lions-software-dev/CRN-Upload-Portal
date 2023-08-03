import React from "react";
import Signup from "./Signup";
import { AuthProvider } from "../contexts/AuthContext";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import Login from "./Login";
import LoginGuard from "./LoginGuard";
import AdminGuard from "./AdminGuard";
import ForgotPassword from "./ForgotPassword";
import EditProfile from "./EditProfile";
import Navbar from "./Navbar";
import Admin from "./Admin";

function App() {
  return (
    <div>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route
            path="/"
            element={
              <LoginGuard>
                <Dashboard />
              </LoginGuard>
            }
          />
          <Route
            path="/edit-profile"
            element={
              <LoginGuard>
                <EditProfile />
              </LoginGuard>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <Admin />
              </AdminGuard>
            }
          />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;
