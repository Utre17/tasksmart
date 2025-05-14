import axios from "axios";
import { Category, Priority, taskCategories, taskPriorities } from "@shared/schema";

// Define the shape of the response from OpenRouter API
interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface ProcessedTaskResult {
  category: Category;
  priority: Priority;
  title: string;
  dueDate?: string;
  notes?: string;
}

export async function processTaskWithAI(taskInput: string): Promise<ProcessedTaskResult> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || "";
    
    if (!apiKey) {
      console.warn("OPENROUTER_API_KEY not set. Using fallback processing.");
      return fallbackProcessing(taskInput);
    }

    const prompt = `
      I have a task description: "${taskInput}".
      Please analyze this and respond with a JSON object that contains:
      - "category": either "Personal", "Work", or "Important" based on the task content
      - "priority": either "High", "Medium", or "Low" based on urgency and importance
      - "title": a concise task title (keep the original wording if it's already concise)
      - "dueDate": extract any date or time information if present (leave empty if none)
      - "notes": any additional details or context (leave empty if none)
      
      Respond ONLY with the JSON object and nothing else.
    `;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://tasksmart.app"
        }
      }
    );

    const data = response.data as OpenRouterResponse;
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in response");
    }

    // Try to parse the JSON response
    try {
      const parsedResult = JSON.parse(content);
      
      // Validate category and priority
      const category = ensureValidCategory(parsedResult.category);
      const priority = ensureValidPriority(parsedResult.priority);
      
      return {
        category,
        priority,
        title: parsedResult.title || taskInput,
        dueDate: parsedResult.dueDate || "",
        notes: parsedResult.notes || ""
      };
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return fallbackProcessing(taskInput);
    }

  } catch (error) {
    console.error("OpenRouter API error:", error);
    return fallbackProcessing(taskInput);
  }
}

// Fallback processing if API fails
function fallbackProcessing(taskInput: string): ProcessedTaskResult {
  // Simple heuristics for category
  let category: Category = "Personal";
  if (taskInput.toLowerCase().includes("work") || 
      taskInput.toLowerCase().includes("project") || 
      taskInput.toLowerCase().includes("report")) {
    category = "Work";
  } else if (taskInput.toLowerCase().includes("urgent") || 
            taskInput.toLowerCase().includes("important") || 
            taskInput.toLowerCase().includes("asap")) {
    category = "Important";
  }
  
  // Simple heuristics for priority
  let priority: Priority = "Medium";
  if (taskInput.toLowerCase().includes("urgent") || 
      taskInput.toLowerCase().includes("asap") || 
      taskInput.toLowerCase().includes("immediately")) {
    priority = "High";
  } else if (taskInput.toLowerCase().includes("whenever") || 
            taskInput.toLowerCase().includes("eventually")) {
    priority = "Low";
  }

  // Extract dates (very basic implementation)
  let dueDate = "";
  if (taskInput.toLowerCase().includes("tomorrow")) {
    dueDate = "Tomorrow";
  } else if (taskInput.toLowerCase().includes("next week")) {
    dueDate = "Next Week";
  }

  return {
    category,
    priority,
    title: taskInput,
    dueDate,
    notes: ""
  };
}

// Helper functions to ensure valid categories and priorities
function ensureValidCategory(category: string): Category {
  const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  
  if (taskCategories.includes(normalizedCategory as Category)) {
    return normalizedCategory as Category;
  }
  
  return "Personal"; // Default fallback
}

function ensureValidPriority(priority: string): Priority {
  const normalizedPriority = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
  
  if (taskPriorities.includes(normalizedPriority as Priority)) {
    return normalizedPriority as Priority;
  }
  
  return "Medium"; // Default fallback
}
