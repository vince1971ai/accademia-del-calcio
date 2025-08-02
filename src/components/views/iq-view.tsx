'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BookMarked, ShieldQuestion, Swords, Search, Play, Trophy, CheckCircle2, Star, Lightbulb, MessageSquareQuote } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';
import type { Quiz, CategoryId, GlossaryTerm, QuizCategory } from '@/lib/quiz-data';
import { QuizRunner, type QuizMode } from '@/components/quiz-runner';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Spinner } from '../loader';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { LastWordGame } from './last-word-game';

// Custom Hook to fetch glossary
function useGlossary() {
    const [glossaryItems, setGlossaryItems] = useState<GlossaryTerm[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGlossary = async () => {
            try {
                const glossaryCol = collection(db, 'glossary');
                const glossarySnapshot = await getDocs(glossaryCol);
                const glossaryList = glossarySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GlossaryTerm));
                setGlossaryItems(glossaryList);
            } catch (error) {
                console.error("Error fetching glossary: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGlossary();
    }, []);

    return { glossaryItems, loading };
}

// Custom Hook to fetch quizzes and categories
function useQuizzes() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [quizzesByCategory, setQuizzesByCategory] = useState<Record<CategoryId | string, Quiz[]>>({});
    const [quizCategories, setQuizCategories] = useState<QuizCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const categoriesCol = collection(db, 'quizCategories');
                const categoriesSnapshot = await getDocs(categoriesCol);
                const categoriesList = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizCategory)).sort((a, b) => a.order - b.order);
                

                const quizzesCol = collection(db, 'quizzes');
                const quizzesSnapshot = await getDocs(quizzesCol);
                const quizzesList = quizzesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
                setQuizzes(quizzesList);
                
                const groupedQuizzes: Record<CategoryId | string, Quiz[]> = categoriesList.reduce((acc, cat) => {
                    acc[cat.id as CategoryId] = quizzesList.filter(q => q.categoryId === cat.id);
                    return acc;
                }, {} as Record<CategoryId, Quiz[]>);

                setQuizzesByCategory(groupedQuizzes);
                setQuizCategories(categoriesList);

            } catch (error) {
                console.error("Error fetching quizzes: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuizzes();
    }, []);

    return { quizzes, quizzesByCategory, quizCategories, loading };
}

// Custom Hook to fetch users
function useUsers() {
    const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        const fetchUsers = async () => {
            if (!user) return;
            const usersCol = collection(db, 'users');
            const usersSnapshot = await getDocs(usersCol);
            const usersList = usersSnapshot.docs
                .map(doc => ({ id: doc.id, name: doc.data().profile.name }))
                .filter(u => u.id !== user.uid); // Exclude current user
            setUsers(usersList);
        };

        fetchUsers();
    }, [user]);

    return { users };
}

const categoryIcons: Record<CategoryId | string, React.ElementType> = {
  rules: ShieldQuestion,
  tactics: Trophy,
  history: BookMarked,
  nutrition: BookMarked, // Replace with a better icon if available
  last_word: MessageSquareQuote,
};


export function IqView() {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const { completeQuiz, userStats } = useUserData();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeGame, setActiveGame] = useState<'quiz' | 'last_word' | null>(null);
  const [quizMode, setQuizMode] = useState<QuizMode>('challenge');
  const [isChallengeDialogOpen, setIsChallengeDialogOpen] = useState(false);
  const [selectedQuizForChallenge, setSelectedQuizForChallenge] = useState<string>('');
  const [selectedOpponent, setSelectedOpponent] = useState<string>('');
  const [isSendingChallenge, setIsSendingChallenge] = useState(false);
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);


  const { glossaryItems, loading: glossaryLoading } = useGlossary();
  const { quizzes, quizzesByCategory, quizCategories, loading: quizzesLoading } = useQuizzes();
  const { users } = useUsers();

  const handleSendChallenge = async () => {
    if (!selectedQuizForChallenge || !selectedOpponent || !user || !userStats) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: 'Assicurati di aver selezionato un quiz e un avversario.',
      });
      return;
    }
    setIsSendingChallenge(true);
    try {
      const selectedQuizInfo = quizzes.find(q => q.id === selectedQuizForChallenge);
      if (!selectedQuizInfo) {
        throw new Error('Quiz non trovato');
      }

      await addDoc(collection(db, 'challenges'), {
        quizId: selectedQuizForChallenge,
        quizTitleKey: selectedQuizInfo.titleKey,
        challenger: {
          uid: user.uid,
          name: userStats.profile.name,
          avatar: userStats.profile.avatar,
        },
        opponentId: selectedOpponent,
        status: 'pending',
        createdAt: serverTimestamp(),
        challengerScore: null,
        opponentScore: null,
        winnerId: null,
      });

      toast({
        title: 'Sfida Inviata!',
        description: 'Il tuo avversario riceverà una notifica.',
      });

      setIsChallengeDialogOpen(false);
      setSelectedQuizForChallenge('');
      setSelectedOpponent('');
    } catch (error) {
      console.error('Error sending challenge:', error);
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: 'Impossibile inviare la sfida. Riprova.',
      });
    } finally {
      setIsSendingChallenge(false);
    }
  };


  const filteredGlossary = glossaryItems.filter(item => {
    const termText = t.iq.glossary[item.termKey as keyof typeof t.iq.glossary];
    const defText = t.iq.glossary[item.defKey as keyof typeof t.iq.glossary];
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    let termMatch = false;
    if (termText) {
        termMatch = termText.toLowerCase().includes(lowerCaseSearchTerm);
    }

    let defMatch = false;
    if (defText) {
        defMatch = defText.toLowerCase().includes(lowerCaseSearchTerm);
    }
    
    return termMatch || defMatch;
  }).sort((a, b) => {
    const termA = t.iq.glossary[a.termKey as keyof typeof t.iq.glossary] || '';
    const termB = t.iq.glossary[b.termKey as keyof typeof t.iq.glossary] || '';
    return termA.localeCompare(termB, language);
  });


  const handleQuizComplete = (score: number, totalXp: number, totalQuestions: number) => {
    if (activeQuiz) {
      completeQuiz(activeQuiz.id, score, totalXp, totalQuestions);
    }
    // The QuizRunner component is responsible for showing the results.
    // It will call the onExit callback when the user is ready to go back to the quiz list.
  };

  const startQuiz = (quiz: Quiz, mode: QuizMode) => {
    setQuizMode(mode);
    setActiveQuiz(quiz);
    setActiveGame('quiz');
    setIsPlayModalOpen(false);
  }
  
  if (activeGame === 'quiz' && activeQuiz) {
    return (
      <QuizRunner 
        quiz={activeQuiz} 
        mode={quizMode}
        onComplete={handleQuizComplete}
        onExit={() => setActiveGame(null)} 
      />
    );
  }
  
  if (activeGame === 'last_word') {
    return <LastWordGame onExit={() => setActiveGame(null)} />;
  }

  const allCategories = [
      ...quizCategories,
      { id: 'last_word', name: t.iq.last_word.category, order: 99 }
  ];

  const lastWordQuiz: Quiz = {
      id: 'last_word_game',
      titleKey: 'last_word_title',
      descriptionKey: 'last_word_desc',
      difficulty: 'Medium',
      categoryId: 'last_word',
      questions: []
  };

  const allQuizzesByCategory = {
      ...quizzesByCategory,
      'last_word': [lastWordQuiz]
  }

  const difficultyColors: Record<Quiz['difficulty'], string> = {
    'Easy': 'bg-green-200 text-green-800 border-green-300 dark:bg-green-800/50 dark:text-green-200 dark:border-green-700',
    'Medium': 'bg-yellow-200 text-yellow-800 border-yellow-300 dark:bg-yellow-800/50 dark:text-yellow-200 dark:border-yellow-700',
    'Hard': 'bg-red-200 text-red-800 border-red-300 dark:bg-red-800/50 dark:text-red-200 dark:border-red-700',
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
        <div className="text-center">
            <h1 className="text-3xl font-bold font-headline">{t.iq.title}</h1>
            <p className="text-muted-foreground mt-2">{t.iq.subtitle}</p>
        </div>
        <Tabs defaultValue="quizzes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="quizzes"><ShieldQuestion className="w-4 h-4 mr-2" />{t.iq.quizzes.tab}</TabsTrigger>
                <TabsTrigger value="glossary"><BookMarked className="w-4 h-4 mr-2" />{t.iq.glossary.tab}</TabsTrigger>
                <TabsTrigger value="challenges"><Swords className="w-4 h-4 mr-2" />{t.iq.challenges.tab}</TabsTrigger>
            </TabsList>
            <TabsContent value="quizzes" className="mt-6">
                {quizzesLoading ? <div className="flex justify-center items-center p-8"><Spinner className="w-8 h-8"/></div> : (
                  <Accordion type="multiple" className="w-full space-y-4">
                    {allCategories.map(category => {
                      const Icon = categoryIcons[category.id as CategoryId];
                      const quizzesForCategory = allQuizzesByCategory[category.id as CategoryId | string] || [];
                      return (
                        <AccordionItem key={category.id} value={category.id} className="border rounded-lg bg-card">
                          <AccordionTrigger className="font-headline text-xl p-4 hover:no-underline">
                            <div className="flex items-center">
                              <Icon className="w-6 h-6 mr-3 text-primary" />
                              {category.id === 'last_word' ? category.name : t.iq.categories[category.id as keyof typeof t.iq.categories]}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="p-4 pt-0">
                            {quizzesForCategory.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {quizzesForCategory.map(quiz => {
                                    const isCompleted = userStats?.completedQuizzes.includes(quiz.id);
                                    const isLastWordGame = quiz.id === 'last_word_game';

                                    const titleText = isLastWordGame 
                                        ? t.iq.last_word.title 
                                        : t.quizQuestions[quiz.titleKey as keyof typeof t.quizQuestions];
                                    
                                    const descriptionText = isLastWordGame
                                        ? t.iq.last_word.description
                                        : t.quizQuestions[quiz.descriptionKey as keyof typeof t.quizQuestions];

                                    return (
                                    <Card key={quiz.id} className={cn('flex flex-col bg-background', isCompleted && !isLastWordGame ? 'opacity-70' : '')}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-xl md:text-2xl">{titleText}</CardTitle>
                                                <Badge className={cn("text-xs font-bold", difficultyColors[quiz.difficulty])}>
                                                {t.iq.difficulty[quiz.difficulty.toLowerCase() as keyof typeof t.iq.difficulty]}
                                                </Badge>
                                            </div>
                                            <CardDescription>{descriptionText}</CardDescription>
                                        </CardHeader>
                                        <CardFooter className="mt-auto">
                                            {isLastWordGame ? (
                                                <Button className="w-full" onClick={() => setActiveGame('last_word')}>
                                                    <Play className="mr-2 h-4 w-4" />
                                                    {t.iq.quizzes.start}
                                                </Button>
                                            ) : (
                                                <Dialog open={isPlayModalOpen && selectedQuiz?.id === quiz.id} onOpenChange={(open) => { if(!open) setSelectedQuiz(null); setIsPlayModalOpen(open);}}>
                                                    <DialogTrigger asChild>
                                                        <Button className="w-full" onClick={() => setSelectedQuiz(quiz)}>
                                                            {isCompleted ? (
                                                                <>
                                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                    {t.iq.quizzes.completed}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Play className="mr-2 h-4 w-4" />
                                                                    {t.iq.quizzes.start}
                                                                </>
                                                            )}
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>{t.iq.quizzes.selectMode}</DialogTitle>
                                                            <DialogDescription>{t.quizQuestions[quiz.titleKey as keyof typeof t.quizQuestions]}</DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid gap-4 py-4">
                                                            <Button variant="default" size="lg" onClick={() => startQuiz(quiz, 'challenge')}>
                                                                <Trophy className="mr-2 h-5 w-5"/>
                                                                <div>
                                                                    <p className="font-bold text-left">{t.iq.quizzes.challengeMode}</p>
                                                                    <p className="font-normal text-left text-sm">{t.iq.quizzes.challengeModeDesc}</p>
                                                                </div>
                                                            </Button>
                                                            <Button variant="secondary" size="lg" onClick={() => startQuiz(quiz, 'training')}>
                                                                <Star className="mr-2 h-5 w-5"/>
                                                                <div>
                                                                    <p className="font-bold text-left">{t.iq.quizzes.trainingMode}</p>
                                                                    <p className="font-normal text-left text-sm">{t.iq.quizzes.trainingModeDesc}</p>
                                                                </div>
                                                            </Button>
                                                            <Button variant="outline" size="lg" onClick={() => startQuiz(quiz, 'study')}>
                                                                <Lightbulb className="mr-2 h-5 w-5"/>
                                                                <div>
                                                                    <p className="font-bold text-left">{t.iq.quizzes.studyMode}</p>
                                                                    <p className="font-normal text-left text-sm">{t.iq.quizzes.studyModeDesc}</p>
                                                                </div>
                                                            </Button>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                        </CardFooter>
                                    </Card>
                                    )
                                })}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center p-4">Nessun quiz disponibile in questa categoria.</p>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                )}
            </TabsContent>
            <TabsContent value="glossary" className="mt-6">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder={t.iq.glossary.searchPlaceholder} 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 {glossaryLoading ? <div className="flex justify-center items-center p-8"><Spinner className="w-8 h-8"/></div> : (
                    <Accordion type="single" collapsible className="w-full">
                        {filteredGlossary.map(item => (
                            <AccordionItem key={item.id} value={item.id}>
                                <AccordionTrigger className="font-headline text-lg">{t.iq.glossary[item.termKey as keyof typeof t.iq.glossary]}</AccordionTrigger>
                                <AccordionContent className="text-base">
                                {t.iq.glossary[item.defKey as keyof typeof t.iq.glossary]}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                 )}
                 {!glossaryLoading && filteredGlossary.length === 0 && (
                    <p className="text-center text-muted-foreground mt-8">{t.iq.glossary.noResults}</p>
                )}
            </TabsContent>
            <TabsContent value="challenges" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t.iq.challenges.title}</CardTitle>
                        <CardDescription>{t.iq.challenges.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Placeholder for list of active/past challenges */}
                        <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                            <p>Le tue sfide appariranno qui.</p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Dialog open={isChallengeDialogOpen} onOpenChange={setIsChallengeDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full">
                                    <Swords className="mr-2 h-4 w-4" />
                                    {t.iq.challenges.cta}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Lancia una sfida</DialogTitle>
                                    <DialogDescription>
                                        Scegli un quiz e un avversario per iniziare un duello 1v1.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label htmlFor="quiz-select">Scegli il Quiz</label>
                                        <Select value={selectedQuizForChallenge} onValueChange={setSelectedQuizForChallenge}>
                                            <SelectTrigger id="quiz-select">
                                                <SelectValue placeholder="Seleziona un quiz..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {quizzes.map(quiz => (
                                                    <SelectItem key={quiz.id} value={quiz.id}>
                                                        {t.quizQuestions[quiz.titleKey as keyof typeof t.quizQuestions]}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                         <label htmlFor="opponent-select">Scegli l'Avversario</label>
                                         <Select value={selectedOpponent} onValueChange={setSelectedOpponent}>
                                            <SelectTrigger id="opponent-select">
                                                <SelectValue placeholder="Seleziona un compagno..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.map(u => (
                                                    <SelectItem key={u.id} value={u.id}>
                                                        {u.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setIsChallengeDialogOpen(false)}>Annulla</Button>
                                    <Button onClick={handleSendChallenge} disabled={!selectedQuizForChallenge || !selectedOpponent || isSendingChallenge}>
                                        {isSendingChallenge && <Spinner className="mr-2 h-4 w-4" />}
                                        Invia Sfida
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  )
}