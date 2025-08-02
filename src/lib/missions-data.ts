import type { UserStats } from '@/context/user-data-context';
import type { CategoryId } from './quiz-data';

export interface MissionReward {
  xp?: number;
  badgeId?: string;
}

export interface Mission {
  id: string;
  titleKey: string;
  descriptionKey: string;
  category: 'daily' | 'weekly' | 'special';
  condition: (stats: UserStats) => boolean;
  reward: MissionReward;
  progress?: (stats: UserStats) => { current: number; total: number };
}

export const allMissions: Record<string, Mission> = {
  completeOneQuiz: {
    id: 'completeOneQuiz',
    titleKey: 'mission_completeOneQuiz_title',
    descriptionKey: 'mission_completeOneQuiz_desc',
    category: 'daily',
    condition: (stats) => stats.completedQuizzes.length >= 1,
    reward: { xp: 50 },
    progress: (stats) => ({
      current: stats.completedQuizzes.length,
      total: 1,
    }),
  },
  completeTacticsQuiz: {
    id: 'completeTacticsQuiz',
    titleKey: 'mission_completeTacticsQuiz_title',
    descriptionKey: 'mission_completeTacticsQuiz_desc',
    category: 'daily',
    condition: (stats) => stats.completedQuizzes.some(quizId => quizId.startsWith('tactics')),
    reward: { xp: 75, badgeId: 'tacticsExpert' },
    progress: (stats) => ({
        current: stats.completedQuizzes.filter(quizId => quizId.startsWith('tactics')).length,
        total: 1,
    })
  },
};