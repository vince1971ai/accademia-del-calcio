'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Quiz } from '@/lib/quiz-data';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Crown } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Spinner } from '../loader';
import type { UserStats } from '@/context/user-data-context';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  score?: number;
  total?: number;
}

// Custom Hook to fetch quizzes
function useQuizzes() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const quizzesCol = collection(db, 'quizzes');
                const quizzesSnapshot = await getDocs(quizzesCol);
                const quizzesList = quizzesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
                setQuizzes(quizzesList);
            } catch (error) {
                console.error("Error fetching quizzes: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuizzes();
    }, []);

    return { quizzes, loading };
}

// Custom Hook to fetch leaderboards
function useLeaderboards() {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const usersCol = collection(db, 'users');
                const q = query(usersCol, orderBy('xp', 'desc'));
                const usersSnapshot = await getDocs(q);
                const usersList = usersSnapshot.docs.map(doc => {
                    const data = doc.data() as UserStats;
                    return {
                        id: doc.id,
                        name: data.profile.name,
                        avatar: data.profile.avatar,
                        xp: data.xp,
                    };
                });
                setLeaderboardData(usersList);
            } catch (error) {
                console.error("Error fetching user data for leaderboards: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    return { leaderboardData, loading };
}


export function LeaderboardsView() {
  const { t } = useTranslation();
  const { quizzes: allQuizzes, loading: quizzesLoading } = useQuizzes();
  const { leaderboardData, loading: leaderboardLoading } = useLeaderboards();
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');

  useEffect(() => {
    if (allQuizzes.length > 0 && !selectedQuizId) {
      setSelectedQuizId(allQuizzes[0].id);
    }
  }, [allQuizzes, selectedQuizId]);
  
  // NOTE: Weekly and By-Quiz leaderboards are currently placeholders using total XP.
  // A real implementation would require storing weekly XP and per-quiz scores in Firestore.
  const weeklyLeaderboard = [...leaderboardData].sort((a,b) => b.xp - a.xp);
  
  const getQuizLeaderboard = (quizId: string) => {
    const selectedQuiz = allQuizzes.find(q => q.id === quizId);
    if (!selectedQuiz) return [];

    // This is a placeholder. A real implementation would fetch specific scores for this quiz.
    // For now, we'll simulate a score based on total XP.
    return [...leaderboardData].map(user => ({
      ...user,
      score: Math.floor((user.xp / 10000) * selectedQuiz.questions.length), // Simulate score
      total: selectedQuiz.questions.length,
    })).sort((a, b) => b.score - a.score);
  }


  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-amber-400';
      case 2:
        return 'text-slate-400';
      case 3:
        return 'text-amber-700';
      default:
        return 'text-muted-foreground';
    }
  };
  
  const LeaderboardTable = ({ data, type }: { data: any[], type: 'xp' | 'score' }) => {
    if (leaderboardLoading) {
      return <div className="flex justify-center items-center p-8"><Spinner className="w-8 h-8"/></div>
    }
    
    return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">{t.leaderboards.rank}</TableHead>
              <TableHead>{t.leaderboards.player}</TableHead>
              <TableHead className="text-right">{type === 'xp' ? t.leaderboards.xp : t.leaderboards.score}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry, index) => (
              <TableRow key={entry.id}>
                <TableCell className={`font-bold text-lg ${getRankColor(index + 1)}`}>
                  <div className="flex items-center">
                      {index < 3 ? <Crown className="w-4 h-4 mr-1" /> : null}
                      {index + 1}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={entry.avatar} alt={entry.name} />
                      <AvatarFallback>{entry.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{entry.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {type === 'xp' ? entry.xp : `${entry.score} / ${entry.total}`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    )
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">{t.leaderboards.title}</h1>
        <p className="text-muted-foreground mt-2">{t.leaderboards.subtitle}</p>
      </div>

      <Tabs defaultValue="total" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="total">{t.leaderboards.totalScore}</TabsTrigger>
          <TabsTrigger value="weekly">{t.leaderboards.weekly}</TabsTrigger>
          <TabsTrigger value="quiz">{t.leaderboards.byQuiz}</TabsTrigger>
        </TabsList>
        <TabsContent value="total">
          <Card>
            <CardHeader>
              <CardTitle>{t.leaderboards.totalScore}</CardTitle>
            </CardHeader>
            <CardContent>
              <LeaderboardTable data={leaderboardData} type="xp" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle>{t.leaderboards.weekly}</CardTitle>
               <CardDescription>
                Nota: Questa classifica attualmente mostra il punteggio totale. Un vero sistema settimanale sarà implementato in futuro.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <LeaderboardTable data={weeklyLeaderboard} type="xp" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="quiz">
          <Card>
            <CardHeader>
              <CardTitle>{t.leaderboards.byQuiz}</CardTitle>
              <CardDescription>{t.leaderboards.selectQuiz}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quizzesLoading ? <div className="flex justify-center items-center p-8"><Spinner className="w-8 h-8"/></div> : (
                <>
                  <Select onValueChange={setSelectedQuizId} value={selectedQuizId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.leaderboards.selectQuizPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {allQuizzes.map(quiz => (
                        <SelectItem key={quiz.id} value={quiz.id}>
                          {t.quizQuestions[quiz.titleKey as keyof typeof t.quizQuestions]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedQuizId && (
                    <LeaderboardTable data={getQuizLeaderboard(selectedQuizId) || []} type="score" />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}