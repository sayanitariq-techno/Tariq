
"use client";

import { useContext, useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataContext } from '@/app/actions/data';
import { CircularProgress } from './circular-progress';
import { ActivityListDialog } from './job-list-dialog';
import type { Activity } from '@/types';
import { Separator } from '../ui/separator';
import { startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { calculateDashboardStats } from '@/lib/reporting';
import { predictEndDate } from '@/ai/flows/predict-end-date-flow';
import { Skeleton } from '../ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Sparkles } from 'lucide-react';

type DialogState = {
  isOpen: boolean;
  title: string;
  description: string;
  activities: Activity[];
}

export function StatsCard() {
    const { activities, packages, simulationDate, formatDateTime } = useContext(DataContext);
    const [dialogState, setDialogState] = useState<DialogState>({ isOpen: false, title: '', description: '', activities: [] });
    const [isClient, setIsClient] = useState(false);
    const [estimatedEndDate, setEstimatedEndDate] = useState<Date | null>(null);
    const [isEstimating, setIsEstimating] = useState(false);
    const [aiReasoning, setAiReasoning] = useState<string | null>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    const stats = useMemo(() => {
        return calculateDashboardStats({ activities, packages, simulationDate });
    }, [activities, packages, simulationDate, formatDateTime]);

    useEffect(() => {
      const getAiPrediction = async () => {
        // Only run prediction when progress is between 5% and 95%
        if (stats.actualProgress > 5 && stats.actualProgress < 95 && !isEstimating) {
          setIsEstimating(true);
          setAiReasoning(null);
          try {
            const result = await predictEndDate({ packages, activities, simulationDate });
            setEstimatedEndDate(new Date(result.predictedDate));
            setAiReasoning(result.reasoning);
          } catch (error) {
            console.error("AI prediction failed:", error);
            // Fallback to formula if AI fails
            setEstimatedEndDate(stats.estimatedEndDate);
          } finally {
            setIsEstimating(false);
          }
        } else {
            // Use formula-based estimation outside the 5-95% range
            setEstimatedEndDate(stats.estimatedEndDate);
            setAiReasoning(null);
        }
      };

      getAiPrediction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stats.actualProgress]); // Rerun only when progress changes significantly


    const handleStatClick = (title: string, description: string, activities: Activity[]) => {
        setDialogState({ isOpen: true, title, description, activities });
    };

    const getVarianceColor = () => {
        if (stats.scheduleVarianceHours > 1) return 'text-green-600'; // Ahead by more than an hour
        if (stats.scheduleVarianceHours < -1) return 'text-destructive'; // Behind by more than an hour
        return 'text-foreground';
    }
    
    const getProgressColor = () => {
        const difference = stats.actualProgress - stats.plannedProgress;
        if (difference > 2) return 'hsl(var(--chart-2))'; // Green for ahead
        if (difference < -2) return 'hsl(var(--destructive))'; // Red for behind
        return '#00539B'; // Dark Blue for on-track
    };


    const renderDateTime = (date: Date | null | undefined) => {
        if (!isClient) {
            return <div className="w-32 h-4 bg-muted rounded animate-pulse inline-block"></div>;
        }
        return formatDateTime(date);
    };

    const renderStatsValue = (value: string | number, className: string = '') => {
        if(!isClient) {
            return <div className="w-12 h-6 bg-muted rounded animate-pulse inline-block"></div>
        }
        return <p className={cn("font-bold text-lg", className)}>{value}</p>
    }


    return (
        <>
            <Card className="h-full flex flex-col shadow-lg border-primary/20 border">
                <CardHeader>
                    <CardTitle className="font-headline">Project Summary</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between space-y-6">
                    <div className="flex justify-around items-center text-center">
                        <div className="flex flex-col items-center">
                            <CircularProgress value={isClient ? stats.actualProgress : 0} color={isClient ? getProgressColor() : undefined} />
                             <p className="mt-2 text-sm font-semibold">{isClient ? `${stats.actualProgress.toFixed(2)}%` : '...'}</p>
                            <p className="text-xs text-muted-foreground">Actual Progress</p>
                        </div>
                         <div className="flex flex-col items-center">
                            <CircularProgress value={isClient ? stats.plannedProgress : 0} color="#00539B" />
                            <p className="mt-2 text-sm font-semibold">{isClient ? `${stats.plannedProgress.toFixed(2)}%` : '...'}</p>
                            <p className="text-xs text-muted-foreground">Planned Progress</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                        <div
                            className="cursor-pointer"
                            onClick={() => handleStatClick("Completed Activities", "These activities have been successfully completed.", stats.completedActivitiesList)}
                        >
                            {renderStatsValue(stats.completedActivitiesList.length, "text-green-600")}
                            <p className="text-xs text-muted-foreground">Completed Activities</p>
                        </div>
                         <div 
                            className="cursor-pointer"
                            onClick={() => handleStatClick("Delayed Activities", "These activities are past their deadline and not yet completed.", stats.delayedActivities)}
                        >
                            {renderStatsValue(stats.delayedActivities.length, "text-destructive")}
                            <p className="text-xs text-muted-foreground">Delayed Activities</p>
                        </div>
                        <div
                             className="cursor-pointer"
                             onClick={() => handleStatClick("On Track Activities", "These activities are currently in progress or on hold.", stats.onTrackActivitiesList)}
                        >
                             {renderStatsValue(stats.onTrackActivitiesList.length, "text-blue-500")}
                            <p className="text-xs text-muted-foreground">On Track Activities</p>
                        </div>
                        <div
                             className="cursor-pointer"
                             onClick={() => handleStatClick("Upcoming Activities", "These activities have not yet started and are scheduled for the future.", stats.upcomingActivitiesList)}
                        >
                            {renderStatsValue(stats.upcomingActivitiesList.length)}
                            <p className="text-xs text-muted-foreground">Upcoming Activities</p>
                        </div>
                    </div>

                    <div>
                        {isClient ? (
                            <div className={cn("font-bold text-lg", getVarianceColor())}>{stats.scheduleVarianceHours.toFixed(0)} hours</div>
                        ) : (
                            <div className="w-24 h-6 bg-muted rounded animate-pulse inline-block"></div>
                        )}
                        <p className="text-xs text-muted-foreground">Gain/Loss in Critical Path</p>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                        <div>
                            <div className="font-semibold">{renderDateTime(stats.plannedStartDate)}</div>
                            <p className="text-xs text-muted-foreground">Planned Start Date/Time</p>
                        </div>
                         <div>
                            <div className="font-semibold">{renderDateTime(stats.plannedEndDate)}</div>
                            <p className="text-xs text-muted-foreground">Planned End Date/Time</p>
                        </div>
                        <div>
                           <div className="font-semibold">{renderDateTime(stats.actualStartDate)}</div>
                            <p className="text-xs text-muted-foreground">Actual Start Date/Time</p>
                        </div>
                        <div>
                           <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="font-semibold flex items-center gap-1.5">
                                        {isEstimating ? <Skeleton className="h-5 w-32" /> : renderDateTime(estimatedEndDate)}
                                        {aiReasoning && <Sparkles className="h-4 w-4 text-primary" />}
                                    </div>
                                </TooltipTrigger>
                                {aiReasoning && (
                                    <TooltipContent>
                                        <p className="max-w-xs text-sm">{aiReasoning}</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                           </TooltipProvider>
                            <p className="text-xs text-muted-foreground">Estimated End Date/Time</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <ActivityListDialog 
                isOpen={dialogState.isOpen}
                onOpenChange={(isOpen) => setDialogState(prev => ({ ...prev, isOpen }))}
                title={dialogState.title}
                description={dialogState.description}
                activities={dialogState.activities}
            />
        </>
    );
}
