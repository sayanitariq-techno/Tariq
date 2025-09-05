
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Activity } from "@/types";
import type { ReactNode } from "react";
import { useState, useContext, useEffect } from "react";
import { DataContext } from "@/app/actions/data";
import { useToast } from "@/hooks/use-toast";
import { suggestHoldRemark } from "@/ai/flows/suggest-hold-remark-flow";
import { Sparkles } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export function HoldDialog({ children, activity, onHoldConfirm }: { children: ReactNode; activity: Activity, onHoldConfirm: (activityId: string, status: "On Hold", reason: string, remarks?: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [suggestion, setSuggestion] = useState<{ reason: string, remarks: string } | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const { packages } = useContext(DataContext);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setReason("");
      setRemarks("");
      setSuggestion(null);
      setIsLoadingSuggestion(true);

      const fetchSuggestion = async () => {
        const pkg = packages.find(p => p.id === activity.packageName);
        if (!pkg) {
            setIsLoadingSuggestion(false);
            return;
        };

        try {
          const result = await suggestHoldRemark({
            activityTitle: activity.title,
            packageTitle: pkg.name,
            packageDescription: pkg.description,
          });
          setSuggestion({
            reason: result.suggestedReason,
            remarks: result.suggestedRemarks
          });
        } catch (error) {
          console.error("Failed to get hold suggestion:", error);
           toast({
            title: "AI Suggestion Failed",
            description: "Could not generate an AI suggestion at this time.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingSuggestion(false);
        }
      };

      fetchSuggestion();
    }
  }, [isOpen, activity, packages, toast]);


  const handleHold = async () => {
    if (!reason) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for putting the activity on hold.",
        variant: "destructive",
      });
      return;
    }
    onHoldConfirm(activity.id, "On Hold", reason, remarks);
    setIsOpen(false);
  };
  
  const applySuggestion = () => {
    if (suggestion) {
        setReason(suggestion.reason);
        setRemarks(suggestion.remarks);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Put Activity on Hold</DialogTitle>
          <DialogDescription>
            Provide details for putting "{activity.title}" on hold.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isLoadingSuggestion ? (
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
          ) : suggestion && (
            <div className="p-3 bg-secondary/50 rounded-md border border-dashed">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold flex items-center gap-2"><Sparkles className="text-primary" /> AI Suggestion</p>
                    <Button variant="outline" size="sm" onClick={applySuggestion}>Use Suggestion</Button>
                </div>
                <p className="text-sm"><strong>Reason:</strong> {suggestion.reason}</p>
                <p className="text-sm text-muted-foreground mt-1"><strong>Remarks:</strong> {suggestion.remarks}</p>
            </div>
          )}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Missing Parts, Safety Concern"
            />
          </div>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any additional details here."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleHold}>Confirm Hold</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
