'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, Award, Clock, Lightbulb } from 'lucide-react';

import type { Quiz } from '@/lib/quiz-data';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export type QuizMode = 'challenge' | 'study' | 'training';

interface QuizRunnerProps {
  quiz: Quiz;
  mode: QuizMode;
  onComplete: (score: number, totalXp: number, totalQuestions: number) => void;
  onExit: () => void;
}

export function QuizRunner({ quiz, mode, onComplete, onExit }: QuizRunnerProps) {
  const { t } = useTranslation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>(Array(quiz.questions.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimitSeconds ?? 0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isTimedMode = mode === 'challenge' || mode === 'training';

  useEffect(() => {
    if (isFinished || !isTimedMode || !quiz.timeLimitSeconds) {
        return;
    }

    const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
            if (prevTime <= 1) {
                clearInterval(timer);
                finishQuiz();
                return 0;
            }
            return prevTime - 1;
        });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, quiz.timeLimitSeconds, isTimedMode]);

  const useFiftyFifty = () => {
    if (fiftyFiftyUsed) return;
    
    const incorrectOptions = currentQuestion.optionsKey
        .map((_, index) => index)
        .filter(index => index !== currentQuestion.correctAnswerIndex);
    
    // Shuffle and pick two to hide
    const shuffled = incorrectOptions.sort(() => 0.5 - Math.random());
    setHiddenOptions(shuffled.slice(0, 2));
    setFiftyFiftyUsed(true);
  };


  const finishQuiz = () => {
      if (isFinished) return;
      setIsFinished(true);
      if (mode !== 'study') {
        onComplete(score, totalXp, quiz.questions.length);
      }
  }

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswerIndex;
    if (mode !== 'study') {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = isCorrect;
      setAnswers(newAnswers);

      let newScore = score;
      let newXp = totalXp;

      if (isCorrect) {
        newScore += 1;
        newXp += currentQuestion.xp;
      }
      
      setScore(newScore);
      setTotalXp(newXp);
    }
    
    if (mode === 'study') {
        setShowAnswer(true);
        setTimeout(() => {
            setShowAnswer(false);
            setSelectedAnswer(null);
            setHiddenOptions([]);
            if (currentQuestionIndex < quiz.questions.length - 1) {
              setCurrentQuestionIndex(i => i + 1);
            } else {
              finishQuiz();
            }
        }, 2000); // Show answer for 2 seconds
    } else {
       setSelectedAnswer(null);
       setHiddenOptions([]);
       if (currentQuestionIndex < quiz.questions.length - 1) {
         setCurrentQuestionIndex(i => i + 1);
       } else {
         finishQuiz();
       }
    }
  };

  const progressPercentage = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  if (isFinished) {
    const percentage = Math.round((score / quiz.questions.length) * 100);

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline">
                {mode === 'study' ? t.quizRunner.studyComplete : t.quizRunner.resultsTitle}
            </CardTitle>
            <CardDescription>{t.quizQuestions[quiz.titleKey as keyof typeof t.quizQuestions]}</CardDescription>
          </CardHeader>
          {mode !== 'study' && (
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center">
                  <div 
                      className={`text-7xl font-bold ${percentage >= 75 ? 'text-accent' : percentage >= 50 ? 'text-primary' : 'text-destructive'}`}
                  >
                      {percentage}%
                  </div>
                  <p className="text-2xl font-semibold text-muted-foreground mt-1">
                      {t.quizRunner.scoreText.replace('{score}', String(score)).replace('{total}', String(quiz.questions.length))}
                  </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-accent/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">{t.quizRunner.correct}</p>
                    <p className="text-2xl font-bold text-accent">{score}</p>
                </div>
                <div className="p-4 bg-destructive/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">{t.quizRunner.incorrect}</p>
                    <p className="text-2xl font-bold text-destructive">{quiz.questions.length - score}</p>
                </div>
              </div>

              <div className="flex justify-center items-center text-xl font-semibold">
                  <Award className="w-6 h-6 mr-2 text-[hsl(var(--chart-4))]" />
                  <span>+ {totalXp} XP</span>
              </div>
              <Separator />
              <div className="flex justify-center gap-2 flex-wrap">
                {answers.map((isCorrect, index) => (
                  isCorrect ? <CheckCircle2 key={index} className="text-accent" /> : <XCircle key={index} className="text-destructive" />
                ))}
              </div>
            </CardContent>
          )}
          <CardFooter>
            <Button onClick={onExit} className="w-full">{t.quizRunner.backToQuizzes}</Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center mb-4">
            {(isTimedMode && quiz.timeLimitSeconds) ? (
                <div className="flex items-center gap-2 text-lg font-semibold tabular-nums" >
                    <Clock className={cn("h-6 w-6", timeLeft < 10 && !isFinished ? "text-destructive animate-pulse" : "text-muted-foreground")} />
                    <span className={cn(timeLeft < 10 && !isFinished ? "text-destructive animate-pulse" : "")}>
                        {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                    </span>
                </div>
            ) : (
                 <div className="flex items-center gap-2 text-lg font-semibold">
                    <Lightbulb className="h-6 w-6 text-muted-foreground"/>
                    <span>{t.quizRunner.studyMode}</span>
                 </div>
            )}
            <div className="text-right flex-1">
                <CardTitle className="font-headline text-2xl">{t.quizQuestions[quiz.titleKey as keyof typeof t.quizQuestions]}</CardTitle>
                <CardDescription>{t.quizRunner.question} {currentQuestionIndex + 1} / {quiz.questions.length}</CardDescription>
            </div>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-lg font-semibold mb-6">{t.quizQuestions[currentQuestion.questionKey]}</p>
            <RadioGroup 
                onValueChange={(value) => setSelectedAnswer(parseInt(value))} 
                value={selectedAnswer !== null ? String(selectedAnswer) : ''}
                disabled={showAnswer}
            >
              {currentQuestion.optionsKey.map((optionKey, index) => {
                const isCorrectAnswer = index === currentQuestion.correctAnswerIndex;
                const isSelectedAnswer = index === selectedAnswer;
                const isHidden = hiddenOptions.includes(index);

                return (
                    <div 
                        key={index} 
                        className={cn(
                            "flex items-center space-x-2 p-3 rounded-lg border has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10 transition-colors",
                            showAnswer && isCorrectAnswer && 'border-green-500 bg-green-100/50 dark:bg-green-900/30',
                            showAnswer && isSelectedAnswer && !isCorrectAnswer && 'border-destructive bg-red-100/50 dark:bg-red-900/30',
                            isHidden && 'hidden'
                        )}
                    >
                      <RadioGroupItem value={String(index)} id={`q${currentQuestionIndex}-o${index}`} />
                      <Label htmlFor={`q${currentQuestionIndex}-o${index}`} className="flex-1 text-base cursor-pointer">
                        {t.quizQuestions[optionKey]}
                      </Label>
                    </div>
                )
              })}
            </RadioGroup>
          </motion.div>
        </AnimatePresence>
      </CardContent>
      <CardFooter className="flex justify-between">
        {mode === 'training' && (
            <Button variant="outline" onClick={useFiftyFifty} disabled={fiftyFiftyUsed || selectedAnswer !== null}>
                50/50 <Sparkles className="ml-2 h-4 w-4"/>
            </Button>
        )}
        <div></div>
        <Button onClick={handleNextQuestion} disabled={selectedAnswer === null || showAnswer}>
          {currentQuestionIndex < quiz.questions.length - 1 ? t.quizRunner.next : t.quizRunner.submit}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
