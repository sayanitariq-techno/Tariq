
"use client";

import { useContext, useMemo } from "react";
import { DataContext } from "@/app/actions/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Activity, HoldEvent } from "@/types";

interface HoldSummary {
  totalDuration: number;
  count: number;
}

export function HoldLogDashboard() {
  const { activities, formatDateTime } = useContext(DataContext);

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


  return (
    <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
            <CardHeader>
                <CardTitle>Detailed Hold Log</CardTitle>
                 <CardDescription>A chronological record of all activities that have been put on hold.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="max-h-[60vh] overflow-y-auto">
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
  );
}
