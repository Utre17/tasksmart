import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

export default function AnalyticsPage() {
  const { isLoading, userAnalytics, completionStats, tasksByDate, aiUsageStats } = useAnalytics();
  const [timeRange, setTimeRange] = useState<string>("week");

  // Placeholder data until API provides real data
  const priorityDistData = userAnalytics?.priorityDist || [
    { name: "High", value: 12, color: "#f97316" },
    { name: "Medium", value: 25, color: "#3b82f6" },
    { name: "Low", value: 8, color: "#22c55e" },
  ];

  const taskCompletionData = tasksByDate?.completedByDate || [
    { date: "Mon", completed: 3 },
    { date: "Tue", completed: 5 },
    { date: "Wed", completed: 2 },
    { date: "Thu", completed: 7 },
    { date: "Fri", completed: 4 },
    { date: "Sat", completed: 1 },
    { date: "Sun", completed: 0 },
  ];

  const aiUsageData = aiUsageStats?.usageByDate || [
    { date: "Mon", count: 5 },
    { date: "Tue", count: 8 },
    { date: "Wed", count: 12 },
    { date: "Thu", count: 6 },
    { date: "Fri", count: 9 },
    { date: "Sat", count: 3 },
    { date: "Sun", count: 2 },
  ];

  // Calculate completion rate
  const totalTasks = userAnalytics?.totalTasks || 0;
  const completedTasks = userAnalytics?.completedTasks || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your productivity and task management statistics</p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="shadow-sm">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-8 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Total Tasks</CardDescription>
                <CardTitle className="text-3xl">{userAnalytics?.totalTasks || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Tasks created since you started
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Completed Tasks</CardDescription>
                <CardTitle className="text-3xl">{userAnalytics?.completedTasks || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Tasks you've successfully completed
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Completion Rate</CardDescription>
                <CardTitle className="text-3xl">{completionRate}%</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={completionRate} className="h-2" />
                <div className="text-sm text-muted-foreground mt-2">
                  Percent of tasks completed
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>AI Processed Tasks</CardDescription>
                <CardTitle className="text-3xl">{aiUsageStats?.totalUsage || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Tasks processed with AI assistance
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <Tabs defaultValue="priority" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="priority">Priority Distribution</TabsTrigger>
            <TabsTrigger value="completion">Task Completion</TabsTrigger>
            <TabsTrigger value="ai-usage">AI Usage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="priority">
            <Card className="shadow-sm p-4">
              <CardHeader>
                <CardTitle>Task Priority Distribution</CardTitle>
                <CardDescription>Breakdown of tasks by priority level</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-4">
                {isLoading ? (
                  <Skeleton className="h-[300px] w-[300px] rounded-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={priorityDistData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {priorityDistData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="completion">
            <Card className="shadow-sm p-4">
              <CardHeader>
                <CardTitle>Task Completion by Date</CardTitle>
                <CardDescription>Number of tasks completed each day</CardDescription>
                <div className="flex space-x-2 mt-2">
                  <Button 
                    variant={timeRange === "week" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setTimeRange("week")}
                  >
                    Week
                  </Button>
                  <Button 
                    variant={timeRange === "month" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setTimeRange("month")}
                  >
                    Month
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="py-4">
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={taskCompletionData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" name="Completed Tasks" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="ai-usage">
            <Card className="shadow-sm p-4">
              <CardHeader>
                <CardTitle>AI Usage Over Time</CardTitle>
                <CardDescription>Number of tasks processed with AI assistance</CardDescription>
                <div className="flex space-x-2 mt-2">
                  <Button 
                    variant={timeRange === "week" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setTimeRange("week")}
                  >
                    Week
                  </Button>
                  <Button 
                    variant={timeRange === "month" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setTimeRange("month")}
                  >
                    Month
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="py-4">
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={aiUsageData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" name="AI Processed Tasks" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
} 