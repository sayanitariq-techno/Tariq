import { ActivityStatusDashboard } from "@/components/activities/activity-status-dashboard";

export default function ActivitiesPage() {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight font-headline">Live Planning Bar</h2>
      </div>
      <ActivityStatusDashboard />
    </div>
  );
}
