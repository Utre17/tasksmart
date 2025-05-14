import { Task } from "@/types";

interface AIInsightsProps {
  tasks: Task[];
}

export default function AIInsights({ tasks }: AIInsightsProps) {
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
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">AI Insights</h2>
        <button type="button" className="text-sm text-primary hover:text-primary/80 font-medium">
          View All
        </button>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-xl text-primary w-5 h-5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-primary">Task Optimization</h3>
            <p className="mt-1 text-sm text-gray-600">
              {insightMessage}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 rounded-lg overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=900&h=400" 
          alt="Productivity workspace with people" 
          className="w-full h-48 object-cover rounded-lg" 
        />
      </div>
    </div>
  );
}
