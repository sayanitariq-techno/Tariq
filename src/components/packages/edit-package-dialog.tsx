
"use client";

import { useState, useContext, type ReactNode, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DataContext } from "@/app/actions/data";
import type { Package, Priority } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';

const packageSchema = z.object({
    name: z.string().min(1, "Package name is required"),
    description: z.string().optional(),
    priority: z.enum(['High', 'Medium', 'Low']),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
});

type PackageFormData = z.infer<typeof packageSchema>;

interface EditPackageDialogProps {
  children?: ReactNode;
  pkg?: Package;
}

export function EditPackageDialog({ children, pkg }: EditPackageDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { addOrUpdatePackage } = useContext(DataContext);
  const isEditMode = !!pkg;

  const formatDateForInput = (date: Date | string | undefined) => {
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

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: pkg?.name || "",
      description: pkg?.description || "",
      priority: pkg?.priority || 'Medium',
      startDate: formatDateForInput(pkg?.startDate),
      endDate: formatDateForInput(pkg?.endDate),
    }
  });

  useEffect(() => {
    if (pkg) {
      setValue('name', pkg.name);
      setValue('description', pkg.description || "");
      setValue('priority', pkg.priority);
      setValue('startDate', formatDateForInput(pkg.startDate));
      setValue('endDate', formatDateForInput(pkg.endDate));
    }
  }, [pkg, setValue, isOpen]);


  const onSubmit = (data: PackageFormData) => {
    const packageData: Package = {
      id: pkg?.id || `PKG-${Date.now()}`,
      name: data.name,
      description: data.description,
      priority: data.priority as Priority,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    };
    addOrUpdatePackage(packageData);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditMode ? 'Edit Package' : 'Create New Package'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details for this work package." : "Fill in the details for the new work package."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-1.5">
                <Label htmlFor="name">Package Name</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" {...register("description")} />
            </div>
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
             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <Label htmlFor="startDate">Planned Start Date</Label>
                    <Input id="startDate" type="datetime-local" {...register("startDate")} />
                    {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="endDate">Planned End Date</Label>
                    <Input id="endDate" type="datetime-local" {...register("endDate")} />
                    {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit">Save Package</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
