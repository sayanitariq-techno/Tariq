
'use server';
/**
 * @fileOverview An AI flow to predict the project's estimated completion date.
 *
 * - predictEndDate - A function that analyzes project data to forecast a completion date.
 * - PredictEndDateInput - The input type for the predictEndDate function.
 * - PredictEndDateOutput - The return type for the predictEndDate function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const PackageSchema = z.object({
  id: z.string(),
  name: z.string(),
  startDate: z.date(),
  endDate: z.date(),
});

const HoldEventSchema = z.object({
    reason: z.string(),
    startTime: z.date(),
    endTime: z.date().optional(),
});

const ActivitySchema = z.object({
  id: z.string(),
  title: z.string(),
  packageName: z.string(),
  status: z.enum(['Not Started', 'In Progress', 'Completed', 'On Hold']),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  deadline: z.date(),
  plannedEndDate: z.date(),
  holdHistory: z.array(HoldEventSchema).optional(),
});

const PredictEndDateInputSchema = z.object({
  packages: z.array(PackageSchema),
  activities: z.array(ActivitySchema),
  simulationDate: z.date(),
});
export type PredictEndDateInput = z.infer<typeof PredictEndDateInputSchema>;

const PredictEndDateOutputSchema = z.object({
  predictedDate: z.string().datetime().describe('The predicted project completion date and time in ISO 8601 format.'),
  reasoning: z.string().describe('A brief explanation of the factors that led to this prediction.'),
});
export type PredictEndDateOutput = z.infer<typeof PredictEndDateOutputSchema>;

export async function predictEndDate(input: PredictEndDateInput): Promise<PredictEndDateOutput> {
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
      })),
      simulationDate: input.simulationDate.toISOString(),
  };
  return predictEndDateFlow({jsonData: JSON.stringify(serializableInput), simulationDate: serializableInput.simulationDate});
}

const prompt = ai.definePrompt({
  name: 'predictEndDatePrompt',
  input: { schema: z.object({jsonData: z.string(), simulationDate: z.string()}) }, 
  output: { schema: PredictEndDateOutputSchema },
  prompt: `You are a world-class project management AI specializing in industrial shutdowns.
  Your task is to predict the final completion date of the entire project based on the provided data.

  Analyze the project data which includes packages and their activities. Consider the following factors:
  - The overall planned project start and end dates derived from the packages.
  - The current date is {{{simulationDate}}}.
  - The number of completed activities vs. the total number of activities.
  - How many activities are currently 'On Hold' and the reasons/durations of past holds.
  - The performance against planned start (deadline) and planned end dates for activities that have started or completed.
  - Identify any positive or negative trends. Is the project accelerating or decelerating?

  Based on your analysis, provide a realistic estimated completion date. Do not be overly optimistic or pessimistic. Your prediction should be a specific date and time.
  Provide your response in the specified JSON format with the predicted date in ISO 8601 format and a brief reasoning.

  Project Data:
  \`\`\`json
  {{{jsonData}}}
  \`\`\`
  `,
});

const predictEndDateFlow = ai.defineFlow(
  {
    name: 'predictEndDateFlow',
    inputSchema: z.object({jsonData: z.string(), simulationDate: z.string()}),
    outputSchema: PredictEndDateOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
