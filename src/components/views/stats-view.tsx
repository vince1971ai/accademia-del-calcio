'use client';

import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit, Target, Zap, CalendarDays, Star, Award } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';

export function StatsView() {
  const { t } = useTranslation();
  const { userStats } = useUserData();

  const averageAccuracy = userStats.totalQuestions > 0 
    ? Math.round((userStats.correctAnswers / userStats.totalQuestions) * 100) 
    : 0;

  const quizAverageXp = userStats.completedQuizzes.length > 0
    ? Math.round(userStats.xp / userStats.completedQuizzes.length)
    : 0;

  const currentLevelInfo = userStats.levels[userStats.level - 1];
  const nextLevelInfo = userStats.levels[userStats.level];
  const xpForCurrentLevel = currentLevelInfo.xpRequired;
  const xpForNextLevel = nextLevelInfo ? nextLevelInfo.xpRequired : currentLevelInfo.xpRequired;
  
  const xpIntoLevel = userStats.xp - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
  const levelProgress = xpNeededForLevel > 0 ? (xpIntoLevel / xpNeededForLevel) * 100 : 100;
  
  const badgesEarned = userStats.badges.length;

  // Determine badge tier based on number of badges earned
  let badgeTier = t.stats.beginner;
  if (badgesEarned >= 20) {
    badgeTier = t.stats.master;
  } else if (badgesEarned >= 10) {
    badgeTier = t.stats.expert;
  } else if (badgesEarned >= 5) {
    badgeTier = t.stats.adept;
  }


  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline flex items-center justify-center">
          {t.stats.title}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.stats.quizzesCompleted}</CardTitle>
            <BrainCircuit className="h-6 w-6 text-primary-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{userStats.completedQuizzes.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-chart-2 text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.stats.averageAccuracy}</CardTitle>
            <Target className="h-6 w-6 text-primary-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{averageAccuracy}%</div>
          </CardContent>
        </Card>
        <Card className="bg-violet-600 text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.stats.totalXp}</CardTitle>
            <Zap className="h-6 w-6 text-primary-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{userStats.xp}</div>
          </CardContent>
        </Card>
        <Card className="bg-chart-1 text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.stats.streakDays}</CardTitle>
            <CalendarDays className="h-6 w-6 text-primary-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{userStats.streak}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Star className="mr-2" />{t.stats.levelProgress}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between font-bold">
              <span>{t.stats.level} {userStats.level}</span>
              {nextLevelInfo && <span>{userStats.xp}/{xpForNextLevel} XP</span>}
            </div>
            {nextLevelInfo ? (
              <>
                <Progress value={levelProgress} />
                <p className="text-sm text-muted-foreground">{t.stats.xpToNextLevel.replace('{xp}', String(xpForNextLevel - userStats.xp))}</p>
              </>
            ) : (
                <p className="text-sm text-muted-foreground">{t.stats.maxLevel}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Award className="mr-2" />{t.profile.badgesTitle}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-2">
             <p className="text-5xl font-bold">{badgesEarned}</p>
             <p className="text-muted-foreground mt-1 mb-2">{t.stats.badgesObtained}</p>
             <Badge variant="outline">{badgeTier}</Badge>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold font-headline mb-4">{t.stats.performanceSummary}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-semibold text-muted-foreground">{t.stats.quizAverage}</p>
              <p className="text-4xl font-bold text-primary">{quizAverageXp}</p>
              <p className="text-xs text-muted-foreground">{t.stats.xpPerQuiz}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-semibold text-muted-foreground">{t.stats.currentLevel}</p>
              <p className="text-4xl font-bold text-accent">{userStats.level}</p>
              <p className="text-xs text-muted-foreground">{t.stats.basedOnXp}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-semibold text-muted-foreground">{t.stats.nextGoal}</p>
              <p className="text-4xl font-bold text-violet-500">{nextLevelInfo ? nextLevelInfo.xpRequired : 'MAX'}</p>
               {nextLevelInfo && <p className="text-xs text-muted-foreground">{t.stats.xpForLevel2.replace('{level}', String(userStats.level + 1))}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}