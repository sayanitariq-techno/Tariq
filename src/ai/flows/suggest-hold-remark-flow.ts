'use server';
/**
 * @fileOverview An AI flow to suggest reasons and remarks for placing an activity on hold.
 *
 * - suggestHoldRemark - A function that generates suggestions for hold reasons and remarks.
 * - SuggestHoldRemarkInput - The input type for the suggestHoldRemark function.
 * - SuggestHoldRemarkOutput - The return type for the suggestHoldRemark function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SuggestHoldRemarkInputSchema = z.object({
  activityTitle: z.string().describe('The title of the activity being put on hold.'),
  packageTitle: z.string().describe('The title of the package the activity belongs to.'),
  packageDescription: z.string().optional().describe('The description of the package.'),
});
export type SuggestHoldRemarkInput = z.infer<typeof SuggestHoldRemarkInputSchema>;

const SuggestHoldRemarkOutputSchema = z.object({
  suggestedReason: z.string().describe('A concise, suggested reason for the hold (e.g., "Awaiting Materials", "Safety Concern").'),
  suggestedRemarks: z.string().describe('A more detailed, suggested remark explaining the context of the hold.'),
});
export type SuggestHoldRemarkOutput = z.infer<typeof SuggestHoldRemarkOutputSchema>;

export async function suggestHoldRemark(input: SuggestHoldRemarkInput): Promise<SuggestHoldRemarkOutput> {
  return suggestHoldRemarkFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestHoldRemarkPrompt',
  input: { schema: SuggestHoldRemarkInputSchema },
  output: { schema: SuggestHoldRemarkOutputSchema },
  prompt: `You are an expert in industrial project management, specifically for shutdowns and turnarounds.
  Your task is to suggest a likely reason and a detailed remark for putting a maintenance activity on hold.

  Analyze the context provided by the package and activity details.

  **Package Title:** {{{packageTitle}}}
  **Package Description:** {{{packageDescription}}}
  **Activity Title:** {{{activityTitle}}}

  Based on this context, provide a concise, probable reason for the hold and a more detailed, professionally worded remark. The tone should be formal and clear.
  
  Example:
  - Input: Activity Title "Dismantle Channel Head", Package "Exchanger Overhaul"
  - Output:
    - suggestedReason: "Tooling Unavailable"
    - suggestedRemarks: "Required hydraulic torque wrench is currently in use on another job. Awaiting availability."

  Generate one reason and one remark.`,
});

const suggestHoldRemarkFlow = ai.defineFlow(
  {
    name: 'suggestHoldRemarkFlow',
    inputSchema: SuggestHoldRemarkInputSchema,
    outputSchema: SuggestHoldRemarkOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
