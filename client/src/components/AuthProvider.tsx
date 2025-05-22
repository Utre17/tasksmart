import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  UserCredential,
  User as FirebaseUser,
  browserPopupRedirectResolver,
  browserLocalPersistence,
  setPersistence
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import * as guestStorage from "@/lib/guestStorage";
import { User } from "@shared/schema";

// Define the Auth Context type
interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  hasRole: (role: string) => boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  loginWithGoogle: () => Promise<UserCredential>;
  loginWithGoogleRedirect: () => Promise<void>;
  register: (email: string, password: string, username: string, firstName?: string, lastName?: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginAsGuest: () => string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  
  const isGuest = guestStorage.isGuestMode();
  
  // Near the top of the file, add a state variable to track popup failures
  const [popupFailed, setPopupFailed] = useState<boolean>(false);
  
  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        try {
          // Get the Firebase ID token
          const token = await user.getIdToken(true); // Force refresh token
          
          // Save token to localStorage for API requests
          localStorage.setItem("token", token);
          setAuthHeader(); // Make sure axios headers are updated
          
          try {
            // Explicitly login with the backend first
            await api.loginWithToken(token);
            
            // Then fetch user profile details
            const userData = await api.getCurrentUser();
            setUser(userData);
          } catch (error) {
            console.error("Error fetching user data:", error);
            // If backend verification fails but we still have a Firebase user,
            // we should at least try to work with what we have
            setUser({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              role: 'user', // Default role
            } as any);
          }
        } catch (error) {
          console.error("Error getting Firebase token:", error);
          localStorage.removeItem("token");
          setUser(null);
        }
      } else {
        // Clear token if not authenticated
        localStorage.removeItem("token");
        setUser(null);
      }
      
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Helper function to set auth headers in axios
  const setAuthHeader = () => {
    const token = localStorage.getItem("token");
    if (token) {
      api.setAuthHeader?.(); // Call the setAuthHeader function from the api module if it exists
    }
  };
  
  // Login with email/password
  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      return result;
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  // Check for redirect result on initial load
  useEffect(() => {
    async function checkRedirectResult() {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User successfully authenticated with redirect
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const token = credential?.idToken;
          
          // Store email for future login hints
          if (result.user?.email) {
            localStorage.setItem('lastLoginEmail', result.user.email);
          }
          
          // If we have a token, verify it with our backend
          if (token) {
            try {
              await api.loginWithToken(token);
              toast({
                title: "Login successful",
                description: "Welcome via Google!",
              });
            } catch (backendError) {
              console.error("Backend verification failed after redirect:", backendError);
            }
          }
        }
      } catch (error) {
        console.error("Error processing redirect result:", error);
      }
    }
    
    checkRedirectResult();
  }, []);
  
  // Function to check if the browser is likely to have popup issues
  const browserMayBlockPopups = () => {
    // Check if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Check if we've had popup issues before in this session
    const hadPopupIssues = localStorage.getItem('hadPopupIssues') === 'true';
    
    // Check if we're in an iframe
    const isInIframe = window !== window.top;
    
    return isMobile || hadPopupIssues || isInIframe || popupFailed;
  };
  
  // Login with Google using popup
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    
    // Add scopes for additional permissions if needed
    provider.addScope('profile');
    provider.addScope('email');
    
    // Set custom parameters for the auth provider
    provider.setCustomParameters({
      prompt: 'select_account',
      // Add additional parameters that can help with popup issues
      login_hint: localStorage.getItem('lastLoginEmail') || undefined
    });
    
    // If we think popups will be blocked, go straight to redirect method
    if (browserMayBlockPopups()) {
      console.log("Popup may be blocked, using redirect method directly");
      return loginWithGoogleRedirect();
    }
    
    try {
      // Set persistence to LOCAL to persist the user session
      await setPersistence(auth, browserLocalPersistence);
      
      // Use the explicit resolver to help with popup issues
      const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      
      // Get credentials from result
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.idToken;
      
      // Store email for future login hints
      if (result.user?.email) {
        localStorage.setItem('lastLoginEmail', result.user.email);
      }
      
      // If we have a token, verify it with our backend
      if (token) {
        try {
          // Verify token with backend
          await api.loginWithToken(token);
        } catch (backendError) {
          console.error("Backend verification failed:", backendError);
          // Continue anyway since Firebase auth succeeded
        }
      }
      
      toast({
        title: "Login successful",
        description: "Welcome via Google!",
      });
      
      // Reset popup failure flag since it worked
      localStorage.removeItem('hadPopupIssues');
      setPopupFailed(false);
      
      return result;
    } catch (error: any) {
      // Remember that we've had popup issues
      if (error.code?.includes('popup')) {
        localStorage.setItem('hadPopupIssues', 'true');
        setPopupFailed(true);
        
        // Automatically use redirect instead
        console.log("Popup failed, automatically falling back to redirect method");
        return loginWithGoogleRedirect();
      }
      
      // Handle other specific Firebase Auth errors
      if (error.code === 'auth/popup-closed-by-user') {
        toast({
          title: "Google login cancelled",
          description: "You closed the login window. Trying redirect method instead.",
          variant: "default",
        });
        
        // Automatically try redirect method
        return loginWithGoogleRedirect();
      } else if (error.code === 'auth/popup-blocked') {
        toast({
          title: "Popup blocked",
          description: "Trying redirect method instead.",
          variant: "destructive",
        });
        
        // Suggest enabling popups
        console.warn("Google login popup was blocked. Using redirect method instead.");
        return loginWithGoogleRedirect();
      } else if (error.code === 'auth/cancelled-popup-request') {
        // This is normal when multiple popups are attempted, so just log it
        console.log("Multiple popup requests detected and handled");
        return loginWithGoogleRedirect();
      } else if (error.code === 'auth/network-request-failed') {
        toast({
          title: "Network error",
          description: "Check your internet connection and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Google login failed",
          description: error.message || "Could not sign in with Google",
          variant: "destructive",
        });
      }
      
      console.error("Google auth error:", error.code, error.message);
      throw error;
    }
  };
  
  // Login with Google using redirect (more reliable but less immediate feedback)
  const loginWithGoogleRedirect = async () => {
    try {
      const provider = new GoogleAuthProvider();
      
      // Add scopes for additional permissions if needed
      provider.addScope('profile');
      provider.addScope('email');
      
      // Set custom parameters
      provider.setCustomParameters({
        prompt: 'select_account',
        login_hint: localStorage.getItem('lastLoginEmail') || undefined
      });
      
      // Set persistence to LOCAL to persist the user session
      await setPersistence(auth, browserLocalPersistence);
      
      // Use redirect method (more reliable in problematic browsers/environments)
      await signInWithRedirect(auth, provider);
      
      // The result will be handled in the useEffect hook that checks for redirect results
      return Promise.resolve() as any;
    } catch (error: any) {
      console.error("Error initiating Google redirect auth:", error);
      
      toast({
        title: "Google login failed",
        description: "Could not initiate Google login. Please try again later.",
        variant: "destructive",
      });
      
      throw error;
    }
  };
  
  // Register new user
  const register = async (email: string, password: string, username: string, firstName?: string, lastName?: string) => {
    try {
      // Create user in Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in our backend
      await api.register({
        email,
        username,
        password, // This will be hashed on the server
        firstName,
        lastName,
      });
      
      // If user was a guest, transfer tasks
      if (isGuest) {
        await transferGuestTasks();
        guestStorage.clearGuestMode();
      }
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${firstName || username}!`,
      });
      
      return result;
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to register",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  // Transfer guest tasks to authenticated user
  const transferGuestTasks = async () => {
    if (!isGuest) return;
    
    try {
      const guestTasks = guestStorage.getGuestTasksForTransfer();
      
      // Skip if no tasks to transfer
      if (guestTasks.length === 0) return;
      
      // Create all guest tasks for the new user account
      for (const task of guestTasks) {
        await api.createTask(task);
      }
      
      // Clear guest storage after successful transfer
      guestStorage.clearGuestMode();
      
      toast({
        title: "Tasks transferred",
        description: `${guestTasks.length} tasks have been saved to your account`,
      });
    } catch (error) {
      toast({
        title: "Transfer failed",
        description: "Could not transfer tasks to your account. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Logout
  const logout = async () => {
    if (isGuest) {
      // For guest users, simply clear guest storage
      guestStorage.clearGuestMode();
    } else {
      // Logout from Firebase
      await signOut(auth);
      
      // Clear token and notify backend about logout
      localStorage.removeItem("token");
      try {
        await api.logout();
      } catch (error) {
        console.error("Error during server logout:", error);
      }
    }
    
    setUser(null);
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };
  
  // Reset password
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for a link to reset your password",
      });
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message || "Could not send password reset email",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  // Login as guest
  const loginAsGuest = () => {
    // Clear any authenticated state first
    localStorage.removeItem("token");
    
    const guestId = guestStorage.getGuestId();
    
    toast({
      title: "Guest mode activated",
      description: `You are now using TaskSmart as ${guestId}`,
    });
    
    return guestId;
  };
  
  // Check if user has admin role
  const isAdmin = user?.role === "admin";
  
  // Check if a user has a specific role
  const hasRole = (role: string) => user?.role === role;
  
  // Calculate if user is authenticated
  const isAuthenticated = !!firebaseUser || isGuest;
  
  return (
    <AuthContext.Provider 
      value={{
        user,
        firebaseUser,
        isLoading,
        isAuthenticated,
        isGuest,
        isAdmin,
        hasRole,
        login,
        loginWithGoogle,
        loginWithGoogleRedirect,
        register,
        logout,
        resetPassword,
        loginAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}; 