import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import * as guestStorage from "@/lib/guestStorage";

interface UserPreferences {
  enableNotifications: boolean;
  enableAIFeatures: boolean;
  darkMode: boolean;
}

const defaultPreferences: UserPreferences = {
  enableNotifications: true,
  enableAIFeatures: true,
  darkMode: false,
};

// Save guest preferences to localStorage
const saveGuestPreferences = (preferences: Partial<UserPreferences>) => {
  const currentPrefs = getGuestPreferences();
  const updatedPrefs = { ...currentPrefs, ...preferences };
  localStorage.setItem('guest_preferences', JSON.stringify(updatedPrefs));
  return updatedPrefs;
};

// Get guest preferences from localStorage
const getGuestPreferences = (): UserPreferences => {
  const prefsJson = localStorage.getItem('guest_preferences');
  if (!prefsJson) return defaultPreferences;
  
  try {
    return { ...defaultPreferences, ...JSON.parse(prefsJson) };
  } catch (e) {
    return defaultPreferences;
  }
};

export function useUserPreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isGuest = guestStorage.isGuestMode();

  // For guest users, use localStorage instead of API calls
  const preferencesQuery = useQuery<UserPreferences>({
    queryKey: ["/api/auth/preferences"],
    queryFn: async () => {
      // For guest users, get preferences from localStorage
      if (isGuest) {
        return getGuestPreferences();
      }
      
      // For authenticated users, get from API
      try {
        const user = await api.getCurrentUser();
        return {
          ...defaultPreferences,
          ...user.preferences,
        };
      } catch (error) {
        console.error("Error fetching user preferences:", error);
        return defaultPreferences;
      }
    },
    staleTime: 300000, // 5 minutes
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<UserPreferences>) => {
      // For guest users, save to localStorage
      if (isGuest) {
        return saveGuestPreferences(newPreferences);
      }
      
      // For authenticated users, save to API
      return api.updateUserPreferences(newPreferences);
    },
    onSuccess: () => {
      // Only invalidate queries for authenticated users
      if (!isGuest) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/preferences"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      } else {
        // For guests, manually update the cache
        const updatedPrefs = getGuestPreferences();
        queryClient.setQueryData(["/api/auth/preferences"], updatedPrefs);
      }
      
      toast({
        title: "Preferences updated",
        description: "Your preferences have been saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating preferences",
        description: error.response?.data?.message || "Failed to update preferences",
        variant: "destructive",
      });
    },
  });

  return {
    preferences: preferencesQuery.data || defaultPreferences,
    isLoading: preferencesQuery.isLoading,
    updatePreferences: updatePreferencesMutation.mutate,
    isUpdating: updatePreferencesMutation.isPending,
  };
} 