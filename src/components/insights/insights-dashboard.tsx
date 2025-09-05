
"use client";

import { useContext, useState } from "react";
import { DataContext } from "@/app/actions/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { analyzeSchedule, type AnalyzeScheduleOutput } from "@/ai/flows/analyze-schedule-flow";
import { Lightbulb, AlertTriangle, CheckCircle, BarChart, Sparkles } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export function InsightsDashboard() {
  const { packages, activities } = useContext(DataContext);
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<AnalyzeScheduleOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setInsights(null);
    try {
      const result = await analyzeSchedule({ packages, activities });
      setInsights(result);
    } catch (err) {
      console.error("Error analyzing schedule:", err);
      setError("Failed to generate insights. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Powered Schedule Analysis</CardTitle>
        <CardDescription>
          Click the button below to have our AI analyze your current project data. It will identify trends, potential risks, and provide actionable recommendations to optimize your workflow and schedule.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button onClick={handleAnalyze} disabled={isLoading} size="lg">
           {isLoading ? 'Analyzing...' : <> <Sparkles className="mr-2 h-4 w-4" /> Generate Insights</>}
        </Button>

        {isLoading && (
            <div className="mt-6 space-y-4 text-left">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-8 w-1/4 mt-4" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-4/5" />
                </div>
            </div>
        )}

        {error && (
            <Alert variant="destructive" className="mt-6 text-left">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Analysis Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {insights && (
            <div className="mt-8 text-left space-y-6">
                <div className="space-y-2">
                    <h3 className="font-headline text-lg flex items-center"><BarChart className="mr-2 text-primary" />Overall Assessment</h3>
                    <p className="text-muted-foreground">{insights.overallAssessment}</p>
                </div>

                <div className="space-y-2">
                    <h3 className="font-headline text-lg flex items-center"><CheckCircle className="mr-2 text-green-500" />Key Observations</h3>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        {insights.keyObservations.map((obs, i) => <li key={i}>{obs}</li>)}
                    </ul>
                </div>

                <div className="space-y-2">
                    <h3 className="font-headline text-lg flex items-center"><Lightbulb className="mr-2 text-yellow-500" />Recommendations</h3>
                     <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        {insights.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                    </ul>
                </div>
                
                <div className="space-y-2">
                    <h3 className="font-headline text-lg flex items-center"><AlertTriangle className="mr-2 text-red-500" />Potential Risk Areas</h3>
                     <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        {insights.riskAreas.map((risk, i) => <li key={i}>{risk}</li>)}
                    </ul>
                </div>
            </div>
        )}

      </CardContent>
    </Card>
  );
}
