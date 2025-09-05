

"use client";

import { useContext, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DataContext } from "@/app/actions/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateAdvancedReportPdf, type AdvancedReportData, calculateDashboardStats } from "@/lib/reporting";
import { FileDown } from "lucide-react";
import { Separator } from "../ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { cn } from "@/lib/utils";
import type { Activity, ActivityStatus, Package, HoldEvent } from "@/types";

const reportSchema = z.object({
  projectName: z.string().min(1, "Project Name is required"),
  projectManager: z.string().min(1, "Project Manager is required"),
  statusUpdateDate: z.string(),
  projectClientNumber: z.string().optional(),
  requiredSupport: z.array(z.object({ value: z.string() })).optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface HoldSummary {
  totalDuration: number;
  count: number;
}

function calculatePackageStatus(packageActivities: Activity[]): ActivityStatus {
    if (packageActivities.length === 0) return 'Not Started';
    const total = packageActivities.length;
    const completed = packageActivities.filter(a => a.status === 'Completed').length;
    const onHold = packageActivities.some(a => a.status === 'On Hold');
    const inProgress = packageActivities.some(a => a.status === 'In Progress');

    if (completed === total) return 'Completed';
    if (onHold) return 'On Hold';
    if (inProgress || completed > 0) return 'In Progress';
    return 'Not Started';
}


export function ReportGenerator() {
  const { packages, activities, formatDateTime, simulationDate } = useContext(DataContext);

  const stats = useMemo(() => {
    return calculateDashboardStats({ activities, packages, simulationDate });
  }, [activities, packages, simulationDate, formatDateTime]);

  const packageMetrics = useMemo(() => {
    return packages.map(pkg => {
      const packageActivities = activities.filter(a => a.packageName === pkg.id);
      const progress = packageActivities.length > 0
        ? Math.round((packageActivities.filter(a => a.status === 'Completed').length / packageActivities.length) * 100)
        : 0;
      const status = calculatePackageStatus(packageActivities);
      
      const startTimes = packageActivities.map(a => a.startTime).filter(Boolean) as Date[];
      const endTimes = packageActivities.map(a => a.endTime).filter(Boolean) as Date[];
      
      const actualStartDate = startTimes.length > 0 ? new Date(Math.min(...startTimes.map(d => d.getTime()))) : null;
      const actualEndDate = (progress === 100 && endTimes.length > 0) ? new Date(Math.max(...endTimes.map(d => d.getTime()))) : null;

      return { ...pkg, progress, status, actualStartDate, actualEndDate };
    });
  }, [packages, activities]);

  const { holdLog, holdSummary } = useMemo(() => {
    const log: (HoldEvent & { activity: Activity })[] = [];
    const summaryMap = new Map<string, HoldSummary>();

    activities.forEach(activity => {
      if (activity.holdHistory) {
        activity.holdHistory.forEach(hold => {
          log.push({ ...hold, activity });

          const duration = (hold.endTime ? hold.endTime.getTime() : new Date().getTime()) - hold.startTime.getTime();
          const currentSummary = summaryMap.get(hold.reason) || { totalDuration: 0, count: 0 };
          
          summaryMap.set(hold.reason, {
            totalDuration: currentSummary.totalDuration + duration,
            count: currentSummary.count + 1,
          });
        });
      }
    });

    log.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    const summary = Array.from(summaryMap.entries())
        .map(([reason, data]) => ({ reason, ...data}))
        .sort((a, b) => b.totalDuration - a.totalDuration);

    return { holdLog: log, holdSummary: summary };
  }, [activities]);

  const formatDuration = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || result === '') result += `${minutes}m`;
    
    return result.trim();
  };

  const { register, handleSubmit, control, formState: { errors } } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      projectName: "Shutdown & Turnaround Project",
      projectManager: "John Doe",
      statusUpdateDate: new Date().toLocaleDateString('en-CA'),
      requiredSupport: [{ value: "" }],
    },
  });

  const { fields: supportFields, append: appendSupport, remove: removeSupport } = useFieldArray({ control, name: "requiredSupport" });

  const onSubmit = (data: ReportFormData) => {
    const reportData: AdvancedReportData = {
      ...data,
      projectSummary: {
        ...stats,
        actualProgress: stats.actualProgress,
        plannedProgress: stats.plannedProgress,
        scheduleVarianceHours: `${stats.scheduleVarianceHours.toFixed(0)} hours`,
        plannedStartDate: formatDateTime(stats.plannedStartDate),
        plannedEndDate: formatDateTime(stats.plannedEndDate),
        actualStartDate: formatDateTime(stats.actualStartDate),
        estimatedEndDate: formatDateTime(stats.estimatedEndDate),
        completedActivities: stats.completedActivitiesList.length,
        delayedActivities: stats.delayedActivities.length,
        onTrackActivities: stats.onTrackActivitiesList.length,
        upcomingActivities: stats.upcomingActivitiesList.length,
      },
      packageDetails: packageMetrics.map(p => ({
        name: p.name,
        description: p.description || '',
        status: p.status,
        progress: `${p.progress}%`,
        priority: p.priority,
        startDate: formatDateTime(p.startDate),
        endDate: formatDateTime(p.endDate),
        actualStartDate: formatDateTime(p.actualStartDate),
        actualEndDate: formatDateTime(p.actualEndDate),
      })),
      holdLog: holdLog,
      holdSummary: holdSummary,
    };
    generateAdvancedReportPdf(reportData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="projectName">Project Name</Label>
            <Input id="projectName" {...register("projectName")} />
            {errors.projectName && <p className="text-xs text-destructive">{errors.projectName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="projectManager">Project Manager</Label>
            <Input id="projectManager" {...register("projectManager")} />
            {errors.projectManager && <p className="text-xs text-destructive">{errors.projectManager.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="statusUpdateDate">Status Update Date</Label>
            <Input id="statusUpdateDate" type="date" {...register("statusUpdateDate")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="projectClientNumber">Project Client Number</Label>
            <Input id="projectClientNumber" {...register("projectClientNumber")} />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Project Summary</CardTitle>
          <CardDescription>Automatically populated from the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex justify-around items-center text-center">
                <div>
                    <p className="text-2xl font-bold">{stats.actualProgress.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Actual Progress</p>
                </div>
                <div>
                    <p className="text-2xl font-bold">{stats.plannedProgress.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Planned Progress</p>
                </div>
            </div>
             <div className="grid grid-cols-2 gap-y-4 text-sm text-center">
                <div>
                    <p className="font-bold text-lg">{stats.completedActivitiesList.length}</p>
                    <p className="text-xs text-muted-foreground">Completed Activities</p>
                </div>
                <div>
                    <p className="font-bold text-lg text-red-500">{stats.delayedActivities.length}</p>
                    <p className="text-xs text-muted-foreground">Delayed Activities</p>
                </div>
                <div>
                    <p className="font-bold text-lg">{stats.onTrackActivitiesList.length}</p>
                    <p className="text-xs text-muted-foreground">On Track Activities</p>
                </div>
                <div>
                    <p className="font-bold text-lg">{stats.upcomingActivitiesList.length}</p>
                    <p className="text-xs text-muted-foreground">Upcoming Activities</p>
                </div>
            </div>

            <div className="text-center">
                <p className="font-bold text-lg">{stats.scheduleVarianceHours.toFixed(0)} hours</p>
                <p className="text-xs text-muted-foreground">Gain/Loss in Critical Path</p>
            </div>

            <Separator />
            
             <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                    <p className="font-semibold">{formatDateTime(stats.plannedStartDate)}</p>
                    <p className="text-xs text-muted-foreground">Planned Start Date/Time</p>
                </div>
                <div>
                    <p className="font-semibold">{formatDateTime(stats.plannedEndDate)}</p>
                    <p className="text-xs text-muted-foreground">Planned End Date/Time</p>
                </div>
                <div>
                    <p className="font-semibold">{formatDateTime(stats.actualStartDate)}</p>
                    <p className="text-xs text-muted-foreground">Actual Start Date/Time</p>
                </div>
                <div>
                    <p className="font-semibold">{formatDateTime(stats.estimatedEndDate)}</p>
                    <p className="text-xs text-muted-foreground">Estimated End Date/Time</p>
                </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Package Details</CardTitle>
          <CardDescription>A summary of all work packages in the project.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Package Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Progress</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {packageMetrics.map(pkg => (
                        <TableRow key={pkg.id}>
                            <TableCell>
                                <div className="font-medium">{pkg.name}</div>
                                <div className="text-xs text-muted-foreground">{pkg.description}</div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={pkg.status === 'Completed' ? 'default' : (pkg.status === 'On Hold' ? 'destructive' : 'secondary')}>{pkg.status}</Badge>
                            </TableCell>
                             <TableCell>
                                <Badge variant="outline" className={cn(
                                    pkg.priority === 'High' && 'border-red-500 text-red-500',
                                    pkg.priority === 'Medium' && 'border-yellow-500 text-yellow-500',
                                    pkg.priority === 'Low' && 'border-green-500 text-green-500'
                                )}>{pkg.priority}</Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Progress value={pkg.progress} className="w-24" />
                                    <span className="text-xs text-muted-foreground">{pkg.progress}%</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
            <CardHeader>
                <CardTitle>Detailed Hold Log</CardTitle>
                 <CardDescription>A chronological record of all activities that have been put on hold.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="max-h-[300px] overflow-y-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Activity</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Start Time</TableHead>
                            <TableHead>End Time</TableHead>
                            <TableHead>Duration</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {holdLog.length > 0 ? holdLog.map((log, index) => (
                            <TableRow key={index}>
                            <TableCell className="font-medium">
                                <div>{log.activity.title}</div>
                                <div className="text-xs text-muted-foreground">{log.activity.packageName}</div>
                            </TableCell>
                            <TableCell>
                                <div>{log.reason}</div>
                                <div className="text-xs text-muted-foreground italic">{log.remarks}</div>
                            </TableCell>
                            <TableCell>{formatDateTime(log.startTime)}</TableCell>
                            <TableCell>{log.endTime ? formatDateTime(log.endTime) : <Badge variant="outline">Ongoing</Badge>}</TableCell>
                            <TableCell>{formatDuration((log.endTime ? log.endTime.getTime() : new Date().getTime()) - log.startTime.getTime())}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">No hold events recorded.</TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Hold Reason Summary</CardTitle>
                    <CardDescription>Total time lost and frequency for each hold reason.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Reason</TableHead>
                                <TableHead className="text-right">Total Time</TableHead>
                                <TableHead className="text-right">Count</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {holdSummary.length > 0 ? holdSummary.map(item => (
                                <TableRow key={item.reason}>
                                    <TableCell className="font-medium">{item.reason}</TableCell>
                                    <TableCell className="text-right">{formatDuration(item.totalDuration)}</TableCell>
                                    <TableCell className="text-right">{item.count}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">No holds to analyze.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>Required Support by the Customer</CardTitle>
          <CardDescription>List items where support from the client is needed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {supportFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <span className="font-mono text-sm">{index + 1}.</span>
              <Input {...register(`requiredSupport.${index}.value`)} placeholder={`Support item #${index + 1}`} />
              <Button type="button" variant="ghost" size="sm" onClick={() => removeSupport(index)}>Remove</Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => appendSupport({ value: "" })}>Add Support Item</Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg">
          <FileDown className="mr-2" />
          Generate Report
        </Button>
      </div>
    </form>
  );
}
