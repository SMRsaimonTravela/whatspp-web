import React from "react";
import { Navigate, useLocation } from "react-router";
import { useAuthStore } from "../../store/authStore";

interface SupportRouteProps {
  children: React.ReactNode;
}

export default function SupportRoute({ children }: SupportRouteProps) {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  // Only allow access to /admin/manual-booking-create and /admin/profile
  const allowedRoutes = [
    "/admin/manual-booking-create",
    "/admin/profile"
  ];

  // If user is support admin and tries to access a disallowed route, redirect
  if (
    user?.userType === "admin" &&
    user?.email?.includes("support") &&
    !allowedRoutes.includes(location.pathname)
  ) {
    return <Navigate to="/admin/manual-booking-create" replace />;
  }

  return <>{children}</>;
}

