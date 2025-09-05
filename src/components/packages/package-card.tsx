
"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Play, Pause, User, Eye, CheckCircle, Clock } from 'lucide-react';
import type { Package, Activity, ActivityStatus } from '@/types';
import { useContext, useMemo } from 'react';
import { DataContext } from '@/app/actions/data';
import { calculatePackageMetrics } from './utils';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { CircularProgress } from '../dashboard/circular-progress';

interface PackageCardProps {
  pkg: Package;
  activities: Activity[];
}

const ActivityStat = ({ value, label, color }: { value: number; label: string; color?: string }) => (
    <div className={cn("p-2 text-center rounded-lg", color)}>
        <p className="font-bold text-lg">{value}</p>
        <p className="text-xs">{label}</p>
    </div>
);

export function PackageCard({ pkg, activities }: PackageCardProps) {
  const { deletePackage, updateActivityStatus, formatDateTime } = useContext(DataContext);
  const metrics = calculatePackageMetrics(pkg, activities);

  const tagStats = useMemo(() => {
    if (activities.length === 0) {
      return { total: 0, done: 0, active: 0, hold: 0 };
    }

    const tags = activities.reduce((acc, activity) => {
      if (!acc[activity.tag]) {
        acc[activity.tag] = [];
      }
      acc[activity.tag].push(activity.status);
      return acc;
    }, {} as Record<string, ActivityStatus[]>);

    const total = Object.keys(tags).length;
    let done = 0;
    let active = 0;
    let hold = 0;

    for (const tag in tags) {
      const statuses = tags[tag];
      if (statuses.some(s => s === 'On Hold')) {
        hold++;
      } else if (statuses.some(s => s === 'In Progress')) {
        active++;
      } else if (statuses.every(s => s === 'Completed')) {
        done++;
      }
    }

    return { total, done, active, hold };
  }, [activities]);

  const handlePackageStatusChange = (status: 'start' | 'pause') => {
      // Find the first actionable activity
      const activityToUpdate = activities.find(a => (status === 'start' ? a.status === 'Not Started' : a.status === 'In Progress'));
      if (activityToUpdate) {
          const newStatus: ActivityStatus = status === 'start' ? 'In Progress' : 'On Hold';
          updateActivityStatus(activityToUpdate.id, newStatus, status === 'pause' ? 'Package Paused' : undefined, status === 'pause' ? 'Entire package put on hold.' : undefined);
      }
  };
  
  const getBorderColor = (status: ActivityStatus) => {
    switch (status) {
      case 'On Hold': return 'border-l-4 border-yellow-500';
      case 'In Progress': return 'border-l-4 border-blue-500';
      case 'Completed': return 'border-l-4 border-green-500';
      default: return 'border-l-4 border-gray-300';
    }
  };

  const getStatusBadgeVariant = (status: ActivityStatus) => {
     switch (status) {
      case 'On Hold': return 'destructive';
      case 'In Progress': return 'secondary';
      case 'Completed': return 'success';
      default: return 'outline';
    }
  };


  return (
    <Card className={cn("flex flex-col transition-all hover:shadow-xl hover:-translate-y-1", getBorderColor(metrics.status))}>
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
            <div className="flex-1 space-y-1 min-w-0">
                <CardTitle className="font-headline leading-tight truncate">{pkg.name}</CardTitle>
                <CardDescription className="line-clamp-2 text-xs">{pkg.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex flex-col items-end gap-1">
                    <Badge variant={getStatusBadgeVariant(metrics.status)} className={cn(metrics.status === 'In Progress' && 'bg-blue-500 text-white')}>{metrics.status}</Badge>
                    <Badge variant="outline" className={cn(
                            pkg.priority === 'High' && 'border-destructive text-destructive',
                            pkg.priority === 'Medium' && 'border-yellow-500 text-yellow-500',
                            pkg.priority === 'Low' && 'border-green-600 text-green-600'
                        )}>{pkg.priority} Priority</Badge>
                </div>
                 <CircularProgress value={metrics.progress} className="w-12 h-12 [&>svg>circle]:stroke-[6] [&>div>span]:text-xs" />
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        <div>
            <div className="flex justify-between items-center mb-1">
                 <span className="text-sm text-muted-foreground">Progress</span>
                 <span className="text-sm font-semibold">{metrics.progress.toFixed(0)}%</span>
            </div>
            <Progress value={metrics.progress} className={cn(metrics.progress === 100 && "[&>div]:bg-green-600")} />
        </div>
        
        <div className="grid grid-cols-4 gap-2">
            <ActivityStat value={tagStats.total} label="Total" color="bg-gray-100 dark:bg-gray-800" />
            <ActivityStat value={tagStats.done} label="Done" color="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" />
            <ActivityStat value={tagStats.active} label="Active" color="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200" />
            <ActivityStat value={tagStats.hold} label="Hold" color="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200" />
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Planned: {formatDateTime(pkg.startDate)} - {formatDateTime(pkg.endDate)}</span>
            </div>
             <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Started: {formatDateTime(metrics.actualStartDate)}</span>
            </div>
             <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Supervisor: {pkg.supervisor || 'N/A'}</span>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button asChild variant="outline" className="w-full">
            <Link href={`/packages/${pkg.id}`}><Eye /> View Details</Link>
        </Button>
        {metrics.status === 'In Progress' && (
            <Button variant="destructive" className="w-full" onClick={() => handlePackageStatusChange('pause')}><Pause /> Pause</Button>
        )}
        {metrics.status === 'Not Started' && (
            <Button className="w-full" onClick={() => handlePackageStatusChange('start')}><Play /> Start</Button>
        )}
         {metrics.status === 'Completed' && (
            <Button variant="default" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled><CheckCircle /> Completed</Button>
        )}
      </CardFooter>
    </Card>
  );
}
