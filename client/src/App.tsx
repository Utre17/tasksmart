import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import AuthPage from "@/pages/AuthPage";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/not-found";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AnalyticsPage from "@/pages/AnalyticsPage";
import SettingsPage from "@/pages/SettingsPage";
import ProfilePage from "@/pages/ProfilePage";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthDebug } from "@/components/AuthDebug";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <ProtectedRoute allowGuest={true}>
          <Home />
        </ProtectedRoute>
      )} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/admin" component={() => (
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      )} />
      <Route path="/analytics" component={() => (
        <ProtectedRoute allowGuest={false}>
          <AnalyticsPage />
        </ProtectedRoute>
      )} />
      <Route path="/settings" component={() => (
        <ProtectedRoute allowGuest={false}>
          <SettingsPage />
        </ProtectedRoute>
      )} />
      <Route path="/profile" component={() => (
        <ProtectedRoute allowGuest={false}>
          <ProfilePage />
        </ProtectedRoute>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <AuthDebug />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
