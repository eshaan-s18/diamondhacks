/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";
import styles from "./navbar.module.css";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import Link from "next/link";
import { useAdmin } from "./AdminContext"; // Import the useAdmin hook

interface NavBarProps {
  language: "en" | "hi";
  onLanguageChange: (lang: "en" | "hi") => void;
}

export default function NavBar({ language, onLanguageChange }: NavBarProps) {
  const { adminEmail, setAdminEmail } = useAdmin(); // Access the admin email from context
  const [loggedInUser, setLoggedInUser] = useState<{ firstName: string; lastName: string } | null>(
    null
  ); // State for logged-in user details
  const [modalType, setModalType] = useState<"login" | "createAccount" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false); // State for dropdown visibility

  // Translated content for the navigation bar
  const translatedNav = {
    about: language === "hi" ? "के बारे में" : "About",
    yourEvents: language === "hi" ? "आपकी घटनाएँ" : "Your Events",
    adminLogin: language === "hi" ? "प्रशासक लॉगिन" : "Admin Login",
    logOut: language === "hi" ? "लॉग आउट" : "Log Out",
  };

  // Check if the user is already logged in on component mount
  useEffect(() => {
    const storedEmail = localStorage.getItem("adminEmail");
    const storedUser = localStorage.getItem("loggedInUser");

    if (storedEmail && storedUser) {
      setAdminEmail(storedEmail); // Restore admin email in context
      setLoggedInUser(JSON.parse(storedUser)); // Restore logged-in user details
    }
  }, [setAdminEmail]);

  const handleOpenModal = (type: "login" | "createAccount") => {
    setModalType(type);
    setError("");
  };

  const handleCloseModal = () => {
    setModalType(null);
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setError("");
  };

  const handleSignIn = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      const response = await fetch(`/api/admin?email=${email}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch user data");
      }

      const userDetails = { firstName: data.firstName, lastName: data.lastName };
      setLoggedInUser(userDetails);
      setAdminEmail(email); // Store the admin's email in the context

      // Persist the logged-in state in localStorage
      localStorage.setItem("adminEmail", email);
      localStorage.setItem("loggedInUser", JSON.stringify(userDetails));

    //   alert("Signed in successfully!");
      handleCloseModal();
    } catch (err: any) {
      setError("Incorrect email/password");
    }
  };

  const handleCreateAccount = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);

      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save admin data");
      }

      const userDetails = { firstName, lastName };
      setLoggedInUser(userDetails);
      setAdminEmail(email); // Store the admin's email in the context

      // Persist the logged-in state in localStorage
      localStorage.setItem("adminEmail", email);
      localStorage.setItem("loggedInUser", JSON.stringify(userDetails));

      alert("Account created successfully! Please sign in.");
      handleCloseModal();
    } catch (err: any) {
      if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters long.");
      } else {
        setError("Error with creating account");
      }
    }
  };

  const handleLogOut = async () => {
    try {
      await signOut(auth); // Sign out from Firebase
      setLoggedInUser(null); // Reset the logged-in user state
      setAdminEmail(null); // Clear the admin's email from the context
      setShowDropdown(false); // Close the dropdown

      // Clear localStorage
      localStorage.removeItem("adminEmail");
      localStorage.removeItem("loggedInUser");

    //   alert("Logged out successfully!");
    } catch (err: any) {
      console.error("Error logging out:", err.message);
    }
  };

  return (
    <>
      <nav className={styles.navBar}>
        <div className={styles.navContainer}>
          {loggedInUser ? (
            <>
              <Link href="/your-events">
                <button className={styles.navButton}>{translatedNav.yourEvents}</button>
              </Link>
              <div className={styles.dropdownContainer}>
                <button
                  className={styles.navButton}
                  onClick={() => setShowDropdown((prev) => !prev)}
                >
                  {loggedInUser.firstName} {loggedInUser.lastName}
                </button>
                {showDropdown && (
                  <div className={styles.dropdownMenu}>
                    <button className={styles.dropdownItem} onClick={handleLogOut}>
                      {translatedNav.logOut}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button className={styles.navButton} onClick={() => handleOpenModal("login")}>
              {translatedNav.adminLogin}
            </button>
          )}
        </div>
      </nav>

      {/* Login Modal */}
      {modalType === "login" && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{translatedNav.adminLogin}</h2>
            {error && <p className={styles.errorText}>{error}</p>}
            <input
              type="email"
              placeholder="Email"
              className={styles.modalInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className={styles.modalInput}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className={styles.modalButtons}>
              <button
                className={styles.modalButton}
                onClick={() => handleOpenModal("createAccount")}
              >
                Create an Account
              </button>
              <button className={styles.modalButton} onClick={handleSignIn}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
        {modalType === "createAccount" && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Create an Account</h2>
            {error && <p className={styles.errorText}>{error}</p>}
            <input
                type="text"
                placeholder="First Name"
                className={styles.modalInput}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
            />
            <input
                type="text"
                placeholder="Last Name"
                className={styles.modalInput}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
            />
            <input
                type="email"
                placeholder="Email"
                className={styles.modalInput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                className={styles.modalInput}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <div className={styles.modalButtons}>
                <button className={styles.modalButton} onClick={handleCreateAccount}>
                Create Account
                </button>
                <button className={styles.modalButton} onClick={handleCloseModal}>
                Cancel
                </button>
            </div>
            </div>
        </div>
        )}
    </>
  );
}