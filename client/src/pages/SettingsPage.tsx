import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useTheme } from "@/components/ThemeProvider";
import { useLocation } from "wouter";

export default function SettingsPage() {
  const { user, isLoading: userLoading } = useAuth();
  const { preferences, updatePreferences, isLoading: preferencesLoading } = useUserPreferences();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const [location] = useLocation();
  
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Check if there's a tab query parameter to set the active tab
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const tab = query.get("tab");
    if (tab && ["profile", "preferences", "security"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location]);
  
  // Handle dark mode toggle
  const handleDarkModeToggle = (checked: boolean) => {
    // Update user preferences
    updatePreferences({ darkMode: checked });
    
    // Update theme
    setTheme(checked ? "dark" : "light");
  };
  
  // Fetch user sessions
  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const response = await api.getUserSessions();
      setSessions(response.sessions || []);
      setLastLogin(response.lastLogin || null);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load session information",
        variant: "destructive",
      });
    } finally {
      setSessionsLoading(false);
    }
  };
  
  // Handle password change
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    setIsChangingPassword(true);
    try {
      await api.updateUserPassword(oldPassword, newPassword);
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  // Revoke a specific session
  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.revokeSession(sessionId);
      toast({
        title: "Success",
        description: "Session revoked successfully",
      });
      fetchSessions(); // Refresh sessions
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke session",
        variant: "destructive",
      });
    }
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    } else if (user?.firstName) {
      return user.firstName[0];
    } else if (user?.username) {
      return user.username[0].toUpperCase();
    }
    return "U";
  };
  
  const isLoading = userLoading || preferencesLoading;
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>Manage your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                      </div>
                    </div>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={user?.profileImageUrl || ""} alt="User avatar" />
                        <AvatarFallback className="bg-primary text-white text-lg">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-medium">
                          {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user?.username}
                        </h3>
                        <p className="text-sm text-muted-foreground">{user?.role}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" value={user?.email || ""} readOnly />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input id="username" value={user?.username || ""} readOnly />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Contact an administrator to update your profile information.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Account Preferences</CardTitle>
                <CardDescription>Customize your TaskSmart experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-3 w-[300px]" />
                        </div>
                        <Skeleton className="h-6 w-12 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notifications">Task Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about your tasks and due dates
                        </p>
                      </div>
                      <Switch
                        id="notifications"
                        checked={preferences.enableNotifications}
                        onCheckedChange={(checked) => 
                          updatePreferences({ enableNotifications: checked })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="ai-features">AI Enhancements</Label>
                        <p className="text-sm text-muted-foreground">
                          Use AI features for task categorization and prioritization
                        </p>
                      </div>
                      <Switch
                        id="ai-features"
                        checked={preferences.enableAIFeatures}
                        onCheckedChange={(checked) => 
                          updatePreferences({ enableAIFeatures: checked })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="dark-mode">Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Switch between light and dark theme
                        </p>
                      </div>
                      <Switch
                        id="dark-mode"
                        checked={preferences.darkMode}
                        onCheckedChange={handleDarkModeToggle}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" onSelect={fetchSessions}>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input 
                      id="current-password" 
                      type="password" 
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input 
                      id="new-password" 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input 
                      id="confirm-password" 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword || !oldPassword || !newPassword || !confirmPassword}
                  >
                    {isChangingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>Manage your login sessions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lastLogin && (
                    <div className="border-b pb-3">
                      <p className="text-sm font-medium">Last login</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(lastLogin).toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  {sessionsLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-md border">
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-3 w-[150px]" />
                          </div>
                          <Skeleton className="h-8 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : sessions.length > 0 ? (
                    <div className="space-y-3">
                      {sessions.map((session) => (
                        <div key={session.id} className="flex justify-between items-center p-3 rounded-md border">
                          <div>
                            <p className="text-sm font-medium">{session.device || "Unknown device"}</p>
                            <p className="text-xs text-muted-foreground">
                              {session.ip && `IP: ${session.ip}`} • 
                              {session.lastActive && ` Last active: ${new Date(session.lastActive).toLocaleString()}`}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRevokeSession(session.id)}
                          >
                            Log out
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No active sessions found.</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" onClick={fetchSessions} disabled={sessionsLoading}>
                    Refresh
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
} 