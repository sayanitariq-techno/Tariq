
"use client"

import { useMemo, useContext, useState } from "react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataContext } from "@/app/actions/data";
import { differenceInDays, addDays, format, startOfDay } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Activity, Package } from "@/types";

export function SCurveChart() {
  const { activities, packages } = useContext(DataContext);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('all');

  const chartData = useMemo(() => {
    const relevantPackages = selectedPackageId === 'all'
        ? packages
        : packages.filter(p => p.id === selectedPackageId);

    if (relevantPackages.length === 0) return [];

    const relevantActivities = selectedPackageId === 'all'
        ? activities
        : activities.filter(a => a.packageName === selectedPackageId);

    if (relevantActivities.length === 0) return [];

    const allStartDates = relevantPackages.map(p => new Date(p.startDate).getTime()).filter(t => !isNaN(t));
    const allEndDates = relevantPackages.map(p => new Date(p.endDate).getTime()).filter(t => !isNaN(t));
    
    if (allStartDates.length === 0 || allEndDates.length === 0) return [];

    const projectStartDate = new Date(Math.min(...allStartDates));
    const projectEndDate = new Date(Math.max(...allEndDates));

    const totalDurationDays = differenceInDays(projectEndDate, projectStartDate);
    const totalActivities = relevantActivities.length;
    
    if (totalDurationDays <= 0 || totalActivities === 0) return [];

    const step = Math.max(1, Math.round(totalDurationDays / 30)); 
    const data = [];

    for (let i = 0; i <= totalDurationDays; i += step) {
      const currentDate = addDays(projectStartDate, i);
      const dayStart = startOfDay(currentDate);

      const plannedActivitiesCount = relevantActivities.filter(j => startOfDay(new Date(j.deadline)) <= dayStart).length;
      const completedActivitiesCount = relevantActivities.filter(
        j => j.status === 'Completed' && j.endTime && startOfDay(new Date(j.endTime)) <= dayStart
      ).length;

      data.push({
        name: format(currentDate, 'MMM d'),
        planned: (plannedActivitiesCount / totalActivities) * 100,
        completed: (completedActivitiesCount / totalActivities) * 100,
      });
    }

    const lastDayData = data[data.length - 1];
    if (lastDayData && lastDayData.name !== format(projectEndDate, 'MMM d')) {
         const plannedActivitiesCount = totalActivities;
         const completedActivitiesCount = relevantActivities.filter(j => j.status === 'Completed').length;
        data.push({
            name: format(projectEndDate, 'MMM d'),
            planned: (plannedActivitiesCount / totalActivities) * 100,
            completed: (completedActivitiesCount / totalActivities) * 100,
        });
    }

    return data;

  }, [activities, packages, selectedPackageId]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="font-headline">S-Curve</CardTitle>
                <CardDescription>Planned vs. Completed progress over the project timeline.</CardDescription>
            </div>
            <div className="w-[200px]">
                 <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a package" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Packages</SelectItem>
                        {packages.map(pkg => (
                            <SelectItem key={pkg.id} value={pkg.id}>{pkg.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
      </CardHeader>
      <CardContent className="pl-2 flex-grow">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
               <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, '']}
              />
              <Legend />
              <Line type="monotone" dataKey="planned" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Planned" dot={false} />
              <Line type="monotone" dataKey="completed" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Completed" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No data to display for the selected package.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
