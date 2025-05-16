import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { Button } from "./ui/button";
import { auth } from "@/lib/firebase";
import api from "@/lib/api";

export function AuthDebug() {
  const { firebaseUser, user, isLoading, isAuthenticated } = useAuth();
  const [testResponse, setTestResponse] = useState<any>(null);
  const [verifyResponse, setVerifyResponse] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const getToken = async () => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken(true);
          setToken(token);
        } catch (error) {
          console.error("Error getting token", error);
        }
      } else {
        setToken(null);
      }
    };

    getToken();
  }, [firebaseUser]);

  const testEndpoint = async () => {
    try {
      const response = await api.setAuthHeader();
      const testResult = await fetch("/api/auth/test");
      const data = await testResult.json();
      setTestResponse(data);
    } catch (error) {
      setTestResponse({ error: String(error) });
    }
  };

  const verifyToken = async () => {
    try {
      api.setAuthHeader();
      const response = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setVerifyResponse(data);
    } catch (error) {
      setVerifyResponse({ error: String(error) });
    }
  };

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => setShowDebug(true)}
        >
          Debug Auth
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-md overflow-auto max-h-96">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Auth Debug</h3>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => setShowDebug(false)}
        >
          Close
        </Button>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <strong>Status:</strong> {isLoading ? "Loading..." : isAuthenticated ? "Authenticated" : "Not authenticated"}
        </div>
        
        <div>
          <strong>Firebase User:</strong> {firebaseUser ? "Yes" : "No"}
          {firebaseUser && (
            <div className="pl-4 mt-1">
              <div>UID: {firebaseUser.uid}</div>
              <div>Email: {firebaseUser.email}</div>
            </div>
          )}
        </div>
        
        <div>
          <strong>App User:</strong> {user ? "Yes" : "No"}
          {user && (
            <div className="pl-4 mt-1">
              <div>UID: {user.uid}</div>
              <div>Email: {user.email}</div>
              <div>Role: {user.role || "none"}</div>
            </div>
          )}
        </div>

        <div className="pt-2 flex space-x-2">
          <Button size="sm" onClick={testEndpoint}>
            Test API
          </Button>
          <Button size="sm" onClick={verifyToken}>
            Verify Token
          </Button>
        </div>

        {testResponse && (
          <div className="mt-2">
            <strong>Test Response:</strong>
            <pre className="text-xs p-2 bg-gray-100 dark:bg-gray-800 rounded mt-1 overflow-auto">
              {JSON.stringify(testResponse, null, 2)}
            </pre>
          </div>
        )}

        {verifyResponse && (
          <div className="mt-2">
            <strong>Verify Response:</strong>
            <pre className="text-xs p-2 bg-gray-100 dark:bg-gray-800 rounded mt-1 overflow-auto">
              {JSON.stringify(verifyResponse, null, 2)}
            </pre>
          </div>
        )}

        {token && (
          <div className="mt-2">
            <strong>Token:</strong>
            <pre className="text-xs p-2 bg-gray-100 dark:bg-gray-800 rounded mt-1 overflow-auto max-h-32">
              {token}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 