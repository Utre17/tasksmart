import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [location, setLocation] = useLocation();
  const { isRealAuthenticated, isGuest } = useAuth();

  // Parse URL for the mode parameter
  useEffect(() => {
    // Get search params from the URL
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get("mode");
    
    // Set auth mode based on URL parameter
    if (mode === "register") {
      setAuthMode("register");
    }
  }, [location]);

  // Redirect only real authenticated users to home (guests can visit auth page)
  useEffect(() => {
    if (isRealAuthenticated) {
      // Use a short timeout to avoid potential race conditions
      const redirectTimer = setTimeout(() => {
        setLocation("/");
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [isRealAuthenticated, setLocation]);

  // If user is really authenticated (not guest), show loading until redirect
  if (isRealAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">Already signed in, redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary text-4xl w-12 h-12">
              <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">TaskSmart</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">The smarter way to manage your tasks</p>
        </div>

        <div className="w-full max-w-md">
          {authMode === "login" ? (
            <LoginForm 
              onSuccess={() => setLocation("/")}
              onRegisterClick={() => setAuthMode("register")}
            />
          ) : (
            <RegisterForm 
              onSuccess={() => setLocation("/")}
              onLoginClick={() => setAuthMode("login")}
            />
          )}
        </div>

        {/* Display special message for guest users */}
        {isGuest && authMode === "register" && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300">
            <p className="text-sm">
              <strong>Guest User:</strong> Creating an account will allow you to save your tasks permanently and access advanced features!
            </p>
          </div>
        )}

        <div className="mt-12 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Your ultimate task management companion</p>
          <p className="mt-2">
            Powered by AI to help you organize your life and work more efficiently
          </p>
        </div>
      </div>

      <footer className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} TaskSmart. All rights reserved.
      </footer>
    </div>
  );
}