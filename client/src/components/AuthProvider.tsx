import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  UserCredential,
  User as FirebaseUser
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
  
  // Login with Google
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Check if this is a new user and create profile in our backend if needed
      // This could be handled by a Cloud Function in Firebase or here
      
      toast({
        title: "Login successful",
        description: "Welcome via Google!",
      });
      
      return result;
    } catch (error: any) {
      toast({
        title: "Google login failed",
        description: error.message || "Could not sign in with Google",
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