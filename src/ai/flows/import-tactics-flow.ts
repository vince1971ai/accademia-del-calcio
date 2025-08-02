'use server';

/**
 * @fileOverview A flow to import tactics data into Firestore.
 *
 * - importTacticsData - A function that handles the import process.
 */

import { z } from 'genkit';
import { formationsData } from '@/lib/tactics-data-import';

const TacticsDataSchema = z.object({
  formations: z.any(),
});

type TacticsData = z.infer<typeof TacticsDataSchema>;

export async function getTacticsDataForImport(): Promise<TacticsData> {
  return {
    formations: formationsData,
  };
}