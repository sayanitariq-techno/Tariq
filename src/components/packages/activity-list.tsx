
"use client";

import { useContext, useMemo } from "react";
import { DataContext } from "@/app/actions/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Activity, ActivityStatus } from "@/types";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Play, Pause, CheckCircle2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EditActivityDialog } from "./edit-activity-dialog";
import { HoldDialog } from "../activities/hold-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useToast } from "@/hooks/use-toast";

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

interface ActivityListProps {
  activities: Activity[];
}

export function ActivityList({ activities: allActivitiesForTag }: ActivityListProps) {
  const { activities, deleteActivity, formatDateTime, updateActivityStatus } = useContext(DataContext);
  const { toast } = useToast();
  
  const sortedActivities = useMemo(() => {
    return [...allActivitiesForTag].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [allActivitiesForTag]);

  const handleStatusChange = (activity: Activity, status: ActivityStatus, reason?: string, remarks?: string) => {
    if (status === 'In Progress') {
        const activityIndex = sortedActivities.findIndex(a => a.id === activity.id);
        if (activityIndex > 0) {
            const previousActivity = sortedActivities[activityIndex - 1];
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

  if (sortedActivities.length === 0) {
    return <p className="text-center text-muted-foreground py-4">No activities found for this tag.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <TooltipProvider>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Activity Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Planned Start</TableHead>
                    <TableHead>Planned End</TableHead>
                    <TableHead>Actual Start</TableHead>
                    <TableHead>Actual End</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedActivities.map(activity => (
                    <TableRow key={activity.id}>
                        <TableCell className="font-medium">{activity.title}</TableCell>
                        <TableCell>
                             <Badge variant={
                                activity.status === 'Completed' ? 'success' : 
                                activity.status === 'On Hold' ? 'destructive' : 
                                activity.status === 'In Progress' ? 'secondary' : 
                                'outline'
                            }>
                                {activity.status}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <span className={cn(
                                activity.priority === 'High' && 'text-destructive',
                                activity.priority === 'Medium' && 'text-yellow-600',
                                activity.priority === 'Low' && 'text-green-600'
                            )}>{activity.priority}</span>
                        </TableCell>
                        <TableCell>{formatDateTime(activity.deadline)}</TableCell>
                        <TableCell>{formatDateTime(activity.plannedEndDate)}</TableCell>
                        <TableCell>{formatDateTime(activity.startTime)}</TableCell>
                        <TableCell>{formatDateTime(activity.endTime)}</TableCell>
                        <TableCell>{formatDuration(activity.startTime, activity.endTime)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {activity.status !== 'Completed' && (
                              <>
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
                              </>
                            )}
                           <AlertDialog>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <EditActivityDialog activity={activity}>
                                             <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
                                        </EditActivityDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">Delete</DropdownMenuItem>
                                        </AlertDialogTrigger>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the activity "{activity.title}".
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteActivity(activity.id)}>
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                           </AlertDialog>
                           </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </TooltipProvider>
    </div>
  );
}
