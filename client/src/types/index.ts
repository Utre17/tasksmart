import { Task, Category, Priority } from "@shared/schema";

export type { Task, Category, Priority };

export interface TaskFilter {
  category?: Category;
  priority?: Priority;
  completed?: boolean;
}

export interface CategoryCount {
  name: Category | "All" | "Completed";
  count: number;
  icon: string;
  color?: string;
}

export interface PriorityCount {
  name: Priority;
  count: number;
  color: string;
}
