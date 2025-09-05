
"use client";

import { useContext, useMemo } from 'react';
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
import { DataContext } from "@/app/actions/data"
import type { Activity } from "@/types"
import { Badge } from '../ui/badge';
import { startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';


function getSource(activity: Activity, simulationDate: Date): string {
    if (activity.status === 'On Hold') return 'On Hold';
    
    const simDateStart = startOfDay(simulationDate);
    const deadlineStart = startOfDay(new Date(activity.deadline));

    if (deadlineStart < simDateStart) return 'Overdue';
    if (deadlineStart.getTime() === simDateStart.getTime()) return 'Today';
    return 'Upcoming';
}


export function RecentJobs() {
  const { activities, simulationDate } = useContext(DataContext);

  const inProgressActivities = useMemo(() => {
    return activities
      .filter(activity => activity.status === 'In Progress')
      .map(activity => ({
          ...activity,
          source: getSource(activity, simulationDate)
      }))
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [activities, simulationDate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Recent Jobs (In Progress)</CardTitle>
        <CardDescription>
          A list of all activities that are currently in progress.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="max-h-[400px] overflow-y-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Activity Title</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Source</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {inProgressActivities.length > 0 ? inProgressActivities.map((activity) => (
                <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.title}</TableCell>
                    <TableCell>{activity.packageName}</TableCell>
                    <TableCell className="font-mono text-xs">{activity.tag}</TableCell>
                    <TableCell>
                        <Badge 
                            variant="outline"
                            className={cn(
                                activity.source === 'Overdue' && 'border-destructive text-destructive',
                                activity.source === 'Today' && 'border-blue-500 text-blue-500',
                                activity.source === 'On Hold' && 'border-yellow-500 text-yellow-500'
                            )}
                        >
                            {activity.source}
                        </Badge>
                    </TableCell>
                </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            No activities are currently in progress.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  )
}
