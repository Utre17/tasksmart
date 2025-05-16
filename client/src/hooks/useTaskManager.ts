import { useTasks } from "@/hooks/useTasks";
import { useGuestTasks } from "@/hooks/useGuestTasks";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useTaskManager() {
  const { isGuest, isRealAuthenticated } = useAuth();
  const regularTasks = useTasks();
  const guestTasks = useGuestTasks();
  const queryClient = useQueryClient();

  // When switching from guest to authenticated user, clear old cache
  useEffect(() => {
    if (isRealAuthenticated && !isGuest) {
      // Invalidate tasks query to fetch from server
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    }
  }, [isRealAuthenticated, isGuest, queryClient]);

  // Return the appropriate task manager based on user's auth state
  return isGuest ? guestTasks : regularTasks;
} 