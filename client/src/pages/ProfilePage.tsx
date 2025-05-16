import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
          <p className="text-muted-foreground">View and manage your account information</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main profile card */}
          <div className="md:col-span-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your personal information and account details</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-20 w-20 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                      </div>
                    </div>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={user?.profileImageUrl || ""} alt="User avatar" />
                        <AvatarFallback className="bg-primary text-white text-3xl">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2 text-center sm:text-left">
                        <h3 className="text-xl font-medium">
                          {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user?.username}
                        </h3>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                        <p className="text-sm">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            user?.role === "admin" 
                              ? "bg-purple-100 text-purple-700 ring-1 ring-inset ring-purple-700/10 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-500/20" 
                              : "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-500/20"
                          }`}>
                            {user?.role === "admin" ? "Administrator" : "User"}
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t">
                      <h4 className="text-sm font-medium mb-4">Account Details</h4>
                      <dl className="divide-y divide-gray-100 dark:divide-gray-700">
                        <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                          <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Username</dt>
                          <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-400 sm:col-span-2 sm:mt-0">{user?.username}</dd>
                        </div>
                        <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                          <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Email address</dt>
                          <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-400 sm:col-span-2 sm:mt-0">{user?.email}</dd>
                        </div>
                        <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                          <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Role</dt>
                          <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-400 sm:col-span-2 sm:mt-0">{user?.role}</dd>
                        </div>
                        <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                          <dt className="text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Member since</dt>
                          <dd className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-400 sm:col-span-2 sm:mt-0">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Actions sidebar */}
          <div>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full justify-start dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800" 
                  variant="outline"
                  onClick={() => window.location.href = "/settings?tab=preferences"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  Preferences
                </Button>
                <Button 
                  className="w-full justify-start dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800" 
                  variant="outline"
                  onClick={() => window.location.href = "/settings?tab=security"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  Security Settings
                </Button>
                <Button 
                  className="w-full justify-start dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800" 
                  variant="outline"
                  onClick={() => window.location.href = "/analytics"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18"></path>
                    <path d="m19 9-5 5-4-4-3 3"></path>
                  </svg>
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
} 