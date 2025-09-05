
'use server';
/**
 * @fileOverview An AI flow to analyze project schedule data and provide insights.
 *
 * - analyzeSchedule - A function that generates insights based on packages and activities.
 * - AnalyzeScheduleInput - The input type for the analyzeSchedule function.
 * - AnalyzeScheduleOutput - The return type for the analyzeSchedule function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const PackageSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  priority: z.enum(['High', 'Medium', 'Low']),
  startDate: z.date(),
  endDate: z.date(),
});

const HoldEventSchema = z.object({
    reason: z.string(),
    remarks: z.string().optional(),
    startTime: z.date(),
    endTime: z.date().optional(),
});

const ActivitySchema = z.object({
  id: z.string(),
  title: z.string(),
  packageName: z.string(),
  tag: z.string(),
  status: z.enum(['Not Started', 'In Progress', 'Completed', 'On Hold']),
  priority: z.enum(['High', 'Medium', 'Low']),
  assignee: z.string().optional(),
  startTime: z.date().optional(), // Actual Start
  endTime: z.date().optional(), // Actual End
  deadline: z.date(), // Planned Start
  plannedEndDate: z.date(), // Planned End
  holdHistory: z.array(HoldEventSchema).optional(),
});


const AnalyzeScheduleInputSchema = z.object({
  packages: z.array(PackageSchema),
  activities: z.array(ActivitySchema),
});
export type AnalyzeScheduleInput = z.infer<typeof AnalyzeScheduleInputSchema>;

const AnalyzeScheduleOutputSchema = z.object({
  overallAssessment: z.string().describe("A high-level summary of the project's health and progress."),
  keyObservations: z.array(z.string()).describe("A list of specific, data-driven observations about schedule performance, delays, and common issues."),
  recommendations: z.array(z.string()).describe("A list of actionable recommendations to mitigate risks and optimize the schedule."),
  riskAreas: z.array(z.string()).describe("A list of potential future problems or areas that require close attention."),
});
export type AnalyzeScheduleOutput = z.infer<typeof AnalyzeScheduleOutputSchema>;

export async function analyzeSchedule(input: AnalyzeScheduleInput): Promise<AnalyzeScheduleOutput> {
  // Genkit currently works best with JSON-serializable data. Convert dates to strings.
  const serializableInput = {
      packages: input.packages.map(p => ({...p, startDate: p.startDate.toISOString(), endDate: p.endDate.toISOString()})),
      activities: input.activities.map(a => ({
          ...a,
          deadline: a.deadline.toISOString(),
          plannedEndDate: a.plannedEndDate.toISOString(),
          startTime: a.startTime?.toISOString(),
          endTime: a.endTime?.toISOString(),
          holdHistory: a.holdHistory?.map(h => ({...h, startTime: h.startTime.toISOString(), endTime: h.endTime?.toISOString()}))
      }))
  };
  return analyzeScheduleFlow({jsonData: JSON.stringify(serializableInput)});
}

const prompt = ai.definePrompt({
  name: 'analyzeSchedulePrompt',
  input: { schema: z.object({jsonData: z.string()}) },
  output: { schema: AnalyzeScheduleOutputSchema },
  prompt: `You are a world-class project management consultant specializing in industrial shutdowns and turnarounds.
  Your task is to analyze the provided project data and generate a concise, insightful report.

  Analyze the project data which includes packages and their associated activities. Pay close attention to:
  - Planned vs. actual start/end dates.
  - The frequency and reasons for activities being put 'On Hold'.
  - Activities that are completed behind their planned end date.
  - The status of high-priority packages and activities.
  - Look for patterns: Are certain types of tasks (e.g., 'Blinding', 'Isolation') or teams/assignees frequently associated with delays?

  Based on your analysis, provide:
  1.  **Overall Assessment:** A brief summary of the project's current status (e.g., "On track," "Slightly behind schedule," "At risk").
  2.  **Key Observations:** 3-4 bullet points highlighting the most important findings from the data. Be specific (e.g., "Exchanger overhaul package is delayed due to frequent holds for 'Tooling Unavailable'").
  3.  **Recommendations:** 3-4 actionable recommendations to improve performance (e.g., "Pre-stage required tooling for all 'Dismantle' activities to reduce wait times.").
  4.  **Potential Risk Areas:** 2-3 areas that could cause future problems if not addressed (e.g., "The upcoming 'Vessel Inspection' package has a critical path with no float, making it highly sensitive to any delays.").

  The tone should be professional, direct, and helpful. Focus on providing clear, data-driven insights.

  Project Data:
  \`\`\`json
  {{{jsonData}}}
  \`\`\`
  `,
});

const analyzeScheduleFlow = ai.defineFlow(
  {
    name: 'analyzeScheduleFlow',
    inputSchema: z.object({jsonData: z.string()}),
    outputSchema: AnalyzeScheduleOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
