import { useState } from "react";
import { TaskFilter, CategoryCount, PriorityCount } from "@/types";

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

  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Categories</h2>
        
        <div className="space-y-3">
          {categoryCounts.map((category) => (
            <button
              key={category.name}
              className={`flex items-center p-2 rounded-md w-full text-left ${
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
        
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Priority</h2>
          <div className="space-y-3">
            {priorityCounts.map((priority) => (
              <button
                key={priority.name}
                className={`flex items-center p-2 rounded-md w-full text-left ${
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
        
        <div className="mt-8 rounded-lg overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400" 
            alt="Productivity workspace with laptop" 
            className="w-full h-auto object-cover rounded-lg" 
          />
        </div>
      </div>
    </div>
  );
}
