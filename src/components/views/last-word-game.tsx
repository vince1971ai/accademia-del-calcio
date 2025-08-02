'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useUserData } from '@/context/user-data-context';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { GlossaryTerm } from '@/lib/quiz-data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/loader';
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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

export function LastWordGame({ onExit }: { onExit: () => void }) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { userStats, completeQuiz, updateUserStats } = useUserData();
    const { glossaryItems, loading } = useGlossary();
    const [shuffledTerms, setShuffledTerms] = useState<GlossaryTerm[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [score, setScore] = useState(0);
    const [xp, setXp] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [answerState, setAnswerState] = useState<'correct' | 'incorrect' | 'idle'>('idle');
    const [lastXpGained, setLastXpGained] = useState<number | null>(null);

    useEffect(() => {
        if (!loading && glossaryItems.length > 0) {
            setShuffledTerms([...glossaryItems].sort(() => Math.random() - 0.5));
        }
    }, [loading, glossaryItems]);

    const currentTerm = shuffledTerms[currentIndex];
    const currentQuestion = currentTerm ? t.iq.glossary[currentTerm.defKey as keyof typeof t.iq.glossary] : '';
    const correctAnswer = currentTerm ? t.iq.glossary[currentTerm.termKey as keyof typeof t.iq.glossary] : '';
    
    const getXpForTerm = (term: string): number => {
        if (term.length > 15) return 30; // Hard
        if (term.length > 8) return 20; // Medium
        return 10; // Easy
    }

    const handleAnswerSubmit = async () => {
        if (!currentTerm || answerState !== 'idle' || !userStats) return;

        const isCorrect = answer.trim().toLowerCase() === correctAnswer.toLowerCase();

        if (isCorrect) {
            const gainedXp = getXpForTerm(correctAnswer);
            setLastXpGained(gainedXp);
            setAnswerState('correct');
            setScore(s => s + 1);
            setXp(x => x + gainedXp);

            // Update user stats with the correctly answered term
            if (!userStats.correctlyAnsweredTerms.includes(currentTerm.id)) {
                await updateUserStats({
                    correctlyAnsweredTerms: [...userStats.correctlyAnsweredTerms, currentTerm.id]
                });
            }
        } else {
            setLastXpGained(null);
            setAnswerState('incorrect');
        }

        setTimeout(() => {
            handleNext();
        }, 1500);
    };

    const handleNext = () => {
        if (currentIndex < shuffledTerms.length - 1) {
            setCurrentIndex(i => i + 1);
            setAnswer('');
            setAnswerState('idle');
            setLastXpGained(null);
        } else {
            setIsFinished(true);
            completeQuiz('last_word_game', score, xp, shuffledTerms.length);
        }
    };
    
    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner className="w-8 h-8"/></div>;
    }
    
    if (isFinished) {
         return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="text-center">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold font-headline">{t.iq.last_word.resultsTitle}</CardTitle>
                        <CardDescription>{t.iq.last_word.resultsSubtitle}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-5xl font-bold">{score} / {shuffledTerms.length}</p>
                        <div className="flex justify-center items-center text-xl font-semibold">
                            <Sparkles className="w-6 h-6 mr-2 text-primary" />
                            <span>+ {xp} XP</span>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={onExit} className="w-full">{t.quizRunner.backToQuizzes}</Button>
                    </CardFooter>
                </Card>
            </motion.div>
        );
    }

    if (!currentTerm) {
         return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p>{t.iq.glossary.noResults}</p>
                    <Button onClick={onExit} className="mt-4">Torna Indietro</Button>
                </CardContent>
            </Card>
        );
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">{t.iq.last_word.category}</CardTitle>
                <CardDescription>{t.quizRunner.question} {currentIndex + 1} / {shuffledTerms.length}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                    >
                        <p className="text-lg font-semibold text-center h-24 flex items-center justify-center">{currentQuestion}</p>
                    </motion.div>
                </AnimatePresence>
                <div className="relative">
                    <Input 
                        placeholder={t.iq.last_word.placeholder}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAnswerSubmit()}
                        disabled={answerState !== 'idle'}
                        className={cn(
                            'text-center text-lg h-12 transition-all',
                            answerState === 'correct' && 'border-green-500 ring-green-500 focus-visible:ring-green-500',
                            answerState === 'incorrect' && 'border-destructive ring-destructive focus-visible:ring-destructive'
                        )}
                    />
                    <AnimatePresence>
                    {answerState === 'correct' && (
                        <motion.div initial={{scale:0.5, opacity: 0}} animate={{scale:1, opacity: 1}} className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Check className="h-6 w-6 text-green-500"/>
                        </motion.div>
                    )}
                     {answerState === 'incorrect' && (
                        <motion.div initial={{scale:0.5, opacity: 0}} animate={{scale:1, opacity: 1}} className="absolute right-3 top-1/2 -translate-y-1/2">
                            <X className="h-6 w-6 text-destructive"/>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
                 {answerState === 'incorrect' && (
                    <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-center text-destructive font-semibold">
                       {t.iq.last_word.correctAnswerWas}: {correctAnswer}
                    </motion.p>
                )}
                 <div className="relative h-6">
                    <AnimatePresence>
                        {lastXpGained && (
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.5 }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <div className="text-lg font-bold text-primary flex items-center gap-1">
                                    <Sparkles className="h-5 w-5" /> +{lastXpGained} XP
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                 </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="ghost" onClick={onExit}>
                    <ArrowLeft className="mr-2"/>
                    {t.iq.last_word.exit}
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleNext} disabled={answerState !== 'idle'}>
                        {t.iq.last_word.skip}
                        <ArrowRight className="ml-2"/>
                    </Button>
                    <Button onClick={handleAnswerSubmit} disabled={answerState !== 'idle' || !answer}>
                        {t.quizRunner.submit}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
