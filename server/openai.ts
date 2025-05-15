import OpenAI from "openai";

// Create an OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced AI capabilities for the TaskSmart app
export const enhanceAICapabilities = {
  /**
   * Generate task suggestions based on an input task
   * @param taskInput The original task input
   * @param count Number of suggestions to generate (default: 3)
   * @returns Array of suggested tasks
   */
  async generateTaskSuggestions(taskInput: string, count: number = 3): Promise<{ title: string; category: string; priority: string }[]> {
    try {
      const prompt = `
        Based on this task: "${taskInput}"
        
        Generate ${count} related task suggestions that the user might want to add.
        Each suggestion should include:
        - A title for the task
        - A category (Personal, Work, or Important)
        - A priority level (High, Medium, or Low)
        
        Respond with a JSON array of objects with these properties:
        [{ "title": "...", "category": "...", "priority": "..." }]
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      const parsedContent = JSON.parse(content);
      return parsedContent.suggestions || [];
    } catch (error) {
      console.error("Error generating task suggestions:", error);
      // Fallback suggestions if AI fails
      return [
        { title: `Follow up on: ${taskInput}`, category: "Important", priority: "Medium" },
        { title: `Prepare materials for: ${taskInput}`, category: "Work", priority: "Low" },
        { title: `Review progress on: ${taskInput}`, category: "Personal", priority: "Low" },
      ];
    }
  },

  /**
   * Summarize a long text into a concise description
   * @param text The text to summarize
   * @returns Summarized text
   */
  async summarizeText(text: string): Promise<string> {
    try {
      const prompt = `
        Summarize the following text into a concise task description (maximum 100 characters):
        
        "${text}"
        
        Provide only the summary with no additional explanation or commentary.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
      });

      return response.choices[0].message.content?.trim() || text;
    } catch (error) {
      console.error("Error summarizing text:", error);
      
      // If AI fails, return a truncated version
      return text.length > 100 ? text.substring(0, 97) + "..." : text;
    }
  },

  /**
   * Generate insights about the user's tasks
   * @param tasks Array of tasks to analyze
   * @returns Insights about productivity patterns
   */
  async generateTaskInsights(tasks: any[]): Promise<{
    summary: string;
    suggestion: string;
    completionRate: number;
  }> {
    try {
      // Calculate basic statistics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.completed).length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      // Count by categories and priorities
      const categoryCounts: Record<string, number> = {};
      const priorityCounts: Record<string, number> = {};
      
      tasks.forEach(task => {
        categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
        priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
      });
      
      const taskData = JSON.stringify({
        totalTasks,
        completedTasks,
        completionRate,
        categoryCounts,
        priorityCounts,
        recentTasks: tasks.slice(-5).map(t => ({
          title: t.title,
          category: t.category,
          priority: t.priority,
          completed: t.completed
        }))
      });
      
      const prompt = `
        Analyze this task data and provide insights:
        ${taskData}
        
        Respond with a JSON object containing:
        1. A brief summary of the user's task patterns (1-2 sentences)
        2. A helpful suggestion to improve productivity (1 sentence)
        3. The completion rate as a number
        
        Format: { "summary": "...", "suggestion": "...", "completionRate": number }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("Error generating task insights:", error);
      
      // Fallback insights
      const completedTasks = tasks.filter(task => task.completed).length;
      const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
      
      return {
        summary: "You've been making steady progress on your tasks.",
        suggestion: "Consider prioritizing high-importance tasks first to improve productivity.",
        completionRate: Math.round(completionRate)
      };
    }
  }
};