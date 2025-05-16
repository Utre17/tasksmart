import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Task, InsertTask } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import * as guestStorage from "@/lib/guestStorage";

export function useTasks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Check if user is authenticated and not in guest mode
  const isAuthenticated = !!localStorage.getItem("token");
  const isGuest = guestStorage.isGuestMode();
  const shouldFetchFromApi = isAuthenticated && !isGuest;

  const tasksQuery = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    staleTime: 60000, // 1 minute
    enabled: shouldFetchFromApi, // Only fetch from API if authenticated and not in guest mode
  });

  const processTaskMutation = useMutation({
    mutationFn: async (input: string) => {
      try {
        return await api.processTask(input);
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "There was a problem processing your task";
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task added",
        description: "Your task was processed and added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding task",
        description: error.message || "There was a problem processing your task",
        variant: "destructive",
      });
      console.error("Error processing task:", error);
      throw error; // Re-throw to propagate to component
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (task: Partial<InsertTask>) => api.createTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task created",
        description: "Your task was created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating task",
        description: "There was a problem creating your task",
        variant: "destructive",
      });
      console.error("Error creating task:", error);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, task }: { id: number; task: Partial<InsertTask> }) => 
      api.updateTask(id, task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task updated",
        description: "Your task was updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating task",
        description: "There was a problem updating your task",
        variant: "destructive",
      });
      console.error("Error updating task:", error);
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) => 
      api.completeTask(id, completed),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: variables.completed ? "Task completed" : "Task reopened",
        description: `Task has been marked as ${variables.completed ? "completed" : "not completed"}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating task",
        description: "There was a problem updating your task status",
        variant: "destructive",
      });
      console.error("Error completing task:", error);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => api.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task deleted",
        description: "Your task was deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting task",
        description: "There was a problem deleting your task",
        variant: "destructive",
      });
      console.error("Error deleting task:", error);
    },
  });

  const clearCompletedTasksMutation = useMutation({
    mutationFn: () => api.clearCompletedTasks(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tasks cleared",
        description: `Successfully cleared ${data.count} completed tasks`,
        variant: data.count > 0 ? "default" : "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error clearing tasks",
        description: "There was a problem clearing your completed tasks",
        variant: "destructive",
      });
      console.error("Error clearing completed tasks:", error);
    },
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    processTask: processTaskMutation.mutateAsync,
    isProcessing: processTaskMutation.isPending,
    processError: processTaskMutation.error,
    createTask: createTaskMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
    updateTask: updateTaskMutation.mutateAsync,
    isUpdating: updateTaskMutation.isPending,
    completeTask: completeTaskMutation.mutateAsync,
    isCompleting: completeTaskMutation.isPending,
    deleteTask: deleteTaskMutation.mutateAsync,
    isDeleting: deleteTaskMutation.isPending,
    clearCompletedTasks: clearCompletedTasksMutation.mutateAsync,
    isClearing: clearCompletedTasksMutation.isPending,
  };
}
