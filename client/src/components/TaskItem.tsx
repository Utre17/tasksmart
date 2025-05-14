import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Task } from "@/types";
import { useTasks } from "@/hooks/useTasks";

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export default function TaskItem({ task, onEdit }: TaskItemProps) {
  const { completeTask, deleteTask } = useTasks();
  const [isChecked, setIsChecked] = useState(task.completed);

  const handleCheckboxChange = () => {
    const newStatus = !isChecked;
    setIsChecked(newStatus);
    completeTask({ id: task.id, completed: newStatus });
  };

  const handleDelete = () => {
    deleteTask(task.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-500";
      case "Medium":
        return "bg-yellow-500";
      case "Low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "Personal":
        return "bg-personal/10 text-personal";
      case "Work":
        return "bg-work/10 text-work";
      case "Important":
        return "bg-important/10 text-important";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={`task-card ${isChecked ? 'bg-gray-50' : 'bg-white'} border border-gray-200 rounded-lg p-4 hover:shadow-md`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-1">
          <Checkbox
            checked={isChecked}
            onCheckedChange={handleCheckboxChange}
            className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
          />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`text-base font-medium ${isChecked ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="text-gray-400 hover:text-primary"
                onClick={() => onEdit(task)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>
              <button
                type="button"
                className="text-gray-400 hover:text-red-500"
                onClick={handleDelete}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  <line x1="10" x2="10" y1="11" y2="17" />
                  <line x1="14" x2="14" y1="11" y2="17" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center mt-1 flex-wrap">
            <span className={`category-badge ${getCategoryBadgeClass(task.category)} ${isChecked ? 'opacity-60' : ''} mr-2 mb-1`}>
              {task.category}
            </span>
            <div className="flex items-center mr-3 mb-1">
              <div className={`priority-indicator ${getPriorityColor(task.priority)} ${isChecked ? 'opacity-60' : ''}`}></div>
              <span className={`text-xs ${isChecked ? 'text-gray-400' : 'text-gray-500'}`}>
                {task.priority} Priority
              </span>
            </div>
            {task.dueDate && (
              <span className={`text-xs ${isChecked ? 'text-gray-400' : 'text-gray-500'} ml-auto`}>
                {isChecked ? 'Completed' : task.dueDate}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
