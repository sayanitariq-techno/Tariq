"use client";

import { useState, useEffect, type ReactNode, useCallback } from 'react';
import type { Activity, ActivityStatus, Package } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { DataContext } from '@/app/actions/data';
import { initialData } from '@/lib/data';
import { differenceInMilliseconds } from 'date-fns';

const reviveDates = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => reviveDates(item));
    }

    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            const isDateString = typeof value === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(value);

            if (isDateString) {
                newObj[key] = new Date(value);
            } else if (typeof value === 'object' && value !== null) {
                newObj[key] = reviveDates(value);
            } else {
                newObj[key] = value;
            }
        }
    }
    return newObj;
};


export function DataProvider({ children }: { children: ReactNode }) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [simulationDate, setSimulationDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();
    
    useEffect(() => {
        try {
            const storedPackages = localStorage.getItem('packages');
            const storedActivities = localStorage.getItem('activities');

            if (storedPackages && storedActivities) {
                setPackages(reviveDates(JSON.parse(storedPackages)));
                setActivities(reviveDates(JSON.parse(storedActivities)));
            } else {
                // Load initial data if local storage is empty
                const loadedPackages = initialData.packages.map(p => ({
                    ...p,
                    startDate: new Date(p.startDate),
                    endDate: new Date(p.endDate),
                }));

                const loadedActivities = initialData.activities.map(a => ({
                    ...a,
                    deadline: new Date(a.deadline),
                    plannedEndDate: new Date(a.plannedEndDate),
                    startTime: a.startTime ? new Date(a.startTime) : undefined,
                    endTime: a.endTime ? new Date(a.endTime) : undefined,
                    holdHistory: a.holdHistory?.map(h => ({...h, startTime: new Date(h.startTime), endTime: h.endTime ? new Date(h.endTime) : undefined})) || []
                }));
                
                setPackages(loadedPackages);
                setActivities(loadedActivities);
                localStorage.setItem('packages', JSON.stringify(loadedPackages));
                localStorage.setItem('activities', JSON.stringify(loadedActivities));
            }
        } catch (error) {
            console.error("Failed to load data from localStorage:", error);
            // Fallback to initial data
            setPackages(reviveDates(initialData.packages));
            setActivities(reviveDates(initialData.activities));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveData = useCallback((newPackages: Package[], newActivities: Activity[]) => {
        localStorage.setItem('packages', JSON.stringify(newPackages));
        localStorage.setItem('activities', JSON.stringify(newActivities));
    }, []);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setSimulationDate(new Date());
        }, 60000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const updateActivityStatus = useCallback((activityId: string, newStatus: ActivityStatus, reason?: string, remarks?: string) => {
        let toastMessage: { title: string; description: string; variant?: 'destructive' } | null = null;
        
        setActivities(prev => {
            const now = new Date();
            const newActivities = [...prev];
            const activityIndex = newActivities.findIndex(a => a.id === activityId);
            if (activityIndex === -1) return prev;
            
            let activityToUpdate = { ...newActivities[activityIndex] };
            const oldStatus = activityToUpdate.status;

            if (newStatus === 'Completed' && oldStatus === 'Not Started') {
                 toast({
                    title: 'Invalid Action',
                    description: 'Please start the activity before marking it as complete.',
                    variant: 'destructive',
                });
                return prev;
            }

            let holdHistory = [...(activityToUpdate.holdHistory || [])];

            if (oldStatus === 'On Hold' && newStatus !== 'On Hold') {
                const lastHold = holdHistory[holdHistory.length - 1];
                if (lastHold && !lastHold.endTime) {
                    lastHold.endTime = now;
                }
            }

            if (newStatus === 'On Hold' && reason) {
                holdHistory.push({
                    reason,
                    remarks: remarks || '',
                    startTime: now,
                });
            }

            activityToUpdate = {
                ...activityToUpdate,
                status: newStatus,
                statusUpdatedAt: now,
                holdHistory,
            };

            if (newStatus === 'In Progress' && !activityToUpdate.startTime) {
                activityToUpdate.startTime = now;
            }
            if (newStatus === 'Completed' && !activityToUpdate.endTime) {
                if (!activityToUpdate.startTime) activityToUpdate.startTime = now;
                activityToUpdate.endTime = now;
            }
            
            if (newStatus === 'Not Started') {
                delete activityToUpdate.startTime;
                delete activityToUpdate.endTime;
                activityToUpdate.holdHistory = [];
                 toastMessage = {
                     title: "Activity Reset",
                     description: `"${activityToUpdate.title}" has been reset to 'Not Started'.`
                };
            }
            
            newActivities[activityIndex] = activityToUpdate;
            saveData(packages, newActivities);
            return newActivities;
        });

         if (toastMessage) {
            toast(toastMessage);
        }
    }, [toast, packages, saveData]);
    
    const updatePackageDates = (packageId: string, currentActivities: Activity[], currentPackages: Package[]): Package[] => {
        const relevantActivities = currentActivities.filter(a => a.packageName === packageId);
        if (relevantActivities.length === 0) return currentPackages;

        const startDates = relevantActivities.map(a => a.deadline.getTime());
        const endDates = relevantActivities.map(a => a.plannedEndDate.getTime());

        const minStartDate = new Date(Math.min(...startDates));
        const maxEndDate = new Date(Math.max(...endDates));

        return currentPackages.map(p => 
            p.id === packageId ? { ...p, startDate: minStartDate, endDate: maxEndDate } : p
        );
    };

    // ✅ FIXED HERE
    const addOrUpdatePackage = useCallback(async (pkg: Package): Promise<void> => {
        setPackages(prev => {
            const existingIndex = prev.findIndex(p => p.id === pkg.id);
            let newPackages;
            if (existingIndex > -1) {
                newPackages = [...prev];
                newPackages[existingIndex] = { ...newPackages[existingIndex], ...pkg };
            } else {
                newPackages = [...prev, pkg];
            }
            saveData(newPackages, activities);
            return newPackages;
        });

        toast({
            title: pkg.id.startsWith('PKG-') ? "Package Updated" : "Package Created",
            description: `Package "${pkg.name}" has been saved.`,
        });
    }, [activities, saveData, toast]);

    const addOrUpdateActivity = useCallback((activity: Activity) => {
        setActivities(prevActivities => {
            let tempActivities = [...prevActivities];
            const isUpdate = tempActivities.some(a => a.id === activity.id);
            
            if (isUpdate) {
                const index = tempActivities.findIndex(a => a.id === activity.id);
                if (index > -1) tempActivities[index] = { ...activity };
            } else {
                tempActivities.push(activity);
            }
            
            const tagActivities = tempActivities
                .filter(a => a.packageName === activity.packageName && a.tag === activity.tag)
                .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());

            const currentActivityIndexInTag = tagActivities.findIndex(a => a.id === activity.id);

            if (currentActivityIndexInTag > -1) {
                for (let i = currentActivityIndexInTag + 1; i < tagActivities.length; i++) {
                    const prevActivityInTag = tagActivities[i - 1];
                    const currentActivityInTag = tagActivities[i];

                    const duration = differenceInMilliseconds(currentActivityInTag.plannedEndDate, currentActivityInTag.deadline);
                    const newDeadline = new Date(prevActivityInTag.plannedEndDate.getTime());
                    const newPlannedEndDate = new Date(newDeadline.getTime() + duration);

                    const globalIndexOfCurrent = tempActivities.findIndex(a => a.id === currentActivityInTag.id);
                    if (globalIndexOfCurrent > -1) {
                        const updatedActivity = {
                            ...tempActivities[globalIndexOfCurrent],
                            deadline: newDeadline,
                            plannedEndDate: newPlannedEndDate,
                        };
                        tempActivities[globalIndexOfCurrent] = updatedActivity;
                        tagActivities[i] = updatedActivity; 
                    }
                }
            }
            
            setPackages(currentPackages => {
                const updatedPackages = updatePackageDates(activity.packageName, tempActivities, currentPackages);
                saveData(updatedPackages, tempActivities);
                return updatedPackages;
            });
            
            toast({
                title: isUpdate ? "Activity Updated" : "Activity Created",
                description: `Activity "${activity.title}" has been saved. Subsequent activities and package dates have been rescheduled.`,
            });
            
            return tempActivities;
        });
    }, [saveData, toast]);
    
    const bulkAddData = useCallback(async (data: { packages: Package[], activities: Activity[] }) => {
        const packageMap = new Map(packages.map(p => [p.id, p]));
        data.packages.forEach(pkg => {
            packageMap.set(pkg.id, pkg);
        });
        const finalPackages = Array.from(packageMap.values());

        const activityMap = new Map(activities.map(a => [a.id, a]));
        data.activities.forEach(act => {
            activityMap.set(act.id, act);
        });
        const finalActivities = Array.from(activityMap.values());

        setPackages(finalPackages);
        setActivities(finalActivities);
        saveData(finalPackages, finalActivities);

        toast({
            title: "Bulk Import Successful",
            description: `${data.packages.length} packages and ${data.activities.length} activities have been added or updated.`,
        });
    }, [activities, packages, saveData, toast]);


    const deletePackage = useCallback((packageId: string) => {
        const pkgToDelete = packages.find(p => p.id === packageId);
        if (!pkgToDelete) return;
        
        const newPackages = packages.filter(p => p.id !== packageId);
        const newActivities = activities.filter(a => a.packageName !== packageId);

        setPackages(newPackages);
        setActivities(newActivities);
        saveData(newPackages, newActivities);

        toast({
            title: "Package Deleted",
            description: `Package "${pkgToDelete.name}" and all its activities have been deleted.`,
            variant: "destructive",
        });
    }, [packages, activities, toast, saveData]);

    const deleteActivity = useCallback((activityId: string) => {
        setActivities(currentActivities => {
            const actToDelete = currentActivities.find(a => a.id === activityId);
            if (!actToDelete) return currentActivities;

            const newActivities = currentActivities.filter(a => a.id !== activityId);
            
            setPackages(currentPackages => {
                const updatedPackages = updatePackageDates(actToDelete.packageName, newActivities, currentPackages);
                saveData(updatedPackages, newActivities);
                return updatedPackages;
            });

            toast({
                title: "Activity Deleted",
                description: `Activity "${actToDelete.title}" has been deleted.`,
                variant: "destructive",
            });
            
            return newActivities;
        });
    }, [saveData, toast]);
    
    const updateTagForActivities = useCallback((activityIds: string[], newTag: string) => {
        setActivities(prevActivities => {
            const newActivities = prevActivities.map(activity => 
                activityIds.includes(activity.id) ? { ...activity, tag: newTag } : activity
            );
            saveData(packages, newActivities);
            return newActivities;
        });
        
        toast({
            title: "Tag Updated",
            description: `Tag for ${activityIds.length} activities has been updated to "${newTag}".`
        });
    }, [packages, saveData, toast]);

    const formatDateTime = useCallback((date: Date | null | undefined) => {
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
    }, []);
    
    return (
        <DataContext.Provider value={{ 
            activities, 
            packages, 
            isLoading, 
            updateActivityStatus, 
            simulationDate, 
            setSimulationDate,
            addOrUpdatePackage,
            deletePackage,
            addOrUpdateActivity,
            deleteActivity,
            updateTagForActivities,
            bulkAddData,
            formatDateTime,
            searchTerm,
            setSearchTerm,
        }}>
            {children}
        </DataContext.Provider>
    );
}
