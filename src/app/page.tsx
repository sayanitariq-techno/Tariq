
"use client";

import { useContext } from 'react';
import { StatsCard } from "@/components/dashboard/stats-card";
import { AllActivities } from "@/components/dashboard/all-activities";
import { SCurveChart } from "@/components/dashboard/s-curve-chart";
import { RecentJobs } from "@/components/dashboard/recent-jobs";
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataContext } from './actions/data';
import { generateDashboardPdf, generateDashboardExcel } from '@/lib/reporting';


export default function DashboardPage() {
  const { activities, packages, simulationDate, formatDateTime } = useContext(DataContext);
  
  const handleDownloadPdf = () => {
    generateDashboardPdf({ activities, packages, simulationDate, formatDateTime });
  };

  const handleDownloadExcel = () => {
    generateDashboardExcel({ activities, packages, simulationDate, formatDateTime });
  };


  return (
    <div className="flex flex-col gap-6">
       <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-headline">Dashboard</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download Reports
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleDownloadPdf}>Download as PDF</DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadExcel}>Download as Excel</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-1">
          <StatsCard />
        </div>
        <div className="md:col-span-1">
           <SCurveChart />
        </div>
      </div>
       <div>
        <RecentJobs />
      </div>
      <div>
        <AllActivities />
      </div>
    </div>
  );
}
