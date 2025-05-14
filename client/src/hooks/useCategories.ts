import { useMemo } from "react";
import { Task, Category, Priority } from "@/types";
import { CategoryCount, PriorityCount } from "@/types";

export function useCategories(tasks: Task[]) {
  const categoryCounts: CategoryCount[] = useMemo(() => {
    const allCount = tasks.length;
    const completedCount = tasks.filter(task => task.completed).length;
    
    const categoryMap = new Map<Category | string, number>();
    
    // Initialize with default categories
    categoryMap.set("Personal", 0);
    categoryMap.set("Work", 0);
    categoryMap.set("Important", 0);
    
    // Count tasks by category
    tasks.forEach(task => {
      const category = task.category;
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    return [
      {
        name: "All",
        count: allCount,
        icon: "list-check",
      },
      {
        name: "Work",
        count: categoryMap.get("Work") || 0,
        icon: "briefcase-line",
        color: "text-work",
      },
      {
        name: "Personal",
        count: categoryMap.get("Personal") || 0,
        icon: "user-heart-line",
        color: "text-personal",
      },
      {
        name: "Important",
        count: categoryMap.get("Important") || 0,
        icon: "flag-line",
        color: "text-important",
      },
      {
        name: "Completed",
        count: completedCount,
        icon: "check-double-line",
        color: "text-green-500",
      },
    ];
  }, [tasks]);

  const priorityCounts: PriorityCount[] = useMemo(() => {
    const priorityMap = new Map<Priority, number>();
    
    // Initialize with default priorities
    priorityMap.set("High", 0);
    priorityMap.set("Medium", 0);
    priorityMap.set("Low", 0);
    
    // Count tasks by priority
    tasks.forEach(task => {
      const priority = task.priority;
      if (priority) {
        priorityMap.set(priority as Priority, (priorityMap.get(priority as Priority) || 0) + 1);
      }
    });
    
    return [
      {
        name: "High",
        count: priorityMap.get("High") || 0,
        color: "bg-red-500",
      },
      {
        name: "Medium",
        count: priorityMap.get("Medium") || 0,
        color: "bg-yellow-500",
      },
      {
        name: "Low",
        count: priorityMap.get("Low") || 0,
        color: "bg-blue-500",
      },
    ];
  }, [tasks]);

  return { categoryCounts, priorityCounts };
}
