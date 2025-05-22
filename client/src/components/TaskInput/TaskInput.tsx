const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!taskInput.trim()) return;
  
  setIsProcessing(true);
  
  try {
    // First try to use AI processing
    let processedTask;
    try {
      // Try to process with AI
      processedTask = await api.processTask(taskInput);
    } catch (aiError) {
      console.error("AI processing failed, using basic task creation:", aiError);
      
      // Create a basic task if AI fails
      processedTask = {
        title: taskInput.length > 50 ? taskInput.substring(0, 47) + '...' : taskInput,
        description: taskInput,
        category: 'Personal',
        priority: 'Medium',
        dueDate: null
      };
    }
    
    // Then try to save the task
    try {
      const task = await api.createTask(processedTask);
      onTaskCreated?.(task);
      toast({
        title: "Task added",
        description: "Your task has been added successfully",
      });
    } catch (saveError) {
      console.error("Failed to save task:", saveError);
      
      // If authenticated methods fail, try to save locally in guest mode
      if (saveError.toString().includes('auth') || saveError.toString().includes('token')) {
        try {
          // Manual fallback to guest mode
          const guestTask = {
            ...processedTask,
            id: Date.now(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // Save to local storage
          const existingTasks = JSON.parse(localStorage.getItem('guestTasks') || '[]');
          existingTasks.push(guestTask);
          localStorage.setItem('guestTasks', JSON.stringify(existingTasks));
          
          onTaskCreated?.(guestTask as any);
          toast({
            title: "Task saved locally",
            description: "Your task has been saved in guest mode",
          });
        } catch (fallbackError) {
          console.error("Even fallback failed:", fallbackError);
          toast({
            title: "Failed to create task",
            description: "Please try again or refresh the page",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Failed to create task",
          description: "Please try again or refresh the page",
          variant: "destructive",
        });
      }
    }
  } catch (error) {
    console.error("Task creation failed completely:", error);
    toast({
      title: "Error creating task",
      description: "Please try again with a different description",
      variant: "destructive",
    });
  } finally {
    setTaskInput("");
    setIsProcessing(false);
  }
}; 