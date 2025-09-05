
"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Search, Clock } from "lucide-react";
import { Input } from "../ui/input";
import { DataContext } from "@/app/actions/data";

export function AppHeader({ title }: { title: string }) {
  const { activities, searchTerm, setSearchTerm, simulationDate, formatDateTime } = useContext(DataContext);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      // Find all activities that have a tag matching the search term
      const matchingActivities = activities.filter(a => a.tag.toLowerCase() === searchTerm.toLowerCase());
      
      if (matchingActivities.length > 0) {
        // Assuming all activities with the same tag belong to the same package
        const firstMatch = matchingActivities[0];
        const packageId = firstMatch.packageName;
        const tag = firstMatch.tag;

        // Navigate to the package page with the tag as a query parameter
        router.push(`/packages/${packageId}?openTag=${encodeURIComponent(tag)}`);
      }
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 sm:px-6 shadow-sm">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <h1 className="text-xl font-semibold font-headline">{title}</h1>
      <div className="flex items-center gap-4 ml-auto">
        <div className="flex items-center gap-2 text-sm font-medium text-primary-foreground bg-primary/80 px-3 py-1 rounded-full">
          <Clock className="h-4 w-4" />
          {isClient ? <span>{formatDateTime(simulationDate)}</span> : <span className="w-32 h-4 bg-muted rounded animate-pulse"></span>}
        </div>
        <div className="relative w-full max-w-sm hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search activities or tags..." 
            className="pl-8 sm:w-[300px] lg:w-[400px] bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
      </div>
    </header>
  );
}
