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

/**
 * Process a task description with OpenRouter AI to extract details
 * @param taskInput User's task description
 * @returns Processed task with category, priority, title, etc.
 */
export async function processTaskWithAI(taskInput: string): Promise<ProcessedTaskResult> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || "";
    
    if (!apiKey) {
      console.warn("OPENROUTER_API_KEY not set. Using fallback processing.");
      return fallbackProcessing(taskInput);
    }

    const prompt = `
      Analyze this task: "${taskInput}"

      CONTEXT:
      - Personal tasks: self-improvement, home, family, hobbies, health
      - Work tasks: job, career, meetings, projects, deadlines
      - Important tasks: critical deadlines, essential responsibilities, health-related

      DEADLINE ANALYSIS:
      - Extract ANY date/time references (tomorrow, next week, May 10, etc.)
      - Convert relative dates to specific format (e.g., "in two days" → "Two days from now")
      - Detect urgency words (soon, urgent, ASAP)

      PRIORITY SCALE:
      - High: urgent, critical, immediately needed, time-sensitive
      - Medium: standard importance, should be done soon but not urgent
      - Low: can wait, flexible timeline, when convenient

      RESPONSE FORMAT (JSON object only):
      {
        "category": "Personal|Work|Important", 
        "priority": "High|Medium|Low",
        "title": "Concise title, preserve original wording if already concise",
        "dueDate": "Extracted date/time reference if present",
        "notes": "Additional details or context"
      }
    `;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
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
      // Extract JSON object from the content (handling cases where model adds extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON object found in response");
      }
      
      const parsedResult = JSON.parse(jsonMatch[0]);
      
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
      console.error("Response content:", content);
      return fallbackProcessing(taskInput);
    }

  } catch (error) {
    console.error("OpenRouter API error:", error);
    return fallbackProcessing(taskInput);
  }
}

/**
 * Generate a concise summary of a task
 * @param taskDescription The task description to summarize
 * @returns Summarized version of the task
 */
export async function summarizeTask(taskDescription: string): Promise<string> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || "";
    
    if (!apiKey || !taskDescription) {
      return taskDescription;
    }

    const prompt = `
      Summarize this task description into a brief, actionable title (maximum 60 characters):
      "${taskDescription}"
      
      Keep important details about:
      - What needs to be done
      - Any critical deadlines
      - Core purpose/goal
      
      RESPOND WITH ONLY THE SUMMARY TEXT, NO QUOTES OR ADDITIONAL TEXT.
    `;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 100
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
    const content = data.choices[0]?.message?.content?.trim();

    if (!content) {
      return taskDescription;
    }

    return content;
  } catch (error) {
    console.error("Error summarizing task:", error);
    // Return original if summarization fails
    return taskDescription;
  }
}

// Fallback processing if API fails
function fallbackProcessing(taskInput: string): ProcessedTaskResult {
  // Simple heuristics for category
  let category: Category = "Personal";
  if (taskInput.toLowerCase().includes("work") || 
      taskInput.toLowerCase().includes("project") || 
      taskInput.toLowerCase().includes("report") ||
      taskInput.toLowerCase().includes("meeting") ||
      taskInput.toLowerCase().includes("client")) {
    category = "Work";
  } else if (taskInput.toLowerCase().includes("urgent") || 
            taskInput.toLowerCase().includes("important") || 
            taskInput.toLowerCase().includes("asap") ||
            taskInput.toLowerCase().includes("critical") ||
            taskInput.toLowerCase().includes("deadline")) {
    category = "Important";
  }
  
  // Simple heuristics for priority
  let priority: Priority = "Medium";
  if (taskInput.toLowerCase().includes("urgent") || 
      taskInput.toLowerCase().includes("asap") || 
      taskInput.toLowerCase().includes("immediately") ||
      taskInput.toLowerCase().includes("today") ||
      taskInput.toLowerCase().includes("critical")) {
    priority = "High";
  } else if (taskInput.toLowerCase().includes("whenever") || 
            taskInput.toLowerCase().includes("eventually") ||
            taskInput.toLowerCase().includes("when you can") ||
            taskInput.toLowerCase().includes("low priority")) {
    priority = "Low";
  }

  // Extract dates (more comprehensive implementation)
  let dueDate = "";
  const datePatterns = [
    { pattern: /tomorrow/i, output: "Tomorrow" },
    { pattern: /next week/i, output: "Next Week" },
    { pattern: /next month/i, output: "Next Month" },
    { pattern: /today/i, output: "Today" },
    { pattern: /this week/i, output: "This Week" },
    { pattern: /this weekend/i, output: "This Weekend" },
    { pattern: /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/, matchAsDueDate: true },
    { pattern: /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}(?:st|nd|rd|th)?(?:,? \d{4})?\b/i, matchAsDueDate: true }
  ];

  for (const { pattern, output, matchAsDueDate } of datePatterns) {
    const match = taskInput.match(pattern);
    if (match) {
      dueDate = matchAsDueDate ? match[0] : output;
      break;
    }
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
