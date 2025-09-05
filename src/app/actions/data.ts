
"use client";

import { createContext } from 'react';
import type { Activity, ActivityStatus, Package } from '@/types';

interface DataContextType {
    activities: Activity[];
    packages: Package[];
    isLoading: boolean;
    updateActivityStatus: (activityId: string, newStatus: ActivityStatus, reason?: string, remarks?: string) => void;
    simulationDate: Date;
    setSimulationDate: (date: Date) => void;
    addOrUpdatePackage: (pkg: Package) => Promise<void>;
    deletePackage: (packageId: string) => Promise<void>;
    addOrUpdateActivity: (activity: Activity) => Promise<void>;
    deleteActivity: (activityId: string) => Promise<void>;
    updateTagForActivities: (activityIds: string[], newTag: string) => Promise<void>;
    bulkAddData: (data: { packages: Package[], activities: Activity[] }) => Promise<void>;
    formatDateTime: (date: Date | null | undefined) => string;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

export const DataContext = createContext<DataContextType>({
    activities: [],
    packages: [],
    isLoading: true,
    updateActivityStatus: () => {},
    simulationDate: new Date(),
    setSimulationDate: () => {},
    addOrUpdatePackage: async () => {},
    deletePackage: async () => {},
    addOrUpdateActivity: async () => {},
    deleteActivity: async () => {},
    updateTagForActivities: async () => {},
    bulkAddData: async () => {},
    formatDateTime: () => '',
    searchTerm: '',
    setSearchTerm: () => {},
});
