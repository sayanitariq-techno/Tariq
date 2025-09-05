
"use client";

import { useContext, useMemo, useState } from 'react';
import { DataContext } from '@/app/actions/data';
import { PackageCard } from '@/components/packages/package-card';
import { EditPackageDialog } from '@/components/packages/edit-package-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, ListFilter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculatePackageMetrics } from '@/components/packages/utils';
import type { ActivityStatus, Priority } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const StatCard = ({ title, value, color }: { title: string; value: number; color: string }) => (
    <Card className={cn("border-l-4", color)}>
        <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </CardContent>
    </Card>
);

export default function PackagesPage() {
    const { packages, activities } = useContext(DataContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ActivityStatus | 'All'>('All');
    const [priorityFilter, setPriorityFilter] = useState<Priority | 'All'>('All');

    const packageWithMetrics = useMemo(() => {
        return packages.map(pkg => ({
            ...pkg,
            metrics: calculatePackageMetrics(pkg, activities.filter(a => a.packageName === pkg.id))
        }));
    }, [packages, activities]);
    
    const filteredPackages = useMemo(() => {
        return packageWithMetrics.filter(pkg => {
            const nameMatch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase());
            const statusMatch = statusFilter === 'All' || pkg.metrics.status === statusFilter;
            const priorityMatch = priorityFilter === 'All' || pkg.priority === priorityFilter;
            return nameMatch && statusMatch && priorityMatch;
        });
    }, [packageWithMetrics, searchTerm, statusFilter, priorityFilter]);

    const stats = useMemo(() => {
        const total = packageWithMetrics.length;
        const completed = packageWithMetrics.filter(p => p.metrics.status === 'Completed').length;
        const inProgress = packageWithMetrics.filter(p => p.metrics.status === 'In Progress').length;
        const onHold = packageWithMetrics.filter(p => p.metrics.status === 'On Hold').length;
        const notStarted = packageWithMetrics.filter(p => p.metrics.status === 'Not Started').length;
        return { total, completed, inProgress, onHold, notStarted };
    }, [packageWithMetrics]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Package Management</h1>
                    <p className="text-muted-foreground">Manage work packages and track their progress</p>
                </div>
                <EditPackageDialog>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> New Package
                    </Button>
                </EditPackageDialog>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <StatCard title="Total Packages" value={stats.total} color="border-primary" />
                <StatCard title="Completed" value={stats.completed} color="border-green-500" />
                <StatCard title="In Progress" value={stats.inProgress} color="border-blue-500" />
                <StatCard title="On Hold" value={stats.onHold} color="border-yellow-500" />
                <StatCard title="Not Started" value={stats.notStarted} color="border-gray-400" />
            </div>

            <Card>
                <CardContent className="p-4 flex flex-wrap items-center gap-4">
                    <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                        <Input 
                            placeholder="Search packages..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ListFilter className="h-4 w-4" />
                        <span>Filter by:</span>
                    </div>
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ActivityStatus | 'All')}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Status</SelectItem>
                            <SelectItem value="Not Started">Not Started</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="On Hold">On Hold</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as Priority | 'All')}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Priority</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                    </Select>
                    <Badge variant="secondary" className="ml-auto">{filteredPackages.length} packages</Badge>
                </CardContent>
            </Card>

            {filteredPackages.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPackages.map(pkg => (
                        <PackageCard key={pkg.id} pkg={pkg} activities={activities.filter(a => a.packageName === pkg.id)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No packages found matching your criteria.</p>
                </div>
            )}
        </div>
    );
}
