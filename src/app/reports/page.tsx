import { ReportGenerator } from "@/components/reports/report-generator";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight font-headline">Advanced Project Status Report</h2>
      </div>
      <ReportGenerator />
    </div>
  );
}
