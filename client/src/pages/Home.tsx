import { useState } from "react";
import { useTaskManager } from "@/hooks/useTaskManager";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategorySidebar from "@/components/CategorySidebar";
import TaskInput from "@/components/TaskInput";
import TaskList from "@/components/TaskList";
import AIInsights from "@/components/AIInsights";
import { GuestBanner, GuestConversionBanner } from "@/components/GuestBanner";
import { TaskFilter } from "@/types";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Home() {
  const taskManager = useTaskManager();
  const { tasks, isLoading, processTask, isProcessing, clearAllTasks } = taskManager;
  const { categoryCounts, priorityCounts } = useCategories(tasks);
  const [activeFilter, setActiveFilter] = useState<TaskFilter>({});
  const [taskInput, setTaskInput] = useState("");
  const [mobileAddTaskOpen, setMobileAddTaskOpen] = useState(false);
  const [clearGuestTasksOpen, setClearGuestTasksOpen] = useState(false);
  const isMobile = useIsMobile();
  const { isGuest } = useAuth();
  
  const handleAddTask = () => {
    if (taskInput.trim() === "") return;
    
    processTask(taskInput);
    setTaskInput("");
    setMobileAddTaskOpen(false);
  };
  
  const handleClearGuestTasks = () => {
    clearAllTasks();
    setClearGuestTasksOpen(false);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Guest Mode Banners */}
          {isGuest && <GuestBanner />}
          
          {/* Mobile Filter Section */}
          {isMobile && (
            <CategorySidebar 
              categoryCounts={categoryCounts}
              priorityCounts={priorityCounts}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          )}
          
          {/* Show clear all tasks option for guests */}
          {isGuest && tasks.length > 0 && !isMobile && (
            <Alert className="mb-4 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-300 ml-2">Guest Mode</AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                <div className="flex items-center justify-between">
                  <span>Your tasks are saved locally and will be lost when you clear your browser data.</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="ml-4 text-yellow-700 border-yellow-400 hover:bg-yellow-100 dark:text-yellow-300 dark:border-yellow-800 dark:hover:bg-yellow-900/50"
                    onClick={() => setClearGuestTasksOpen(true)}
                  >
                    Clear All Tasks
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Categories (Desktop only) */}
            {!isMobile && (
              <CategorySidebar 
                categoryCounts={categoryCounts}
                priorityCounts={priorityCounts}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />
            )}
            
            {/* Main Task Area */}
            <div className="lg:col-span-2">
              {!isMobile && <TaskInput />}
              <TaskList 
                tasks={tasks} 
                isLoading={isLoading} 
                filter={activeFilter}
              />
              <AIInsights tasks={tasks} />
            </div>
          </div>
        </div>
      </main>
      
      {/* Floating Add Task Button (Mobile Only) */}
      {isMobile && (
        <>
          <Dialog open={mobileAddTaskOpen} onOpenChange={setMobileAddTaskOpen}>
            <DialogTrigger asChild>
              <Button 
                className="fixed right-6 bottom-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
                size="lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 w-5 h-5">
                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={taskInput}
                      onChange={(e) => setTaskInput(e.target.value)}
                      className="block w-full pl-10 pr-12 py-4 text-sm border-gray-300 rounded-md bg-gray-50 focus:ring-primary focus:border-primary"
                      placeholder="Type your task description..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddTask();
                        }
                      }}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500">{isGuest ? 'Simple categorization will be applied to your task' : 'Our AI will automatically categorize and prioritize your task'}</p>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleAddTask}
                    disabled={isProcessing || !taskInput.trim()}
                    className="inline-flex items-center"
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
            </DialogContent>
          </Dialog>
        </>
      )}
      
      {/* Clear Guest Tasks Dialog */}
      {isGuest && (
        <Dialog open={clearGuestTasksOpen} onOpenChange={setClearGuestTasksOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Clear All Guest Tasks</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to clear all your tasks? This action cannot be undone.
                Your guest tasks are only stored locally on this device.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setClearGuestTasksOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleClearGuestTasks}>
                Clear All Tasks
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Conversion Banner */}
      {isGuest && <GuestConversionBanner />}
      
      <Footer />
    </div>
  );
}
