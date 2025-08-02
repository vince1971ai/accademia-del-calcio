'use server';

/**
 * @fileOverview A flow to import quiz data into Firestore.
 *
 * - importQuizData - A function that handles the import process.
 */

import { z } from 'genkit';
import { quizCategoriesData, quizzesData } from '@/lib/quiz-data-import';

const QuizDataSchema = z.object({
  categories: z.any(),
  quizzes: z.any(),
});

type QuizData = z.infer<typeof QuizDataSchema>;

export async function getQuizDataForImport(): Promise<QuizData> {
  return {
    categories: quizCategoriesData,
    quizzes: quizzesData,
  };
}