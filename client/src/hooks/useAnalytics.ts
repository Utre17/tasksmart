import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useAnalytics() {
  // Get user analytics
  const userAnalyticsQuery = useQuery({
    queryKey: ["analytics/user"],
    queryFn: api.getUserAnalytics,
    staleTime: 300000, // 5 minutes
  });

  // Get completion stats
  const completionStatsQuery = useQuery({
    queryKey: ["analytics/completion"],
    queryFn: api.getTaskCompletionStats,
    staleTime: 300000, // 5 minutes
  });

  // Get tasks by date (weekly by default)
  const tasksByDateQuery = useQuery({
    queryKey: ["analytics/tasks-by-date", "week"],
    queryFn: () => api.getTasksByDate("week"),
    staleTime: 300000, // 5 minutes
  });

  // Get AI usage stats
  const aiUsageStatsQuery = useQuery({
    queryKey: ["analytics/ai-usage"],
    queryFn: api.getAIUsageStats,
    staleTime: 300000, // 5 minutes
  });

  const isLoading = 
    userAnalyticsQuery.isLoading || 
    completionStatsQuery.isLoading || 
    tasksByDateQuery.isLoading || 
    aiUsageStatsQuery.isLoading;

  const error = 
    userAnalyticsQuery.error || 
    completionStatsQuery.error || 
    tasksByDateQuery.error || 
    aiUsageStatsQuery.error;

  return {
    isLoading,
    error,
    userAnalytics: userAnalyticsQuery.data,
    completionStats: completionStatsQuery.data,
    tasksByDate: tasksByDateQuery.data,
    aiUsageStats: aiUsageStatsQuery.data,
    refetch: () => {
      userAnalyticsQuery.refetch();
      completionStatsQuery.refetch();
      tasksByDateQuery.refetch();
      aiUsageStatsQuery.refetch();
    }
  };
} 