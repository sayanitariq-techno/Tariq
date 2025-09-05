
"use client";

import { useContext, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DataContext } from '@/app/actions/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, ArrowLeft, Download, FileUp, PlusCircle } from 'lucide-react';
import { PackageDetailTabs } from '@/components/packages/package-detail-tabs';
import { calculatePackageMetrics } from '@/components/packages/utils';
import { generatePackagePdf, generatePackageExcel } from '@/lib/reporting';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EditPackageDialog } from '@/components/packages/edit-package-dialog';
import { Progress } from '@/components/ui/progress';

export default function PackageDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { packages, activities, deletePackage, formatDateTime } = useContext(DataContext);

  const { pkg, pkgActivities, metrics, groupedActivities } = useMemo(() => {
    const packageId = Array.isArray(id) ? id[0] : id;
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return { pkg: null, pkgActivities: [], metrics: null, groupedActivities: {} };

    const pkgActivities = activities.filter(a => a.packageName === packageId);
    const metrics = calculatePackageMetrics(pkg, pkgActivities);

    const groupedActivities = pkgActivities.reduce((acc, activity) => {
        const { tag } = activity;
        if (!acc[tag]) acc[tag] = [];
        acc[tag].push(activity);
        return acc;
    }, {} as Record<string, typeof pkgActivities>);
    
    return { pkg, pkgActivities, metrics, groupedActivities };
  }, [id, packages, activities]);

  if (!pkg || !metrics) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Package not found or still loading...</p>
      </div>
    );
  }

  const handleDownloadPdf = () => generatePackagePdf(pkg, activities.filter(a => a.packageName === pkg.id), metrics, formatDateTime);
  const handleDownloadExcel = () => generatePackageExcel(pkg, groupedActivities, metrics, formatDateTime);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/packages')} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Packages
          </Button>
          <h1 className="text-2xl font-bold font-headline">{pkg.name}</h1>
          <p className="text-muted-foreground">{pkg.description}</p>
        </div>
        <div className="flex items-center gap-2">
           <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleDownloadPdf}>Download as PDF</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownloadExcel}>Download as Excel</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <EditPackageDialog pkg={pkg}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
                </EditPackageDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">Delete</DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
             <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this package?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the package "{pkg.name}" and all of its associated activities. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  deletePackage(pkg.id);
                  router.push('/packages');
                }}>
                  Confirm Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Package Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-semibold">{metrics.status}</p>
            </div>
             <div>
                <p className="text-muted-foreground">Progress</p>
                <div className="flex items-center gap-2">
                    <Progress value={metrics.progress} className="w-[70%]" />
                    <span className="font-semibold">{metrics.progress.toFixed(0)}%</span>
                </div>
            </div>
             <div>
                <p className="text-muted-foreground">Priority</p>
                <p className="font-semibold">{pkg.priority}</p>
            </div>
             <div>
                <p className="text-muted-foreground">Activities</p>
                <p className="font-semibold">{pkgActivities.length}</p>
            </div>
             <div>
                <p className="text-muted-foreground">Planned Start</p>
                <p className="font-semibold">{formatDateTime(pkg.startDate)}</p>
            </div>
            <div>
                <p className="text-muted-foreground">Planned End</p>
                <p className="font-semibold">{formatDateTime(pkg.endDate)}</p>
            </div>
             <div>
                <p className="text-muted-foreground">Actual Start</p>
                <p className="font-semibold">{formatDateTime(metrics.actualStartDate)}</p>
            </div>
            <div>
                <p className="text-muted-foreground">Actual End</p>
                <p className="font-semibold">{formatDateTime(metrics.actualEndDate)}</p>
            </div>
        </CardContent>
      </Card>

      <PackageDetailTabs groupedActivities={groupedActivities} packageId={pkg.id} />
    </div>
  );
}
