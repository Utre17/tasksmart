import { createContext, useContext, useEffect, useState } from "react";
import { useUserPreferences } from "@/hooks/useUserPreferences";

type Theme = "light" | "dark";

interface ThemeProviderProps {
  children: React.ReactNode;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Create context with a default value to avoid undefined errors
const defaultTheme: ThemeContextType = {
  theme: "light",
  setTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultTheme);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>("light");
  const [initialized, setInitialized] = useState(false);
  
  // Safely access user preferences
  let preferencesData = { 
    preferences: undefined, 
    isLoading: true, 
    updatePreferences: undefined 
  };
  
  try {
    preferencesData = useUserPreferences();
  } catch (error) {
    console.warn("Failed to load user preferences:", error);
  }
  
  const { preferences, isLoading, updatePreferences } = preferencesData;

  // Initialize with system preference or stored preference
  useEffect(() => {
    try {
      // Check for system preference
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      
      // Set initial theme based on system preference if no stored preference
      if (isLoading) {
        setTheme(systemPrefersDark ? "dark" : "light");
      }
      
      setInitialized(true);
    } catch (error) {
      console.warn("Failed to set initial theme:", error);
      // Fallback to light theme
      setTheme("light");
      setInitialized(true);
    }
  }, []);

  // Apply theme from user preferences when they load
  useEffect(() => {
    if (!isLoading && preferences) {
      try {
        const prefersDark = preferences.darkMode;
        setTheme(prefersDark ? "dark" : "light");
      } catch (error) {
        console.warn("Failed to apply theme from preferences:", error);
      }
    }
  }, [preferences, isLoading]);

  // Apply theme to document
  useEffect(() => {
    try {
      const root = window.document.documentElement;
      
      // Remove previous theme
      root.classList.remove("light", "dark");
      
      // Add current theme
      root.classList.add(theme);
  
      // Set data-theme attribute for components that rely on it
      root.setAttribute("data-theme", theme);
  
      // Ensure the body also has the theme class for maximum compatibility
      document.body.className = theme === "dark" ? "dark bg-gray-900 text-gray-100" : "light bg-white text-gray-900";
    } catch (error) {
      console.warn("Failed to apply theme to document:", error);
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    try {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      
      const handleChange = (e: MediaQueryListEvent) => {
        // Only change if user hasn't explicitly set a preference
        if (!preferences || preferences.darkMode === undefined) {
          setTheme(e.matches ? "dark" : "light");
        }
      };
      
      mediaQuery.addEventListener("change", handleChange);
      
      return () => mediaQuery.removeEventListener("change", handleChange);
    } catch (error) {
      console.warn("Failed to set up system theme listener:", error);
      return () => {};
    }
  }, [preferences]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme);
      // Ensure preferences are updated when theme is changed
      if (!isLoading && updatePreferences) {
        try {
          updatePreferences({ darkMode: newTheme === "dark" });
        } catch (error) {
          console.warn("Failed to update theme preferences:", error);
        }
      }
    },
  };

  // Only render children after initialization to prevent flicker
  if (!initialized) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    console.warn("useTheme must be used within a ThemeProvider, using default theme");
    return defaultTheme;
  }
  
  return context;
}; 