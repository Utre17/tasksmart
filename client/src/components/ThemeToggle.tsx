import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light");
  const { isGuest } = useAuth();
  
  // Safely access theme context
  let themeContext;
  try {
    themeContext = useTheme();
  } catch (error) {
    // If theme context isn't available yet, use system preference as fallback
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    themeContext = { 
      theme: prefersDark ? "dark" : "light", 
      setTheme: () => {} 
    };
  }
  
  const { theme, setTheme } = themeContext;
  
  // Get preferences safely (may fail during initial mount)
  let updatePreferences;
  try {
    const { updatePreferences: update } = useUserPreferences();
    updatePreferences = update;
  } catch (error) {
    updatePreferences = () => {};
  }

  // Update local state when theme changes
  useEffect(() => {
    if (theme) {
      setCurrentTheme(theme);
    }
  }, [theme]);

  // Only show the toggle after hydration to avoid SSR mismatch
  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
    setTheme(newTheme);
    
    if (updatePreferences) {
      // This will now handle both guest and logged-in users without API calls for guests
      updatePreferences({ darkMode: newTheme === "dark" });
    }
  };

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="opacity-0" />;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full bg-background border-muted-foreground/20"
      aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} theme`}
    >
      <Sun className={`h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 ${currentTheme === 'dark' ? 'opacity-0' : 'opacity-100'}`} />
      <Moon className={`absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 ${currentTheme === 'dark' ? 'opacity-100' : 'opacity-0'}`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
} 