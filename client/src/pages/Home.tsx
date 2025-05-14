import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useCategories } from "@/hooks/useCategories";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategorySidebar from "@/components/CategorySidebar";
import TaskInput from "@/components/TaskInput";
import TaskList from "@/components/TaskList";
import AIInsights from "@/components/AIInsights";
import { TaskFilter } from "@/types";

export default function Home() {
  const { tasks, isLoading } = useTasks();
  const { categoryCounts, priorityCounts } = useCategories(tasks);
  const [activeFilter, setActiveFilter] = useState<TaskFilter>({});
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Categories */}
            <CategorySidebar 
              categoryCounts={categoryCounts}
              priorityCounts={priorityCounts}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
            
            {/* Main Task Area */}
            <div className="lg:col-span-2">
              <TaskInput />
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
      
      <Footer />
    </div>
  );
}
