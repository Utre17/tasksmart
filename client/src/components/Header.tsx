import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Header() {
  const { user, isAuthenticated, logout, isAdmin, isGuest } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [isReady, setIsReady] = useState(false);

  // Wait for the component to mount before rendering user-specific content
  useEffect(() => {
    setIsReady(true);
  }, []);

  const handleLogout = () => {
    logout();
    setLocation("/auth");
  };

  const getUserInitials = () => {
    if (!user) return "U";
    
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    } else if (user.firstName) {
      return user.firstName[0];
    } else if (user.username) {
      return user.username[0].toUpperCase();
    }
    return "U";
  };

  // Function to navigate to register page
  const navigateToRegister = (e: React.MouseEvent) => {
    e.preventDefault();
    // Use React Router for smoother navigation
    setLocation("/auth?mode=register");
  };

  // If component isn't ready yet, show minimal header
  if (!isReady) {
    return (
      <header className="bg-gradient-to-r from-blue-50 via-white to-blue-50 shadow-sm sticky top-0 z-50 dark:bg-gradient-to-r dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex">
              <span className="text-xl font-bold text-primary">TaskSmart</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-gradient-to-r from-blue-50 via-white to-blue-50 shadow-sm sticky top-0 z-50 dark:bg-gradient-to-r dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:justify-start md:space-x-10">
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <Link href="/" className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary text-2xl mr-2 w-6 h-6">
                <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span className="text-xl font-bold text-primary">TaskSmart</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-10">
            {isAuthenticated ? (
              <>
                <Link href="/" className="text-base font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary">
                  Dashboard
                </Link>
                {!isGuest && (
                  <Link href="/analytics" className="text-base font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary">
                    Analytics
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin" className="text-base font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary">
                    Admin
                  </Link>
                )}
                {!isGuest && (
                  <Link href="/settings" className="text-base font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary">
                    Settings
                  </Link>
                )}
              </>
            ) : null}
          </nav>
          
          <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0 space-x-2">
            {/* Theme toggle */}
            <ThemeToggle />
            
            {isAuthenticated ? (
              <>
                {/* User dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar>
                        <AvatarImage src={user?.profileImageUrl || ""} alt="User avatar" />
                        <AvatarFallback className="bg-primary text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {user?.firstName && user?.lastName && (
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                        )}
                        {user?.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    {!isGuest && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/profile" className="cursor-pointer w-full">Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/settings" className="cursor-pointer w-full">Settings</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {isGuest && (
                      <DropdownMenuItem>
                        <a href="/auth?mode=register" onClick={navigateToRegister} className="cursor-pointer w-full text-primary font-semibold">
                          Create Account
                        </a>
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer w-full">Admin Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      {isGuest ? "Exit Guest Mode" : "Log out"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="outline" className="mr-2" onClick={() => setLocation("/auth")}>
                  Log in
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button and theme toggle */}
          <div className="flex items-center md:hidden space-x-2">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <line x1="4" x2="20" y1="12" y2="12" />
                    <line x1="4" x2="20" y1="6" y2="6" />
                    <line x1="4" x2="20" y1="18" y2="18" />
                  </svg>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[300px]">
                <div className="py-4 flex flex-col h-full">
                  <div className="px-2 mb-6 flex items-center">
                    <Avatar className="mr-2">
                      <AvatarImage src={user?.profileImageUrl || ""} alt="User avatar" />
                      <AvatarFallback className="bg-primary text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      {user?.firstName && user?.lastName && (
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                      )}
                      {user?.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col space-y-1">
                    {isAuthenticated ? (
                      <>
                        <Link href="/" className="px-2 py-3 text-base font-medium rounded-md text-foreground hover:bg-muted">
                          Dashboard
                        </Link>
                        {!isGuest && (
                          <Link href="/analytics" className="px-2 py-3 text-base font-medium rounded-md text-foreground hover:bg-muted">
                            Analytics
                          </Link>
                        )}
                        {isAdmin && (
                          <Link href="/admin" className="px-2 py-3 text-base font-medium rounded-md text-foreground hover:bg-muted">
                            Admin Dashboard
                          </Link>
                        )}
                        {!isGuest && (
                          <>
                            <Link href="/settings" className="px-2 py-3 text-base font-medium rounded-md text-foreground hover:bg-muted">
                              Settings
                            </Link>
                            <Link href="/profile" className="px-2 py-3 text-base font-medium rounded-md text-foreground hover:bg-muted">
                              Profile
                            </Link>
                          </>
                        )}
                        {isGuest && (
                          <a 
                            href="/auth?mode=register" 
                            onClick={navigateToRegister} 
                            className="px-2 py-3 text-base font-medium rounded-md text-primary hover:bg-muted"
                          >
                            Create Account
                          </a>
                        )}
                        <div className="px-2 py-3 text-base font-medium rounded-md text-foreground hover:bg-muted flex items-center">
                          <span className="mr-2">Toggle theme</span>
                          <ThemeToggle />
                        </div>
                      </>
                    ) : null}
                  </div>
                  
                  {isAuthenticated ? (
                    <div className="pt-4 border-t">
                      <Button 
                        onClick={handleLogout}
                        variant="destructive"
                        className="w-full"
                      >
                        {isGuest ? "Exit Guest Mode" : "Log out"}
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-4">
                      <Button 
                        onClick={() => setLocation("/auth")}
                        className="w-full"
                      >
                        Log in
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
