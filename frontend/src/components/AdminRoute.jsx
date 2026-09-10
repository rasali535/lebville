import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user === null) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

