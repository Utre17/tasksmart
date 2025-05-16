import { useEffect, useState } from "react";
import { Task, InsertTask } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import * as guestStorage from "@/lib/guestStorage";
import { useQueryClient } from "@tanstack/react-query";

export function useGuestTasks() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  // Load tasks from local storage on initial render
  useEffect(() => {
    const guestTasks = guestStorage.getGuestTasks();
    setTasks(guestTasks);
    
    // Also set tasks in the query cache to ensure instant UI updates
    queryClient.setQueryData(["/api/tasks"], guestTasks);
    
    setIsLoading(false);
  }, [queryClient]);

  // Mock AI processing for guest mode
  const processTask = async (input: string): Promise<Task> => {
    if (!input.trim()) {
      throw new Error("Task description cannot be empty");
    }

    setIsProcessing(true);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Process the input - very simple categorization for guest mode
      let category = "Uncategorized";
      let priority = "Medium";

      // Simple word-based categorization
      const lowercaseInput = input.toLowerCase();
      if (lowercaseInput.includes("work") || lowercaseInput.includes("project") || lowercaseInput.includes("meeting")) {
        category = "Work";
      } else if (lowercaseInput.includes("buy") || lowercaseInput.includes("shopping") || lowercaseInput.includes("purchase")) {
        category = "Shopping";
      } else if (lowercaseInput.includes("call") || lowercaseInput.includes("email") || lowercaseInput.includes("contact")) {
        category = "Communication";
      } else if (lowercaseInput.includes("home") || lowercaseInput.includes("clean") || lowercaseInput.includes("repair")) {
        category = "Home";
      }

      // Simple priority detection
      if (lowercaseInput.includes("urgent") || lowercaseInput.includes("asap") || lowercaseInput.includes("important")) {
        priority = "High";
      } else if (lowercaseInput.includes("later") || lowercaseInput.includes("eventually") || lowercaseInput.includes("when possible")) {
        priority = "Low";
      }

      // Create the new task
      const newTask = guestStorage.saveGuestTask({
        title: input,
        category,
        priority,
      }, queryClient);

      // Update the local state
      setTasks(guestStorage.getGuestTasks());

      toast({
        title: "Task added",
        description: "Your task was processed and added successfully",
      });

      return newTask;
    } catch (error: any) {
      toast({
        title: "Error adding task",
        description: error.message || "There was a problem processing your task",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const createTask = async (task: Partial<InsertTask>): Promise<Task> => {
    try {
      const newTask = guestStorage.saveGuestTask(task, queryClient);
      setTasks(guestStorage.getGuestTasks());

      toast({
        title: "Task created",
        description: "Your task was created successfully",
      });

      return newTask;
    } catch (error: any) {
      toast({
        title: "Error creating task",
        description: "There was a problem creating your task",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateTask = async (id: number, task: Partial<InsertTask>): Promise<Task | null> => {
    try {
      const updatedTask = guestStorage.updateGuestTask(id, task, queryClient);
      setTasks(guestStorage.getGuestTasks());

      if (updatedTask) {
        toast({
          title: "Task updated",
          description: "Your task was updated successfully",
        });
      }

      return updatedTask;
    } catch (error: any) {
      toast({
        title: "Error updating task",
        description: "There was a problem updating your task",
        variant: "destructive",
      });
      throw error;
    }
  };

  const completeTask = async (id: number, completed: boolean): Promise<Task | null> => {
    try {
      const updatedTask = guestStorage.completeGuestTask(id, completed, queryClient);
      setTasks(guestStorage.getGuestTasks());

      if (updatedTask) {
        toast({
          title: completed ? "Task completed" : "Task reopened",
          description: `Task has been marked as ${completed ? "completed" : "not completed"}`,
        });
      }

      return updatedTask;
    } catch (error: any) {
      toast({
        title: "Error updating task",
        description: "There was a problem updating your task status",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTask = async (id: number): Promise<boolean> => {
    try {
      const result = guestStorage.deleteGuestTask(id, queryClient);
      setTasks(guestStorage.getGuestTasks());

      if (result) {
        toast({
          title: "Task deleted",
          description: "Your task was deleted successfully",
        });
      }

      return result;
    } catch (error: any) {
      toast({
        title: "Error deleting task",
        description: "There was a problem deleting your task",
        variant: "destructive",
      });
      throw error;
    }
  };

  const clearCompletedTasks = async (): Promise<{ success: boolean; count: number }> => {
    try {
      const count = guestStorage.clearCompletedGuestTasks(queryClient);
      setTasks(guestStorage.getGuestTasks());

      toast({
        title: "Tasks cleared",
        description: `Successfully cleared ${count} completed tasks`,
      });

      return { success: true, count };
    } catch (error: any) {
      toast({
        title: "Error clearing tasks",
        description: "There was a problem clearing your completed tasks",
        variant: "destructive",
      });
      throw error;
    }
  };

  const clearAllTasks = async (): Promise<void> => {
    try {
      guestStorage.clearGuestMode();
      setTasks([]);
      
      // Clear tasks in the query cache
      queryClient.setQueryData(["/api/tasks"], []);

      toast({
        title: "All tasks cleared",
        description: "All guest tasks have been cleared",
      });
    } catch (error: any) {
      toast({
        title: "Error clearing tasks",
        description: "There was a problem clearing your tasks",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    tasks,
    isLoading,
    error: null,
    processTask,
    isProcessing,
    createTask,
    isCreating: false,
    updateTask,
    isUpdating: false,
    completeTask,
    isCompleting: false,
    deleteTask,
    isDeleting: false,
    clearCompletedTasks,
    clearAllTasks,
    isClearing: false,
  };
} 