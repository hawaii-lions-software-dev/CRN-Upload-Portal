import React, { useContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateEmail,
  updatePassword,
} from "firebase/auth";
import { isAdmin } from "../utils/authHelpers";

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState();
  const [loading, setLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  function localUpdateEmail(email) {
    return updateEmail(currentUser, email);
  }

  function localUpdatePassword(password) {
    return updatePassword(currentUser, password);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Check admin status whenever currentUser changes
  useEffect(() => {
    if (currentUser?.email) {
      setAdminCheckLoading(true);
      isAdmin(currentUser.email)
        .then(result => {
          setIsUserAdmin(result);
          setAdminCheckLoading(false);
        })
        .catch(error => {
          console.error("Error checking admin status:", error);
          setIsUserAdmin(false);
          setAdminCheckLoading(false);
        });
    } else {
      setIsUserAdmin(false);
      setAdminCheckLoading(false);
    }
  }, [currentUser]);

  const value = {
    currentUser,
    isUserAdmin,
    adminCheckLoading,
    login,
    logout,
    resetPassword,
    localUpdateEmail,
    localUpdatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
