

export type ActivityStatus = 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
export type Priority = 'High' | 'Medium' | 'Low';

export interface Package {
  id: string;
  name: string;
  description?: string;
  status?: ActivityStatus; // This will now be calculated on the fly in components
  priority: Priority;
  startDate: Date;
  endDate: Date;
  supervisor?: string;
}

export interface HoldEvent {
  reason: string;
  remarks?: string;
  startTime: Date;
  endTime?: Date;
}

export interface Activity {
  id:string;
  title: string;
  packageName: string;
  tag: string;
  status: ActivityStatus;
  priority: Priority;
  assignee?: string;
  startTime?: Date; // Actual Start
  endTime?: Date; // Actual End
  deadline: Date; // Planned Start
  plannedEndDate: Date; // Planned End
  remark?: string;
  holdReason?: string; // Current hold reason for quick display
  holdRemarks?: string; // Current hold remarks
  statusUpdatedAt?: Date;
  holdHistory?: HoldEvent[];
}
