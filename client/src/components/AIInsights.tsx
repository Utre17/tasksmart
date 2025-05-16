import { Task } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";

interface AIInsightsProps {
  tasks: Task[];
}

export default function AIInsights({ tasks }: AIInsightsProps) {
  const { isGuest } = useAuth();
  const [, navigate] = useLocation();
  
  // Calculate insights
  const highPriorityCount = tasks.filter(task => task.priority === "High" && !task.completed).length;
  const workTasksCount = tasks.filter(task => task.category === "Work" && !task.completed).length;
  
  // Generate insight message
  let insightMessage = "You're all caught up! No high-priority tasks at the moment.";
  
  if (highPriorityCount > 0) {
    insightMessage = `You have ${highPriorityCount} high-priority ${highPriorityCount === 1 ? 'task' : 'tasks'} pending. ${
      workTasksCount > 0 
        ? `Consider allocating more time to your ${workTasksCount} work-related ${workTasksCount === 1 ? 'task' : 'tasks'}.` 
        : 'Focus on completing these tasks first.'
    }`;
  }
  
  // Guest-specific message
  if (isGuest) {
    if (tasks.length === 0) {
      insightMessage = "Get started by adding your first task. Create an account to unlock advanced AI features!";
    } else {
      insightMessage = `You have ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} in guest mode. Create an account to unlock AI insights and task optimization!`;
    }
  }

  const navigateToRegister = (e: React.MouseEvent) => {
    e.preventDefault();
    // Use React Router to navigate
    navigate("/auth?mode=register");
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          {isGuest ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-amber-500 w-5 h-5">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
              </svg>
              Guest Mode
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary w-5 h-5">
                <path d="M12 2c1.7 0 3 1.3 3 3v1h-6v-1c0-1.7 1.3-3 3-3z" />
                <path d="M14 6H3a1 1 0 0 0-1 1v5c0 4.97 3.58 9 8 9 1.95 0 3.76-.68 5.17-1.85" />
                <path d="M16 10.42V6" />
                <circle cx="17" cy="16" r="3" />
                <path d="M14.7 13.7a3 3 0 0 1 4.1 4.1" />
                <path d="M19.07 19.07a3 3 0 0 1-4.14 0" />
              </svg>
              AI Insights
            </>
          )}
        </h2>
        {!isGuest && (
          <button type="button" className="text-sm text-primary hover:text-primary/80 font-medium">
            View All
          </button>
        )}
      </div>
      
      <div className={`${isGuest ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'} border rounded-lg p-4`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {isGuest ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400 w-5 h-5">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <rect width="22" height="20" x="1" y="3" rx="7"></rect>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary w-5 h-5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${isGuest ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}`}>
              {isGuest ? 'Limited Features' : 'Task Optimization'}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {insightMessage}
            </p>
            {isGuest && (
              <button
                onClick={navigateToRegister}
                className="mt-2 inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
              >
                Create an Account
                <svg className="ml-1 w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {!isGuest && (
        <div className="mt-4 rounded-lg overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=900&h=400" 
            alt="Productivity workspace with people" 
            className="w-full h-48 object-cover rounded-lg" 
          />
        </div>
      )}
    </div>
  );
}
