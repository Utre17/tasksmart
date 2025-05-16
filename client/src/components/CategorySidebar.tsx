import { useState } from "react";
import { TaskFilter, CategoryCount, PriorityCount } from "@/types";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTasks } from "@/hooks/useTasks";
import { Trash2 } from "lucide-react";

interface CategorySidebarProps {
  categoryCounts: CategoryCount[];
  priorityCounts: PriorityCount[];
  activeFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
}

export default function CategorySidebar({ 
  categoryCounts, 
  priorityCounts, 
  activeFilter, 
  onFilterChange 
}: CategorySidebarProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activePriority, setActivePriority] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const { clearCompletedTasks, isClearing } = useTasks();
  
  const completedCount = categoryCounts.find(c => c.name === "Completed")?.count || 0;

  const handleCategoryClick = (categoryName: string) => {
    setActiveCategory(categoryName);
    setActivePriority(null);
    
    if (categoryName === "All") {
      onFilterChange({});
    } else if (categoryName === "Completed") {
      onFilterChange({ completed: true });
    } else {
      onFilterChange({ category: categoryName as any, completed: false });
    }
    
    // Close drawer on mobile after selection
    if (isMobile) {
      setIsDrawerOpen(false);
    }
  };

  const handlePriorityClick = (priorityName: string) => {
    if (activePriority === priorityName) {
      setActivePriority(null);
      onFilterChange({ category: activeCategory === "All" ? undefined : activeCategory as any });
    } else {
      setActivePriority(priorityName);
      onFilterChange({ 
        priority: priorityName as any, 
        category: activeCategory === "All" ? undefined : activeCategory as any 
      });
    }
    
    // Close drawer on mobile after selection
    if (isMobile) {
      setIsDrawerOpen(false);
    }
  };

  const getCategoryIcon = (category: CategoryCount) => {
    switch (category.icon) {
      case "list-check":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-lg mr-3 w-5 h-5">
            <path d="m8 6 2 2 5-5" />
            <path d="m8 12 2 2 5-5" />
            <path d="m8 18 2 2 5-5" />
          </svg>
        );
      case "briefcase-line":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-work text-lg mr-3 w-5 h-5">
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        );
      case "user-heart-line":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-personal text-lg mr-3 w-5 h-5">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case "flag-line":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-important text-lg mr-3 w-5 h-5">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" x2="4" y1="22" y2="15" />
          </svg>
        );
      case "check-double-line":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 text-lg mr-3 w-5 h-5">
            <path d="M18 6 7 17l-5-5" />
            <path d="m22 10-8 8-4-4" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-lg mr-3 w-5 h-5">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <line x1="3" x2="21" y1="9" y2="9" />
            <line x1="3" x2="21" y1="15" y2="15" />
            <line x1="9" x2="9" y1="3" y2="21" />
            <line x1="15" x2="15" y1="3" y2="21" />
          </svg>
        );
    }
  };

  // Sidebar Content Component (used in both mobile and desktop views)
  const SidebarContent = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Categories</h2>
        <div className="space-y-1">
          {categoryCounts.map((category) => (
            <button
              key={category.name}
              className={`flex items-center p-2.5 rounded-md w-full text-left transition-all duration-200 ${
                activeCategory === category.name
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => handleCategoryClick(category.name)}
            >
              {getCategoryIcon(category)}
              <span>{category.name}</span>
              <span className="ml-auto bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {category.count}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold mb-4">Priority</h2>
        <div className="space-y-1">
          {priorityCounts.map((priority) => (
            <button
              key={priority.name}
              className={`flex items-center p-2.5 rounded-md w-full text-left transition-all duration-200 ${
                activePriority === priority.name
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => handlePriorityClick(priority.name)}
            >
              <div className={`priority-indicator ${priority.color}`}></div>
              <span>{priority.name}</span>
              <span className="ml-auto bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {priority.count}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {completedCount > 0 && (
        <div>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={() => clearCompletedTasks()}
            disabled={isClearing}
          >
            {isClearing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                <span>Clearing...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Clear Completed Tasks ({completedCount})</span>
              </>
            )}
          </Button>
        </div>
      )}
      
      <div className="mt-6 rounded-lg overflow-hidden shadow-sm">
        <img 
          src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400" 
          alt="Productivity workspace with laptop" 
          className="w-full h-auto object-cover rounded-lg transform transition-transform duration-300 hover:scale-105" 
        />
      </div>
    </div>
  );

  // Mobile view with Drawer
  if (isMobile) {
    return (
      <div className="mb-4">
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" className="w-full flex items-center justify-between">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5">
                  <path d="M22 12H3" />
                  <path d="m2 12 3 3" />
                  <path d="m2 12 3-3" />
                  <path d="M3 5h11" />
                  <path d="M3 19h11" />
                </svg>
                Categories & Filters
              </div>
              <div className="flex space-x-1">
                {activeCategory !== "All" && (
                  <span className="bg-primary/10 text-primary text-xs py-1 px-2 rounded-full">
                    {activeCategory}
                  </span>
                )}
                {activePriority && (
                  <span className="bg-primary/10 text-primary text-xs py-1 px-2 rounded-full">
                    {activePriority}
                  </span>
                )}
              </div>
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="px-4 py-6">
              <SidebarContent />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }
  
  // Desktop view
  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-lg shadow-sm p-6 transition-all duration-300 hover:shadow-md">
        <SidebarContent />
      </div>
    </div>
  );
}
