'use server';

/**
 * @fileOverview A flow to import glossary data into Firestore.
 *
 * - importGlossaryData - A function that handles the import process.
 */

import { z } from 'genkit';
import { glossaryData } from '../../lib/glossary-data';

const GlossaryDataSchema = z.object({
  glossary: z.any(),
});

type GlossaryData = z.infer<typeof GlossaryDataSchema>;

export async function getGlossaryDataForImport(): Promise<GlossaryData> {
  return {
    glossary: glossaryData,
  };
}