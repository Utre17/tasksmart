import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";
import api from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminDashboard() {
  const { isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  // Fetch admin stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: api.getAdminStats,
    enabled: isAuthenticated && isAdmin,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch all users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/auth/users"],
    queryFn: api.getAllUsers,
    enabled: isAuthenticated && isAdmin,
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => 
      api.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/users"] });
      toast({
        title: "Role updated",
        description: "User role was updated successfully",
      });
      setUserDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update role",
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // If not authenticated or not admin, redirect to home
  if (!isAuthenticated) {
    return <Redirect to="/auth" />;
  }

  if (!isAdmin) {
    return <Redirect to="/" />;
  }

  const handleUpdateRole = () => {
    if (selectedUser && selectedRole) {
      updateRoleMutation.mutate({
        userId: selectedUser.id,
        role: selectedRole,
      });
    }
  };

  const openUserDialog = (user: any) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setUserDialogOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-2">System overview and user management</p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Users</CardTitle>
                <CardDescription>Total registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {isLoadingStats ? "..." : stats?.userCount}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Tasks</CardTitle>
                <CardDescription>Total created tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {isLoadingStats ? "..." : stats?.taskCount}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Completed</CardTitle>
                <CardDescription>Completed tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {isLoadingStats ? "..." : stats?.completedTasks}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Completion Rate</CardTitle>
                <CardDescription>Overall rate</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {isLoadingStats ? "..." : `${stats?.completionRate}%`}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Task Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Tasks by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="h-40 flex items-center justify-center">
                    <p>Loading...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats && Object.entries(stats.tasksByCategory).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 bg-${category.toLowerCase()}`}></div>
                          <span>{category}</span>
                        </div>
                        <span className="font-medium">{count as number}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tasks by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="h-40 flex items-center justify-center">
                    <p>Loading...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats && Object.entries(stats.tasksByPriority).map(([priority, count]) => (
                      <div key={priority} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`priority-indicator bg-${priority === "High" ? "red" : priority === "Medium" ? "yellow" : "blue"}-500`}></div>
                          <span>{priority}</span>
                        </div>
                        <span className="font-medium">{count as number}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* User Management */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user roles and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="h-40 flex items-center justify-center">
                    <p>Loading users...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left pb-2">User</th>
                          <th className="text-left pb-2">Email</th>
                          <th className="text-left pb-2">Role</th>
                          <th className="text-left pb-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users?.map((user) => (
                          <tr key={user.id} className="border-b">
                            <td className="py-3">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mr-2">
                                  {user.firstName ? user.firstName[0] : user.username[0]}
                                </div>
                                <div>
                                  <div className="font-medium">{user.firstName || user.username}</div>
                                  <div className="text-sm text-gray-500">ID: {user.id.substring(0, 8)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">{user.email}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                user.role === "admin" 
                                  ? "bg-red-100 text-red-800" 
                                  : "bg-blue-100 text-blue-800"
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="py-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openUserDialog(user)}
                              >
                                Edit Role
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Edit User Role Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Update role for user {selectedUser?.firstName || selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Roles</SelectLabel>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateRole}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
} 