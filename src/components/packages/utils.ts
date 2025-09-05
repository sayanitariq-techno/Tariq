
import type { Activity, ActivityStatus, Package } from '@/types';

export const calculatePackageMetrics = (pkg: Package, activities: Activity[]) => {
    const totalActivities = activities.length;
    if (totalActivities === 0) {
        return {
            status: 'Not Started' as ActivityStatus,
            progress: 0,
            actualStartDate: null,
            actualEndDate: null,
        };
    }

    const completedCount = activities.filter(a => a.status === 'Completed').length;
    const progress = (completedCount / totalActivities) * 100;
    
    let status: ActivityStatus = 'Not Started';
    const hasInProgress = activities.some(a => a.status === 'In Progress');
    const hasOnHold = activities.some(a => a.status === 'On Hold');

    if (completedCount === totalActivities) {
        status = 'Completed';
    } else if (hasOnHold) {
        status = 'On Hold';
    } else if (hasInProgress || completedCount > 0) {
        status = 'In Progress';
    }

    const startTimes = activities
        .map(a => a.startTime ? a.startTime.getTime() : null)
        .filter((t): t is number => t !== null);
    const endTimes = activities
        .map(a => a.endTime ? a.endTime.getTime() : null)
        .filter((t): t is number => t !== null);

    const actualStartDate = startTimes.length > 0 ? new Date(Math.min(...startTimes)) : null;
    let actualEndDate = null;
    if (completedCount === totalActivities && endTimes.length > 0) {
        actualEndDate = new Date(Math.max(...endTimes));
    }

    return { status, progress, actualStartDate, actualEndDate };
};
