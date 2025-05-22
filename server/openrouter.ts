import axios from "axios";
import { Category, Priority } from "@shared/schema";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Helper: Prompt for AI
const taskCategorizationPrompt = (taskInput: string) => `
You are an intelligent assistant for a task manager app.
Categorize the following task and assign it a category (Work, Personal, Important, or Completed), a priority (High, Medium, Low), and extract a due date if you see one. Return a JSON object with these fields: category, priority, title, dueDate (if any).

Task: "${taskInput}"
`;

export async function processTaskWithAI(taskInput: string) {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct", // You can use any available free model
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: taskCategorizationPrompt(taskInput) },
        ],
        temperature: 0.2,
        max_tokens: 200,
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Extract result JSON from the AI response
    const raw = response.data.choices[0]?.message?.content?.trim();
    // The AI will respond with a string—parse as JSON if possible
    const result = JSON.parse(raw);

    // Make sure all required fields are present
    return {
      category: result.category as Category,
      priority: result.priority as Priority,
      title: result.title ?? taskInput,
      dueDate: result.dueDate ?? "",
      notes: "Auto-processed with OpenRouter AI"
    };
  } catch (err: any) {
    // Fallback: Use mock logic if AI fails
    console.error("OpenRouter AI failed, falling back to mock. Error:", err?.message || err);
    // Use default values for fallback
    let category: Category = "Personal";
    let priority: Priority = "Medium";
    return {
      category,
      priority,
      title: taskInput,
      dueDate: "",
      notes: "Auto-processed with mock AI (fallback)"
    };
  }
}

// Summarize task with OpenRouter
export async function summarizeTask(taskDescription: string): Promise<string> {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct", // Free model
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: `Summarize this task in one short sentence:\n${taskDescription}` },
        ],
        temperature: 0.4,
        max_tokens: 60,
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    const summary = response.data.choices[0]?.message?.content?.trim();
    return summary || "No summary available.";
  } catch (err) {
    // fallback to basic summary
    return taskDescription.length <= 50
      ? taskDescription
      : taskDescription.substring(0, 50) + "...";
  }
}
