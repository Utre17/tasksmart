import { useState } from "react";
import { Input } from "@/components/ui/input";
import TaskItem from "./TaskItem";
import TaskDetailModal from "./TaskDetailModal";
import { Task, TaskFilter } from "@/types";

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  filter: TaskFilter;
}

export default function TaskList({ tasks, isLoading, filter }: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  // Filter tasks based on search query and filter
  const filteredTasks = tasks.filter(task => {
    // Filter by search query
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category if specified
    const matchesCategory = filter.category 
      ? task.category === filter.category
      : true;
    
    // Filter by priority if specified
    const matchesPriority = filter.priority 
      ? task.priority === filter.priority
      : true;
    
    // Filter by completion status if specified
    const matchesCompleted = filter.completed !== undefined
      ? task.completed === filter.completed
      : true;
    
    return matchesSearch && matchesCategory && matchesPriority && matchesCompleted;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Your Tasks</h2>
        <div className="flex items-center space-x-2">
          <button type="button" className="text-gray-500 hover:text-primary p-1 transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </button>
          <button type="button" className="text-gray-500 hover:text-primary p-1 transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
              <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
              <path d="M12 3v6" />
            </svg>
          </button>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <Input 
              type="text" 
              className="bg-gray-50 text-sm rounded-lg pl-10 pr-3 py-2 w-[180px] border-gray-200 focus:ring-primary focus:border-primary transition-all duration-200"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="flex items-start">
                <div className="h-5 w-5 bg-gray-200 rounded-sm"></div>
                <div className="ml-3 flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="flex items-center mt-1">
                    <div className="h-4 bg-gray-200 rounded w-20 mr-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <TaskItem key={task.id} task={task} onEdit={handleEditTask} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4 w-12 h-12">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery 
              ? "Try adjusting your search or filter criteria" 
              : "Add a new task to get started"}
          </p>
        </div>
      )}

      {filteredTasks.length > 5 && (
        <div className="mt-6 text-center">
          <button type="button" className="text-primary hover:text-primary/80 text-sm font-medium flex items-center mx-auto transition-colors duration-200">
            <span>View more tasks</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 w-4 h-4">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      )}

      <TaskDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        task={editingTask}
      />
    </div>
  );
}
