import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Task, InsertTask } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useTasks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const tasksQuery = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    staleTime: 60000, // 1 minute
  });

  const processTaskMutation = useMutation({
    mutationFn: (input: string) => api.processTask(input),
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
        description: "There was a problem processing your task",
        variant: "destructive",
      });
      console.error("Error processing task:", error);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
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

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    processTask: processTaskMutation.mutate,
    isProcessing: processTaskMutation.isPending,
    createTask: createTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
    updateTask: updateTaskMutation.mutate,
    isUpdating: updateTaskMutation.isPending,
    completeTask: completeTaskMutation.mutate,
    isCompleting: completeTaskMutation.isPending,
    deleteTask: deleteTaskMutation.mutate,
    isDeleting: deleteTaskMutation.isPending,
  };
}
