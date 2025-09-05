
"use client";

import { useState, useContext, type ReactNode, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DataContext } from "@/app/actions/data";
import type { Activity, Priority } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addHours, differenceInMinutes } from 'date-fns';
import { PlusCircle } from "lucide-react";

const activitySchema = z.object({
    title: z.string().min(1, "Title is required"),
    tag: z.string().min(1, "Tag is required"),
    priority: z.enum(['High', 'Medium', 'Low']),
    assignee: z.string().optional(),
    deadline: z.string().min(1, "Planned start date is required"),
    plannedEndDate: z.string().min(1, "Planned end date is required"),
    plannedDuration: z.number().optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface EditActivityDialogProps {
  children?: ReactNode;
  activity?: Activity;
  packageId?: string;
  tag?: string;
  defaultStartDate?: Date;
}

const formatDateForInput = (date: Date | string | undefined): string => {
    if (!date) return "";
    
    let dateObj: Date;
    if (date instanceof Date) {
        dateObj = date;
    } else {
        dateObj = new Date(date);
    }
    
    if (isNaN(dateObj.getTime())) {
        return ""; 
    }
    
    return format(dateObj, "yyyy-MM-dd'T'HH:mm");
};

const calculateDuration = (start: Date, end: Date): number => {
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffMins = differenceInMinutes(end, start);
    return parseFloat((diffMins / 60).toFixed(2));
};


export function EditActivityDialog({ children, activity, packageId, tag, defaultStartDate }: EditActivityDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { addOrUpdateActivity } = useContext(DataContext);
  const isEditMode = !!activity;

  const { register, handleSubmit, control, setValue, formState: { errors }, reset } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: "",
      tag: "",
      priority: 'Medium',
      assignee: "",
      deadline: "",
      plannedEndDate: "",
      plannedDuration: 1,
    }
  });
  
  const watchedDeadline = useWatch({ control, name: 'deadline' });
  const watchedDuration = useWatch({ control, name: 'plannedDuration' });

  useEffect(() => {
    if (watchedDeadline && watchedDuration && watchedDuration > 0) {
        try {
            const startDate = new Date(watchedDeadline);
            const endDate = addHours(startDate, watchedDuration);
            if (!isNaN(endDate.getTime())) {
                setValue('plannedEndDate', formatDateForInput(endDate));
            }
        } catch (e) {
            // Invalid date, do nothing
        }
    }
  }, [watchedDeadline, watchedDuration, setValue]);
  
  useEffect(() => {
    if (isOpen) {
        const initialValues = {
            title: activity?.title || "",
            tag: activity?.tag || tag || "",
            priority: activity?.priority || 'Medium',
            assignee: activity?.assignee || "",
            deadline: formatDateForInput(activity?.deadline || defaultStartDate),
            plannedEndDate: formatDateForInput(activity?.plannedEndDate),
            plannedDuration: activity ? calculateDuration(new Date(activity.deadline), new Date(activity.plannedEndDate)) : 1,
        };
        reset(initialValues);
    }
  }, [isOpen, activity, tag, defaultStartDate, reset]);

  const onSubmit = (data: ActivityFormData) => {
    const activityData: Activity = {
      ...activity,
      id: activity?.id || `ACT-${Date.now()}`,
      packageName: activity?.packageName || packageId!,
      title: data.title,
      tag: data.tag,
      priority: data.priority as Priority,
      assignee: data.assignee,
      deadline: new Date(data.deadline),
      plannedEndDate: new Date(data.plannedEndDate),
      status: activity?.status || 'Not Started',
    };
    addOrUpdateActivity(activityData);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {children ? (
             <DialogTrigger asChild>{children}</DialogTrigger>
        ) : (
             <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Activity
                </Button>
            </DialogTrigger>
        )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditMode ? "Edit Activity" : (tag ? "Create New Activity" : "Create New Tag & Activity")}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details for this activity." : `Fill in the details for the new activity${tag ? ` for tag '${tag}'` : ''}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="tag">Equipment Tag</Label>
            <Input id="tag" {...register("tag")} disabled={!!tag} />
            {errors.tag && <p className="text-xs text-destructive">{errors.tag.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Activity Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <Label htmlFor="priority">Priority</Label>
                 <Select
                    onValueChange={(value) => setValue('priority', value as Priority)}
                    defaultValue={control._defaultValues.priority}
                  >
                    <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-1.5">
                <Label htmlFor="assignee">Assignee (Optional)</Label>
                <Input id="assignee" {...register("assignee")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Planned Start</Label>
              <Input id="deadline" type="datetime-local" {...register("deadline")} />
              {errors.deadline && <p className="text-xs text-destructive">{errors.deadline.message}</p>}
            </div>
             <div className="space-y-1.5">
              <Label htmlFor="plannedDuration">Planned Duration (Hours)</Label>
              <Input 
                id="plannedDuration" 
                type="number" 
                step="0.1"
                {...register("plannedDuration", { valueAsNumber: true })}
              />
            </div>
          </div>
           <div className="space-y-1.5">
              <Label htmlFor="plannedEndDate">Planned End</Label>
              <Input id="plannedEndDate" type="datetime-local" {...register("plannedEndDate")} />
              {errors.plannedEndDate && <p className="text-xs text-destructive">{errors.plannedEndDate.message}</p>}
            </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
