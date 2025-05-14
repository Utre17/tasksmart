import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTasks } from "@/hooks/useTasks";

export default function TaskInput() {
  const [taskInput, setTaskInput] = useState("");
  const { processTask, isProcessing } = useTasks();

  const handleAddTask = () => {
    if (taskInput.trim() === "") return;
    
    processTask(taskInput);
    setTaskInput("");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="task-input" className="sr-only">Task Input</label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 w-5 h-5">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                <path d="M5 3v4" />
                <path d="M19 17v4" />
                <path d="M3 5h4" />
                <path d="M17 19h4" />
              </svg>
            </div>
            <Input
              type="text"
              id="task-input"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              className="block w-full pl-10 pr-12 py-4 sm:text-sm border-gray-300 rounded-md bg-gray-50 focus:ring-primary focus:border-primary"
              placeholder="Type your task in natural language (e.g., 'Remind me to call mom tomorrow at 5 PM')"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddTask();
                }
              }}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 cursor-pointer hover:text-primary w-5 h-5">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="23" />
                <line x1="8" x2="16" y1="23" y2="23" />
              </svg>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500">Our AI will automatically categorize and prioritize your task</p>
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleAddTask}
            disabled={isProcessing || !taskInput.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 w-4 h-4">
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
                Add Task
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
