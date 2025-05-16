import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Task } from "@/types";
import { useTasks } from "@/hooks/useTasks";
import { Pencil, Trash2, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export default function TaskItem({ task, onEdit }: TaskItemProps) {
  const { completeTask, deleteTask, isCompleting, isDeleting } = useTasks();
  const [isChecked, setIsChecked] = useState(task.completed);
  const [isDeleting_, setIsDeleting] = useState(false);
  const [isCompleting_, setIsCompleting] = useState(false);

  const handleCheckboxChange = async () => {
    try {
      const newStatus = !isChecked;
      setIsCompleting(true);
      setIsChecked(newStatus);
      await completeTask({ id: task.id, completed: newStatus });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteTask(task.id);
    } finally {
      setIsDeleting(false);
    }
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

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case "High":
        return "border-l-4 border-red-500";
      case "Medium":
        return "border-l-4 border-yellow-500";
      case "Low":
        return "border-l-4 border-blue-500";
      default:
        return "";
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-700";
      case "Medium":
        return "text-yellow-700";
      case "Low":
        return "text-blue-700";
      default:
        return "text-gray-700";
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
    <div 
      className={`task-card ${isChecked ? 'bg-gray-50' : 'bg-white'} 
        ${getPriorityBorder(task.priority)} 
        border border-gray-200 rounded-lg p-4 
        shadow-sm hover:shadow-md 
        transition-all duration-300 ease-in-out
        ${isDeleting_ ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-1">
          <div className="relative">
            {isCompleting_ && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-full">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            )}
            <Checkbox
              checked={isChecked}
              onCheckedChange={handleCheckboxChange}
              disabled={isCompleting_}
              className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
            />
          </div>
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`text-base font-medium ${isChecked ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </h3>
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-primary transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
                      onClick={() => onEdit(task)}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit task</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
                      onClick={handleDelete}
                      disabled={isDeleting_}
                    >
                      {isDeleting_ ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete task</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="flex items-center mt-2 flex-wrap">
            <span className={`category-badge ${getCategoryBadgeClass(task.category)} ${isChecked ? 'opacity-60' : ''} mr-2 mb-1`}>
              {task.category}
            </span>
            <div className="flex items-center mr-3 mb-1">
              <div className={`priority-indicator ${getPriorityColor(task.priority)} ${isChecked ? 'opacity-60' : ''} animate-pulse`}></div>
              <span className={`text-xs ${isChecked ? 'text-gray-400' : getPriorityTextColor(task.priority)}`}>
                {task.priority} Priority
              </span>
            </div>
            {task.dueDate && (
              <span className={`text-xs ${isChecked ? 'text-gray-400' : 'text-gray-500'} ml-auto flex items-center`}>
                <Clock className="h-3 w-3 mr-1" />
                {isChecked ? 'Completed' : task.dueDate}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
