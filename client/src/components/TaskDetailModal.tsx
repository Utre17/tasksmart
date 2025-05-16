import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task, Category, Priority } from "@/types";
import { taskCategories, taskPriorities } from "@shared/schema";
import { useTasks } from "@/hooks/useTasks";
import api from "@/lib/api";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export default function TaskDetailModal({ isOpen, onClose, task }: TaskDetailModalProps) {
  const { updateTask, isUpdating } = useTasks();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Personal");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryNote, setSummaryNote] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setCategory(task.category as Category);
      setPriority(task.priority as Priority);
      setDueDate(task.dueDate || "");
      setNotes(task.notes || "");
      setSummaryNote(null);
    }
  }, [task]);

  const handleSave = () => {
    if (!task) return;
    
    updateTask({
      id: task.id,
      task: {
        title,
        category,
        priority,
        dueDate,
        notes
      }
    });
    
    onClose();
  };

  const handleSummarizeTitle = async () => {
    if (!task) return;
    
    try {
      setIsSummarizing(true);
      setSummaryNote(null);
      
      const result = await api.summarizeTask(title);
      
      if (result.summary) {
        setTitle(result.summary);
        if (result.note) {
          setSummaryNote(result.note);
        }
      }
    } catch (error) {
      console.error("Error summarizing task:", error);
      setSummaryNote("Failed to summarize task. Please try again.");
    } finally {
      setIsSummarizing(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-task-title">Task Title</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleSummarizeTitle}
                disabled={isSummarizing || !title.trim()}
                className="text-xs h-7 px-2"
              >
                {isSummarizing ? "Summarizing..." : "Summarize"}
              </Button>
            </div>
            <Input
              id="edit-task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {summaryNote && (
              <p className="text-xs text-amber-600 mt-1">{summaryNote}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-task-category">Category</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as Category)}
              >
                <SelectTrigger id="edit-task-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {taskCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-task-priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as Priority)}
              >
                <SelectTrigger id="edit-task-priority">
                  <SelectValue placeholder="Select a priority" />
                </SelectTrigger>
                <SelectContent>
                  {taskPriorities.map((pri) => (
                    <SelectItem key={pri} value={pri}>
                      {pri}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="edit-task-date">Due Date</Label>
            <Input
              id="edit-task-date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              placeholder="e.g., Tomorrow, Oct 15, 2023"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="edit-task-notes">Notes</Label>
            <Textarea
              id="edit-task-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
