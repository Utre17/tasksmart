import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTaskManager } from "@/hooks/useTaskManager";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ZapIcon, PlusIcon, ListChecks, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function TaskInput() {
  const [taskInput, setTaskInput] = useState("");
  const [summaryNote, setSummaryNote] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { processTask, isProcessing } = useTaskManager();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const { isGuest } = useAuth();

  const handleAddTask = async () => {
    if (taskInput.trim() === "") return;
    
    try {
      setErrorMessage(null);
      await processTask(taskInput);
      setTaskInput("");
      setSummaryNote(null);
    } catch (error) {
      console.error("Error processing task:", error);
      setErrorMessage("Failed to process task. Please try again or simplify your task description.");
    }
  };

  const handleSummarizeInput = async () => {
    if (taskInput.trim() === "") return;
    
    try {
      setIsSummarizing(true);
      setSummaryNote(null);
      setErrorMessage(null);
      
      const result = await api.summarizeTask(taskInput);
      
      if (result.summary) {
        setTaskInput(result.summary);
        if (result.note) {
          setSummaryNote(result.note);
        }
      }
    } catch (error) {
      console.error("Error summarizing task:", error);
      setErrorMessage("Failed to summarize task. Please try again.");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-primary" />
              Add New Task
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {isGuest 
                ? "Enter a task description to organize your work" 
                : "Enter a task description and our AI will categorize it for you"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Sparkles className="text-gray-400 w-5 h-5" />
          </div>
          <Input
            id="task-input"
            placeholder="Enter a task description (e.g., 'Call client tomorrow about project')"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            className="pl-10 pr-16 h-12 border-gray-200 focus:border-primary"
            onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleAddTask()}
          />
        </div>
        
        {summaryNote && (
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {summaryNote}
          </p>
        )}
        
        <div className="text-xs text-gray-500 mt-2 ml-1">
          {isGuest ? (
            <p>Simple categorization will be applied to your task (e.g., using keywords like "work", "urgent", etc.)</p>
          ) : (
            <p>Our AI will analyze your task to determine category, priority, and due date</p>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between gap-2 pt-2">
        {!isGuest && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSummarizeInput}
                  disabled={isSummarizing || isProcessing || !taskInput.trim()}
                  className="flex items-center"
                >
                  {isSummarizing ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      <span>Summarizing...</span>
                    </>
                  ) : (
                    <>
                      <ZapIcon className="mr-2 h-4 w-4" />
                      <span>Summarize</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Use AI to make your task description more concise</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <Button
          type="button"
          onClick={handleAddTask}
          disabled={isProcessing || !taskInput.trim()}
          className={`flex items-center gap-2 ${isGuest && 'ml-auto'}`}
        >
          {isProcessing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <PlusIcon className="h-4 w-4" />
              <span>Add Task</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
