import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface AuthResponse {
  user: User;
  token: string;
}

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
  
  // Store and retrieve the JWT token
  const getToken = () => localStorage.getItem("token");
  const setToken = (token: string) => localStorage.setItem("token", token);
  const removeToken = () => localStorage.removeItem("token");
  
  // Check if user is authenticated
  const isAuthenticated = !!getToken();
  
  // Configure axios with auth header
  const configureAxios = () => {
    const token = getToken();
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  };
  
  // Configure on hook initialization
  configureAxios();
  
  // Get current user
  const userQuery = useQuery<User>({
    queryKey: ["/api/auth/me"],
    enabled: isAuthenticated,
    retry: false,
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await axios.post<AuthResponse>("/api/auth/login", credentials);
      return response.data;
    },
    onSuccess: (data) => {
      setToken(data.token);
      configureAxios();
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
    mutationFn: async (data: RegisterData) => {
      const response = await axios.post<AuthResponse>("/api/auth/register", data);
      return response.data;
    },
    onSuccess: (data) => {
      setToken(data.token);
      configureAxios();
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
    removeToken();
    configureAxios();
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