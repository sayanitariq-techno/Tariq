
import { HoldLogDashboard } from "@/components/hold-log/hold-log-dashboard";

export default function HoldLogPage() {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight font-headline">Hold Log & Analysis</h2>
      </div>
      <HoldLogDashboard />
    </div>
  );
}
