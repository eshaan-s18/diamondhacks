"use client";

import React, { createContext, useContext, useState } from "react";

interface AdminContextType {
  adminEmail: string | null;
  setAdminEmail: (email: string | null) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  return (
    <AdminContext.Provider value={{ adminEmail, setAdminEmail }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};