import { InsightsDashboard } from "@/components/insights/insights-dashboard";

export default function InsightsPage() {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight font-headline">Automated Insights & Recommendations</h2>
      </div>
      <InsightsDashboard />
    </div>
  );
}
