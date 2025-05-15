import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { User } from "@shared/schema";

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

export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Check if user is authenticated
  const isAuthenticated = !!localStorage.getItem("token");
  
  // Get current user
  const userQuery = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: api.getCurrentUser,
    enabled: isAuthenticated,
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
    onSuccess: (data) => {
      // If registration returns a token, save it (some APIs may require separate login)
      if (data.token) {
        localStorage.setItem("token", data.token);
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
  const logout = () => {
    api.logout();
    queryClient.invalidateQueries();
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };
  
  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    isAuthenticated,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout,
  };
}