import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useLocation } from "wouter";

export function GuestBanner() {
  const { isGuest, user } = useAuth();
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(false);
  
  // Check for previously dismissed state
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem("guest_banner_dismissed");
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);
  
  if (!isGuest || dismissed) return null;
  
  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("guest_banner_dismissed", "true");
  };
  
  const goToRegister = () => {
    // Use React Router for smoother navigation and to prevent fetch on auth page
    navigate("/auth?mode=register");
  };
  
  return (
    <Alert className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 relative">
      <AlertTitle className="text-blue-800 dark:text-blue-300 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        You are using TaskSmart in Guest Mode
      </AlertTitle>
      <AlertDescription className="mt-2 text-blue-700 dark:text-blue-400">
        <p>Your tasks are saved locally and will be lost if you clear your browser data. <strong>{user?.username}</strong></p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="bg-white dark:bg-blue-900/30" onClick={goToRegister}>
            Save Your Tasks
          </Button>
        </div>
      </AlertDescription>
      <Button 
        size="icon" 
        variant="ghost" 
        className="absolute top-2 right-2 h-6 w-6 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </Button>
    </Alert>
  );
}

export function GuestConversionBanner() {
  const { isGuest } = useAuth();
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(false);
  
  // Check if this banner has been dismissed before in this session
  const localStorageKey = "guest_conversion_banner_dismissed";
  
  // On component mount, check if the banner was previously dismissed
  useEffect(() => {
    const wasDismissed = localStorage.getItem(localStorageKey);
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);
  
  // If not in guest mode or already dismissed, don't show the banner
  if (!isGuest || dismissed) return null;
  
  // Handle permanent dismissal
  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(localStorageKey, "true");
  };

  const goToRegister = () => {
    // Use React Router for smoother navigation and to prevent fetch on auth page
    navigate("/auth?mode=register");
  };
  
  return (
    <div className="fixed bottom-4 right-4 w-[calc(100%-2rem)] max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
          </svg>
          <h3 className="font-medium text-gray-900 dark:text-gray-100">Enjoying TaskSmart?</h3>
        </div>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-6 w-6 rounded-full" 
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
        Create an account to save your tasks permanently and access all features.
      </p>
      <div className="mt-3 flex justify-end space-x-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleDismiss}
        >
          Maybe later
        </Button>
        <Button 
          size="sm"
          onClick={goToRegister}
        >
          Sign up now
        </Button>
      </div>
    </div>
  );
} 