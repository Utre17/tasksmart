import { ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Redirect, useLocation } from "wouter";
import { Spinner } from "@/components/ui/spinner";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  allowGuest?: boolean;
}

export default function ProtectedRoute({ children, requiredRole, allowGuest = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, isGuest } = useAuth();
  const [location] = useLocation();

  // Check if we're already on the auth page to prevent redirect loops
  const isAuthPage = location === "/auth";

  // Show loading state (but only if not on auth page)
  if (isLoading && !isAuthPage) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // If not authenticated and not on auth page, redirect to login
  if (!isAuthenticated && !isAuthPage) {
    return <Redirect to="/auth" />;
  }

  // Check if guest users are allowed on this route
  if (isGuest && !allowGuest) {
    return <Redirect to="/" />;
  }

  // If a role is required, check for that role
  if (requiredRole && !hasRole(requiredRole)) {
    return <Redirect to="/" />;
  }

  // If all checks pass, render the children
  return <>{children}</>;
}