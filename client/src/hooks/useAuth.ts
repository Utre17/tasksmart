import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { User } from "@shared/schema";
import * as guestStorage from "@/lib/guestStorage";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// Create a partial user type that we can use for guest users
type GuestUser = Pick<User, 'id' | 'username' | 'role'> & Partial<User>;

// Helper to check if we're on the auth page
const isAuthPage = () => {
  return window.location.pathname === "/auth";
};

export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Check if user is authenticated or in guest mode
  const isRealAuthenticated = !!localStorage.getItem("token");
  const isGuest = guestStorage.isGuestMode();
  
  // Get current user - note that we don't run this on the auth page
  const userQuery = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: api.getCurrentUser,
    enabled: isRealAuthenticated && !isGuest && !isAuthPage(),
    retry: false,
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: api.login,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.firstName || data.user.username}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.response?.data?.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: api.register,
    onSuccess: async (data) => {
      // If registration returns a token, save it (some APIs may require separate login)
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      
      // If user was a guest, transfer tasks and clear guest mode
      if (isGuest) {
        await transferGuestTasks();
        guestStorage.clearGuestMode();
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${data.user.firstName || data.user.username}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.response?.data?.message || "Failed to register",
        variant: "destructive",
      });
    },
  });
  
  // Logout function
  const logout = async () => {
    if (isGuest) {
      // For guest users, simply clear guest storage
      guestStorage.clearGuestMode();
    } else {
      // For regular users, logout from the API
      await api.logout();
    }
    
    // Clear all queries but don't refetch immediately to prevent reload flashing
    queryClient.clear();
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  // Login as guest
  const loginAsGuest = () => {
    // Clear any authenticated state first
    localStorage.removeItem("token");
    
    const guestId = guestStorage.getGuestId();
    
    // Set the guest user data in React Query cache to prevent unnecessary API calls
    queryClient.setQueryData(["/api/tasks"], []);
    
    toast({
      title: "Guest mode activated",
      description: `You are now using TaskSmart as ${guestId}`,
    });
    
    return guestId;
  };

  // Transfer guest tasks to a new registered account
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
      
      // Refresh tasks list
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    } catch (error) {
      toast({
        title: "Transfer failed",
        description: "Could not transfer tasks to your account. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Check if user has admin role
  const isAdmin = userQuery.data?.role === "admin";
  
  // Check if a user has a specific role
  const hasRole = (role: string) => userQuery.data?.role === role;

  // Get a mock guest user for display purposes
  const getGuestUser = (): GuestUser | undefined => {
    if (!isGuest) return undefined;
    
    const now = new Date();
    
    return {
      id: "guest",
      email: "guest@tasksmart.com",
      username: guestStorage.getGuestId(),
      role: "guest",
      firstName: null,
      lastName: null,
      profileImageUrl: null,
      preferences: {},
      lastLogin: null,
      password: "",
      createdAt: now,
      updatedAt: now
    };
  };
  
  return {
    user: isGuest ? getGuestUser() : userQuery.data,
    isLoading: !isGuest && userQuery.isLoading && !isAuthPage(),
    isAuthenticated: isRealAuthenticated || isGuest, // For protected routes
    isRealAuthenticated, // New flag: true only for actual token-based auth
    isGuest,
    isAdmin,
    hasRole,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout,
    loginAsGuest,
    transferGuestTasks,
  };
}