

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Activity, HoldEvent, Package, ActivityStatus, Priority } from '@/types';
import { startOfDay } from 'date-fns';

// Standalone date formatting utility
function standaloneFormatDateTime(date: Date | null | undefined): string {
    if (!date || isNaN(new Date(date).getTime())) {
        return 'N/A';
    }
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
    }).format(new Date(date));
}


// Helper function to format duration
function formatDuration(milliseconds: number): string {
    if (isNaN(milliseconds) || milliseconds < 0) return 'N/A';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || result === '') result += `${minutes}m`;
    
    return result.trim();
}

function formatDurationFromDates(start: Date | undefined, end: Date | undefined): string {
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;

    if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 'N/A';
    }
    
    const diffMs = endDate.getTime() - startDate.getTime();
    return formatDuration(diffMs);
}


// --- DASHBOARD REPORTING ---

interface DashboardReportData {
    activities: Activity[];
    packages: Package[];
    simulationDate: Date;
    formatDateTime: (date: Date | null | undefined) => string;
}

export const calculateDashboardStats = (data: Omit<DashboardReportData, 'formatDateTime'>) => {
    const { activities, packages, simulationDate } = data;
    const totalActivities = activities.length;

     const emptyStats = {
        actualProgress: 0,
        plannedProgress: 0,
        completedActivitiesList: [],
        delayedActivities: [],
        onTrackActivitiesList: [],
        upcomingActivitiesList: [],
        scheduleVarianceHours: 0,
        plannedStartDate: null,
        plannedEndDate: null,
        actualStartDate: null,
        estimatedEndDate: null,
    };

    if (totalActivities === 0 || packages.length === 0) {
        return emptyStats;
    }
    
    const allStartDates = packages.map(p => new Date(p.startDate).getTime()).filter(t => !isNaN(t));
    const allEndDates = packages.map(p => new Date(p.endDate).getTime()).filter(t => !isNaN(t));

    if (allStartDates.length === 0 || allEndDates.length === 0) {
        return emptyStats;
    }

    const plannedStartDate = new Date(Math.min(...allStartDates));
    const plannedEndDate = new Date(Math.max(...allEndDates));

    const completedActivitiesList = activities.filter(j => j.status === 'Completed');
    const actualProgress = (completedActivitiesList.length / totalActivities) * 100;

    let plannedProgress = 0;
    const totalDuration = plannedEndDate.getTime() - plannedStartDate.getTime();
    if (totalDuration > 0) {
        const elapsedDuration = simulationDate.getTime() - plannedStartDate.getTime();
        plannedProgress = Math.max(0, Math.min(100, (elapsedDuration / totalDuration) * 100));
    } else if (simulationDate > plannedEndDate) {
        plannedProgress = 100;
    }
    
    const delayedActivities = activities.filter(j => new Date(j.deadline) < simulationDate && j.status !== 'Completed');
    const inProgressActivities = activities.filter(j => j.status === 'In Progress');
    const onHoldActivities = activities.filter(j => j.status === 'On Hold');
    const onTrackActivitiesList = [...inProgressActivities, ...onHoldActivities];
    const upcomingActivitiesList = activities.filter(j => j.status === 'Not Started' && startOfDay(new Date(j.deadline)) >= startOfDay(simulationDate));

    const actualActivityStartTimes = activities
        .map(j => j.startTime ? new Date(j.startTime).getTime() : null)
        .filter((t): t is number => t !== null);

    const actualStartDate = actualActivityStartTimes.length > 0 ? new Date(Math.min(...actualActivityStartTimes)) : null;
    
    let estimatedEndDate: Date | null = null;
    if (actualProgress === 100) {
        const actualEndTimes = completedActivitiesList
            .map(j => j.endTime ? new Date(j.endTime).getTime() : null)
            .filter((t): t is number => t !== null);
        if (actualEndTimes.length > 0) {
            estimatedEndDate = new Date(Math.max(...actualEndTimes));
        }
    } else if (actualProgress > 0 && totalDuration > 0 && actualStartDate) {
        const elapsedSinceStart = simulationDate.getTime() - actualStartDate.getTime();
        const performanceFactor = actualProgress / plannedProgress; // Simplified: work done / work planned

        if (performanceFactor > 0) {
            const totalEstimatedDuration = elapsedSinceStart / (actualProgress / 100);
            estimatedEndDate = new Date(actualStartDate.getTime() + totalEstimatedDuration);
        } else {
             estimatedEndDate = plannedEndDate;
        }

    } else { // actualProgress is 0 or project has no duration
        estimatedEndDate = plannedEndDate;
    }

    let scheduleVarianceHours = 0;
    if (plannedEndDate && estimatedEndDate) {
        const varianceMillis = plannedEndDate.getTime() - estimatedEndDate.getTime();
        scheduleVarianceHours = varianceMillis / (1000 * 60 * 60);
    }

    return {
        actualProgress, plannedProgress, completedActivitiesList, delayedActivities, onTrackActivitiesList,
        upcomingActivitiesList, scheduleVarianceHours, plannedStartDate, plannedEndDate, actualStartDate, estimatedEndDate
    };
};

export const generateDashboardPdf = (data: DashboardReportData) => {
    const { formatDateTime: formatDateTimeFromContext, simulationDate, activities, packages } = data;
    const stats = calculateDashboardStats(data);
    const doc = new jsPDF();
    let lastY = 15;

    // --- Header ---
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Dashboard Report', 14, lastY);
    lastY += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Report generated on: ${formatDateTimeFromContext(new Date())} | Simulation Date: ${formatDateTimeFromContext(simulationDate)}`, 14, lastY);
    lastY += 10;
    
    // --- Project Summary Card ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Project Summary', 14, lastY);
    lastY += 6;

    autoTable(doc, {
        startY: lastY,
        body: [
            [
                { content: `Actual Progress: ${stats.actualProgress.toFixed(1)}%`, styles: { halign: 'left', cellPadding: 2, fontSize: 10 } },
                { content: `Planned Progress: ${stats.plannedProgress.toFixed(1)}%`, styles: { halign: 'left', cellPadding: 2, fontSize: 10 } },
            ],
             [
                { content: `Completed: ${stats.completedActivitiesList.length}`, styles: { halign: 'left', cellPadding: 2 } },
                { content: `Delayed: ${stats.delayedActivities.length}`, styles: { halign: 'left', cellPadding: 2, textColor: [255, 0, 0] } },
            ],
            [
                { content: `On Track: ${stats.onTrackActivitiesList.length}`, styles: { halign: 'left', cellPadding: 2 } },
                { content: `Upcoming: ${stats.upcomingActivitiesList.length}`, styles: { halign: 'left', cellPadding: 2 } },
            ],
             [
                { content: `Gain/Loss: ${stats.scheduleVarianceHours.toFixed(0)} hours`, colSpan: 2, styles: { halign: 'left', cellPadding: 2 } },
            ],
            [
                { content: `Planned Start: ${formatDateTimeFromContext(stats.plannedStartDate)}`, styles: { halign: 'left', cellPadding: 2 } },
                { content: `Planned End: ${formatDateTimeFromContext(stats.plannedEndDate)}`, styles: { halign: 'left', cellPadding: 2 } },
            ],
            [
                { content: `Actual Start: ${formatDateTimeFromContext(stats.actualStartDate)}`, styles: { halign: 'left', cellPadding: 2 } },
                { content: `Estimated End: ${formatDateTimeFromContext(stats.estimatedEndDate)}`, styles: { halign: 'left', cellPadding: 2 } },
            ],
        ],
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 1 }
    });
    lastY = (doc as any).lastAutoTable.finalY + 15;
    
    // Recent Jobs (In Progress)
    const inProgress = activities.filter(a => a.status === 'In Progress');
    if (inProgress.length > 0) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Recent Jobs (In Progress)', 14, lastY);
        lastY += 8;
        autoTable(doc, {
            startY: lastY,
            head: [['Package', 'Tag', 'Activity Title']],
            body: inProgress.map(a => [
                packages.find(p => p.id === a.packageName)?.name || a.packageName,
                a.tag,
                a.title
            ]),
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] }
        });
        lastY = (doc as any).lastAutoTable.finalY + 15;
    }

    // --- Hold Log ---
    const holdLogData: (HoldEvent & { activityTitle: string; packageName: string })[] = [];
    activities.forEach(activity => {
        if (activity.holdHistory) {
            activity.holdHistory.forEach(hold => {
                holdLogData.push({ ...hold, activityTitle: activity.title, packageName: packages.find(p => p.id === activity.packageName)?.name || '' });
            });
        }
    });

    if (holdLogData.length > 0) {
        if (lastY > 250) { doc.addPage(); lastY = 15; }
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Hold Log', 14, lastY);
        lastY += 8;
        autoTable(doc, {
            startY: lastY,
            head: [['Package', 'Activity', 'Reason', 'Start', 'End', 'Duration']],
            body: holdLogData.map(h => [
                h.packageName,
                h.activityTitle,
                h.reason,
                formatDateTimeFromContext(h.startTime),
                h.endTime ? formatDateTimeFromContext(h.endTime) : 'Ongoing',
                formatDuration((h.endTime ? new Date(h.endTime).getTime() : new Date().getTime()) - new Date(h.startTime).getTime())
            ]),
            theme: 'striped',
            headStyles: { fillColor: [231, 76, 60] }
        });
        lastY = (doc as any).lastAutoTable.finalY + 15;
    }

    // --- Package-wise Details ---
    packages.forEach(pkg => {
        const pkgActivities = activities.filter(a => a.packageName === pkg.id);
        if (pkgActivities.length === 0) return;

        if (lastY > 250) { // Add new page if content is too long
            doc.addPage();
            lastY = 15;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`Package: ${pkg.name}`, 14, lastY);
        lastY += 8;

        autoTable(doc, {
            startY: lastY,
            head: [['Tag', 'Activity Title', 'Status', 'Planned Start', 'Planned End']],
            body: pkgActivities.map(a => [
                a.tag,
                a.title,
                a.status,
                formatDateTimeFromContext(a.deadline),
                formatDateTimeFromContext(a.plannedEndDate),
            ]),
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185], fontSize: 10 },
            styles: { fontSize: 9 },
        });
        lastY = (doc as any).lastAutoTable.finalY + 15;
    });

    doc.save('dashboard_report.pdf');
};

export const generateDashboardExcel = (data: DashboardReportData) => {
    const { activities, packages, formatDateTime: formatDateTimeFromContext } = data;
    const stats = calculateDashboardStats(data);
    const wb = XLSX.utils.book_new();

    // 1. Summary Sheet
    const summaryData = [
        ['Metric', 'Value'],
        ['Actual Progress', `${stats.actualProgress.toFixed(2)}%`],
        ['Planned Progress', `${stats.plannedProgress.toFixed(2)}%`],
        ['Completed Activities', stats.completedActivitiesList.length],
        ['Delayed Activities', stats.delayedActivities.length],
        ['On Track Activities', stats.onTrackActivitiesList.length],
        ['Upcoming Activities', stats.upcomingActivitiesList.length],
        ['Gain/Loss in Critical Path', `${stats.scheduleVarianceHours.toFixed(0)} hours`],
        ['Planned Start Date', formatDateTimeFromContext(stats.plannedStartDate)],
        ['Planned End Date', formatDateTimeFromContext(stats.plannedEndDate)],
        ['Actual Start Date', formatDateTimeFromContext(stats.actualStartDate)],
        ['Estimated End Date', formatDateTimeFromContext(stats.estimatedEndDate)],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Project Summary');

    // 2. Recent Jobs Sheet
    const recentJobs = activities.filter(a => a.status === 'In Progress');
    if (recentJobs.length > 0) {
        const recentJobsWs = XLSX.utils.json_to_sheet(recentJobs.map(a => ({
            'Activity Title': a.title,
            'Package Name': packages.find(p => p.id === a.packageName)?.name || a.packageName,
            'Equipment Tag': a.tag,
            'Status': a.status,
            'Planned Start': formatDateTimeFromContext(a.deadline),
        })));
        XLSX.utils.book_append_sheet(wb, recentJobsWs, 'Recent Jobs');
    }

    // 3. Hold Log Sheet
    const holdLogData: any[] = [];
    activities.forEach(activity => {
        if (activity.holdHistory) {
            activity.holdHistory.forEach(hold => {
                holdLogData.push({
                    'Activity Title': activity.title,
                    'Package Name': packages.find(p => p.id === activity.packageName)?.name || activity.packageName,
                    'Equipment Tag': activity.tag,
                    'Hold Reason': hold.reason,
                    'Hold Remarks': hold.remarks,
                    'Hold Start Time': formatDateTimeFromContext(hold.startTime),
                    'Hold End Time': hold.endTime ? formatDateTimeFromContext(hold.endTime) : 'Ongoing',
                    'Duration': formatDuration((hold.endTime ? new Date(hold.endTime).getTime() : new Date().getTime()) - new Date(hold.startTime).getTime())
                });
            });
        }
    });

    if (holdLogData.length > 0) {
        const holdLogWs = XLSX.utils.json_to_sheet(holdLogData);
        XLSX.utils.book_append_sheet(wb, holdLogWs, 'Hold Log');
    }
    
    // 4. All Activities Sheet
    const allActivitiesWs = XLSX.utils.json_to_sheet(activities.map(a => ({
        'Activity Title': a.title,
        'Package Name': packages.find(p => p.id === a.packageName)?.name || a.packageName,
        'Equipment Tag': a.tag,
        'Status': a.status,
        'Priority': a.priority,
        'Assignee': a.assignee,
        'Planned Start': formatDateTimeFromContext(a.deadline),
        'Planned End': formatDateTimeFromContext(a.plannedEndDate),
        'Actual Start': formatDateTimeFromContext(a.startTime),
        'Actual End': formatDateTimeFromContext(a.endTime),
        'Remarks': a.remark
    })));
    XLSX.utils.book_append_sheet(wb, allActivitiesWs, 'All Activities');

    // 5. Individual Package Sheets
    packages.forEach(pkg => {
        const pkgActivities = activities.filter(a => a.packageName === pkg.id);
        if (pkgActivities.length > 0) {
            const pkgActivitiesWs = XLSX.utils.json_to_sheet(pkgActivities.map(a => ({
                'Equipment Tag': a.tag,
                'Activity Title': a.title,
                'Status': a.status,
                'Priority': a.priority,
                'Assignee': a.assignee,
                'Planned Start': formatDateTimeFromContext(a.deadline),
                'Planned End': formatDateTimeFromContext(a.plannedEndDate),
                'Actual Start': formatDateTimeFromContext(a.startTime),
                'Actual End': formatDateTimeFromContext(a.endTime),
                'Remarks': a.remark
            })));
            // Truncate sheet name if too long
            const sheetName = pkg.name.substring(0, 31);
            XLSX.utils.book_append_sheet(wb, pkgActivitiesWs, sheetName);
        }
    });


    XLSX.writeFile(wb, 'dashboard_report.xlsx');
};


// --- PACKAGE REPORTING ---

interface PackageMetrics {
    status: ActivityStatus;
    progress: number;
    actualStartDate: Date | null;
    actualEndDate: Date | null;
}

export const generatePackagePdf = (pkg: Package, activities: Activity[], metrics: PackageMetrics, formatDateTimeFromContext: (date: Date | null | undefined) => string) => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Package Report: ${pkg.name}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(pkg.description || 'No description', 14, 28);
    
    autoTable(doc, {
        startY: 35,
        body: [
            ['Status', metrics.status, 'Progress', `${metrics.progress.toFixed(0)}%`],
            ['Priority', pkg.priority, 'Activities', `${activities.length}`],
            ['Planned Start', formatDateTimeFromContext(pkg.startDate), 'Actual Start', formatDateTimeFromContext(metrics.actualStartDate)],
            ['Planned End', formatDateTimeFromContext(pkg.endDate), 'Actual End', formatDateTimeFromContext(metrics.actualEndDate)],
        ],
        theme: 'grid',
        styles: { fontSize: 9 },
        bodyStyles: { cellPadding: 2 },
        columnStyles: {
            0: { fontStyle: 'bold' },
            2: { fontStyle: 'bold' },
        }
    });

    const groupedActivities = activities.reduce((acc, activity) => {
      const { tag } = activity;
      if (!acc[tag]) acc[tag] = [];
      acc[tag].push(activity);
      return acc;
    }, {} as Record<string, Activity[]>);

    let startY = (doc as any).lastAutoTable.finalY + 10;

    for (const [tag, acts] of Object.entries(groupedActivities)) {
        if (startY > 250) { // Add new page if content is too long
            doc.addPage();
            startY = 15;
        }
        autoTable(doc, {
            head: [[`Equipment Tag: ${tag} (${acts.length} ${acts.length === 1 ? 'Activity' : 'Activities'})`]],
            body: [],
            startY: startY,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185], fontSize: 10 },
        });
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY,
            head: [['Title', 'Status', 'Planned Start', 'Planned End', 'Actual Start', 'Actual End']],
            body: acts.map(a => [
                a.title,
                a.status,
                formatDateTimeFromContext(a.deadline),
                formatDateTimeFromContext(a.plannedEndDate),
                formatDateTimeFromContext(a.startTime),
                formatDateTimeFromContext(a.endTime),
            ]),
             styles: { fontSize: 9 },
        });
        startY = (doc as any).lastAutoTable.finalY + 10;
    }
    
    doc.save(`package_report_${pkg.name.replace(/\s/g, '_')}.pdf`);
};

export const generatePackageExcel = (pkg: Package, groupedActivities: Record<string, Activity[]>, metrics: PackageMetrics, formatDateTimeFromContext: (date: Date | null | undefined) => string) => {
    const wb = XLSX.utils.book_new();

    const summaryData = [
        ['Package Name', pkg.name],
        ['Description', pkg.description],
        ['Status', metrics.status],
        ['Progress', `${metrics.progress.toFixed(0)}%`],
        ['Priority', pkg.priority],
        ['Planned Start', formatDateTimeFromContext(pkg.startDate)],
        ['Planned End', formatDateTimeFromContext(pkg.endDate)],
        ['Actual Start', formatDateTimeFromContext(metrics.actualStartDate)],
        ['Actual End', formatDateTimeFromContext(metrics.actualEndDate)],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Package Summary');

    const allActivities = Object.values(groupedActivities).flat();
    const activitiesWsData = allActivities.map(a => ({
        'Equipment Tag': a.tag,
        'Activity Title': a.title,
        'Status': a.status,
        'Planned Start': formatDateTimeFromContext(a.deadline),
        'Planned End': formatDateTimeFromContext(a.plannedEndDate),
        'Planned Duration': formatDurationFromDates(a.deadline, a.plannedEndDate),
        'Actual Start': formatDateTimeFromContext(a.startTime),
        'Actual End': formatDateTimeFromContext(a.endTime),
        'Actual Duration': formatDurationFromDates(a.startTime, a.endTime),
        'Remark': a.remark,
    }));
    const activitiesWs = XLSX.utils.json_to_sheet(activitiesWsData);
    XLSX.utils.book_append_sheet(wb, activitiesWs, 'All Activities');
    
    XLSX.writeFile(wb, `package_report_${pkg.name.replace(/\s/g, '_')}.xlsx`);
};

// --- ADVANCED REPORTING ---

interface PackageReportDetails {
    name: string;
    description: string;
    status: ActivityStatus;
    progress: string;
    priority: Priority;
    startDate: string;
    endDate: string;
    actualStartDate: string;
    actualEndDate: string;
}

interface HoldSummaryItem {
    reason: string;
    totalDuration: number;
    count: number;
}

export interface AdvancedReportData {
  projectName: string;
  projectManager: string;
  statusUpdateDate: string;
  projectClientNumber?: string;
  projectSummary: {
    actualProgress: number;
    plannedProgress: number;
    scheduleVarianceHours: string;
    plannedStartDate: string;
    plannedEndDate: string;
    actualStartDate: string;
    estimatedEndDate: string;
    completedActivities: number;
    delayedActivities: number;
    onTrackActivities: number;
    upcomingActivities: number;
  };
  packageDetails: PackageReportDetails[];
  holdLog: (HoldEvent & { activity: Activity })[];
  holdSummary: HoldSummaryItem[];
  requiredSupport?: { value: string }[];
}


const drawCircularProgress = (
    doc: jsPDF,
    x: number,
    y: number,
    radius: number,
    lineWidth: number,
    value: number,
    color: [number, number, number],
    label: string
) => {
    doc.setLineWidth(lineWidth);
    const angle = (value / 100) * 360;

    // Background circle
    doc.setDrawColor(230, 230, 230); // Light gray
    doc.circle(x, y, radius, 'S');

    // Progress arc
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.path([
        { op: 'M', c: [x, y - radius] },
        ...Array.from({ length: Math.ceil(angle) }, (_, i) => {
            const a = (i - 90) * (Math.PI / 180);
            return { op: 'L', c: [x + radius * Math.cos(a), y + radius * Math.sin(a)] };
        })
    ]).stroke();


    // Text
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(`${value.toFixed(1)}%`, x, y + 2, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(label, x, y + radius + 8, { align: 'center' });
};


export const generateAdvancedReportPdf = (data: AdvancedReportData) => {
    const doc = new jsPDF();

    const pageHeader = (text: string, color: [number, number, number]) => {
        const currentY = (doc as any).lastAutoTable.finalY || 35;
        let startY = currentY + 8;
        if (startY > 250) {
            doc.addPage();
            startY = 15;
        }
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(14, startY, 182, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text(text, 105, startY + 5.5, { align: 'center' });
        return startY + 10;
    };

    // Main Title and Project Details Header
    doc.setFillColor(75, 85, 99); // Gray
    doc.rect(14, 15, 182, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255);
    doc.text('Client Status Update Report', 105, 22, { align: 'center' });

    doc.setFillColor(229, 231, 235); // Light Grey for sub-header
    doc.rect(14, 25, 182, 8, 'F');
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text('Project Details', 105, 30.5, { align: 'center' });


    // Project Details Table
    autoTable(doc, {
        startY: 35,
        body: [
            ['Project Name:', data.projectName, 'Project Manager:', data.projectManager],
            ['Status Update Date:', data.statusUpdateDate, 'Project Client number:', data.projectClientNumber || 'N/A'],
        ],
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 1.5 },
        columnStyles: {
            0: { fontStyle: 'bold' },
            2: { fontStyle: 'bold' },
        }
    });

    // Project Summary
    const summaryHeaderY = pageHeader('Project Summary', [34, 197, 94]); // Green
    
    // Draw circular progress bars
    const actualProgressValue = data.projectSummary.actualProgress;
    const plannedProgressValue = data.projectSummary.plannedProgress;
    
    const progressDiff = actualProgressValue - plannedProgressValue;
    let actualColor: [number, number, number] = [135, 206, 235]; // Sky Blue (default)
    if (progressDiff > 2) {
        actualColor = [34, 197, 94]; // Green
    } else if (progressDiff < -2) {
        actualColor = [220, 38, 38]; // Red
    }

    drawCircularProgress(doc, 60, summaryHeaderY + 20, 15, 3, actualProgressValue, actualColor, 'Actual Progress');
    drawCircularProgress(doc, 150, summaryHeaderY + 20, 15, 3, plannedProgressValue, [135, 206, 235], 'Planned Progress');

    const summaryTableY = summaryHeaderY + 45;

    autoTable(doc, {
        startY: summaryTableY,
        body: [
            [
                `Completed: ${data.projectSummary.completedActivities}`,
                `Delayed: ${data.projectSummary.delayedActivities}`
            ],
            [
                `On Track: ${data.projectSummary.onTrackActivities}`,
                `Upcoming: ${data.projectSummary.upcomingActivities}`
            ],
            [
                { content: `Gain/Loss: ${data.projectSummary.scheduleVarianceHours}`, colSpan: 2 }
            ],
            [
                `Planned Start: ${data.projectSummary.plannedStartDate}`,
                `Planned End: ${data.projectSummary.plannedEndDate}`
            ],
            [
                `Actual Start: ${data.projectSummary.actualStartDate}`,
                `Estimated End: ${data.projectSummary.estimatedEndDate}`
            ],
        ],
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
    });


    // Package Details
    const packagesY = pageHeader('Package Details', [59, 130, 246]); // Blue
    if(data.packageDetails && data.packageDetails.length > 0) {
        autoTable(doc, {
            startY: packagesY,
            head: [['Package', 'Status', 'Progress', 'Planned Start', 'Planned End', 'Actual Start', 'Actual End']],
            body: data.packageDetails.map(p => [
                `${p.name}\n(${p.priority} Priority)`,
                p.status,
                p.progress,
                p.startDate,
                p.endDate,
                p.actualStartDate,
                p.actualEndDate,
            ]),
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 1.5, valign: 'middle' },
            headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: 'center' },
            columnStyles: {
                0: { cellWidth: 40 },
                1: { halign: 'center' },
                2: { halign: 'center' },
            }
        });
    } else {
         (doc as any).lastAutoTable.finalY = packagesY;
    }

     // Hold Log & Analysis
    const holdY = pageHeader('Hold Log & Analysis', [231, 76, 60]); // Red
    if (data.holdLog && data.holdLog.length > 0) {
        autoTable(doc, {
            startY: holdY,
            head: [['Activity', 'Reason', 'Start', 'End', 'Duration']],
            body: data.holdLog.map(log => [
                `${log.activity.title}\n(${log.activity.packageName})`,
                log.reason,
                standaloneFormatDateTime(new Date(log.startTime)),
                log.endTime ? standaloneFormatDateTime(new Date(log.endTime)) : 'Ongoing',
                formatDuration((log.endTime ? new Date(log.endTime).getTime() : new Date().getTime()) - new Date(log.startTime).getTime())
            ]),
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 1.5, valign: 'middle' },
            headStyles: { fillColor: [192, 57, 43], textColor: 255 },
             columnStyles: { 0: { cellWidth: 50 } },
        });
        
        if (data.holdSummary && data.holdSummary.length > 0) {
            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 5,
                head: [['Hold Reason Summary', 'Total Time Lost', 'Count']],
                body: data.holdSummary.map(summary => [
                    summary.reason,
                    formatDuration(summary.totalDuration),
                    summary.count,
                ]),
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 1.5 },
                headStyles: { fillColor: [231, 76, 60], textColor: 255 },
            });
        }
    } else {
        (doc as any).lastAutoTable.finalY = holdY;
    }


    // Required Support
    const supportY = pageHeader('Required Support by the Customer', [245, 158, 11]); // Amber
    if(data.requiredSupport?.some(s => s.value)) {
        autoTable(doc, {
            startY: supportY,
            head: [['#', 'Support Required']],
            body: data.requiredSupport?.map((s, i) => [i + 1, s.value]).filter(row => row[1]),
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 1.5 },
            columnStyles: { 0: { cellWidth: 10, halign: 'center' } },
        });
    } else {
         (doc as any).lastAutoTable.finalY = supportY;
    }


    doc.save('Advanced_Status_Report.pdf');
};
