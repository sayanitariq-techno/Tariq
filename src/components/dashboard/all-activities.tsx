
"use client";

import { useContext, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Play, Pause, CheckCircle2 } from "lucide-react"
import { DataContext } from "@/app/actions/data"
import type { Activity, ActivityStatus } from "@/types"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { HoldDialog } from '../activities/hold-dialog';
import { startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type ActivityFilter = 'all' | 'overdue' | 'today' | 'onHold' | 'upcoming';

function formatDuration(start: Date | undefined, end: Date | undefined): string {
    if (!start || !end || !(start instanceof Date) || !(end instanceof Date) || isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'N/A';
    }
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return 'N/A';

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
}

export function AllActivities() {
  const { activities, updateActivityStatus, formatDateTime, simulationDate } = useContext(DataContext);
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const { toast } = useToast();

  const filteredActivities = useMemo(() => {
    const incompleteActivities = activities
      .filter(activity => activity.status !== 'Completed')
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    
    if (filter === 'all') {
      return incompleteActivities;
    }

    const simDateStart = startOfDay(simulationDate);

    return incompleteActivities.filter(activity => {
        const deadlineStart = startOfDay(new Date(activity.deadline));
        switch (filter) {
            case 'onHold':
                return activity.status === 'On Hold';
            case 'overdue':
                return deadlineStart < simDateStart && activity.status !== 'On Hold';
            case 'today':
                return deadlineStart.getTime() === simDateStart.getTime() && activity.status !== 'On Hold';
            case 'upcoming':
                return deadlineStart > simDateStart && activity.status !== 'On Hold';
            default:
                return true;
        }
    });

  }, [activities, filter, simulationDate]);

  const handleStatusChange = (activity: Activity, status: ActivityStatus, reason?: string, remarks?: string) => {
    if (status === 'In Progress') {
      const tagActivities = activities
        .filter(a => a.packageName === activity.packageName && a.tag === activity.tag)
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
      
      const activityIndex = tagActivities.findIndex(a => a.id === activity.id);

      if (activityIndex > 0) {
        const previousActivity = tagActivities[activityIndex - 1];
        if (previousActivity.status !== 'Completed') {
          toast({
            title: "Prerequisite Not Met",
            description: `Cannot start "${activity.title}". Please complete the previous activity "${previousActivity.title}" first.`,
            variant: "destructive",
          });
          return;
        }
      }
    }
    updateActivityStatus(activity.id, status, reason, remarks);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">All Activities</CardTitle>
        <CardDescription>
          Filter and manage all incomplete activities.
        </CardDescription>
         <div className="flex items-center gap-2 pt-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
            <Button variant={filter === 'overdue' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('overdue')}>Overdue</Button>
            <Button variant={filter === 'today' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('today')}>Today</Button>
            <Button variant={filter === 'onHold' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('onHold')}>On Hold</Button>
            <Button variant={filter === 'upcoming' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('upcoming')}>Upcoming</Button>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
            <div className="max-h-[400px] overflow-y-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Activity Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Planned Start</TableHead>
                    <TableHead>Planned End</TableHead>
                    <TableHead>Planned Duration</TableHead>
                    <TableHead>Actual Start</TableHead>
                    <TableHead>Actual End</TableHead>
                    <TableHead>Actual Duration</TableHead>
                    <TableHead>Remark</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredActivities.length > 0 ? filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                        <TableCell className="font-medium">{activity.title}</TableCell>
                        <TableCell>
                            <span className={cn(
                                "font-semibold",
                                activity.status === "In Progress" && "text-blue-500",
                                activity.status === "On Hold" && "text-destructive",
                                activity.status === "Not Started" && "text-gray-500"
                            )}>{activity.status}</span>
                        </TableCell>
                        <TableCell className={cn(new Date(activity.deadline) < simulationDate && activity.status !== 'Completed' && "text-destructive")}>
                            {formatDateTime(activity.deadline)}
                        </TableCell>
                        <TableCell className={cn(new Date(activity.plannedEndDate) < simulationDate && activity.status !== 'Completed' && "text-destructive")}>
                            {formatDateTime(activity.plannedEndDate)}
                        </TableCell>
                        <TableCell>{formatDuration(activity.deadline, activity.plannedEndDate)}</TableCell>
                        <TableCell>{formatDateTime(activity.startTime)}</TableCell>
                        <TableCell>{formatDateTime(activity.endTime)}</TableCell>
                        <TableCell>{formatDuration(activity.startTime, activity.endTime)}</TableCell>
                        <TableCell>{activity.remark}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button onClick={() => handleStatusChange(activity, 'In Progress')} variant="ghost" size="icon" className={cn("h-8 w-8", activity.status === 'In Progress' && 'text-primary')}>
                                            <Play className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Start / In Progress</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HoldDialog activity={activity} onHoldConfirm={(activityId, status, reason, remarks) => handleStatusChange(activity, status, reason, remarks)}>
                                            <Button variant="ghost" size="icon" className={cn("h-8 w-8", activity.status === 'On Hold' && 'text-destructive')}>
                                                <Pause className="h-4 w-4" />
                                            </Button>
                                        </HoldDialog>
                                    </TooltipTrigger>
                                    <TooltipContent><p>On Hold</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button onClick={() => handleStatusChange(activity, 'Completed')} variant="ghost" size="icon" className="h-8 w-8 hover:text-green-600">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Complete</p></TooltipContent>
                                </Tooltip>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handleStatusChange(activity, 'Not Started')}>
                                            Reset to Not Started
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </TableCell>
                    </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                                No activities found for this filter.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
