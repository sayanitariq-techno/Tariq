"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Activity } from "@/types";

interface ActivityListDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description: string;
  activities: Activity[];
}

export function ActivityListDialog({ isOpen, onOpenChange, title, description, activities }: ActivityListDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline">{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity Title</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.title}</TableCell>
                  <TableCell>{activity.packageName}</TableCell>
                  <TableCell className={new Date(activity.deadline) < new Date() && activity.status !== 'Completed' ? "text-red-500" : ""}>
                    {new Date(activity.deadline).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={activity.status === 'On Hold' ? 'destructive' : (activity.status === 'Completed' ? 'default' : 'secondary')}>
                      {activity.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{activity.assignee || 'Unassigned'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
