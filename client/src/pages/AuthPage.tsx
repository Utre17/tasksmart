import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  // If user is already authenticated, redirect to home
  if (isAuthenticated) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary text-4xl w-12 h-12">
              <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">TaskSmart</h1>
          <p className="text-gray-600 mt-2">The smarter way to manage your tasks</p>
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

        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Your ultimate task management companion</p>
          <p className="mt-2">
            Powered by AI to help you organize your life and work more efficiently
          </p>
        </div>
      </div>

      <footer className="py-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} TaskSmart. All rights reserved.
      </footer>
    </div>
  );
}