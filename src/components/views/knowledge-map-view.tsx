'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useUserData } from '@/context/user-data-context';
import type { Quiz, CategoryId, QuizCategory, GlossaryTerm } from '@/lib/quiz-data';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Spinner } from '../loader';
import { BookMarked, ShieldQuestion, Trophy, CheckCircle2, Lock, Apple, MessageSquareQuote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function useQuizzesAndCategories() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [categories, setCategories] = useState<QuizCategory[]>([]);
    const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const categoriesCol = collection(db, 'quizCategories');
                const categoriesSnapshot = await getDocs(categoriesCol);
                const categoriesList = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizCategory)).sort((a, b) => a.order - b.order);
                setCategories(categoriesList);

                const quizzesCol = collection(db, 'quizzes');
                const quizzesSnapshot = await getDocs(quizzesCol);
                const quizzesList = quizzesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
                setQuizzes(quizzesList);
                
                const glossaryCol = collection(db, 'glossary');
                const glossarySnapshot = await getDocs(glossaryCol);
                const glossaryList = glossarySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GlossaryTerm));
                setGlossary(glossaryList);
            } catch (error) {
                console.error("Error fetching data: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { quizzes, categories, glossary, loading };
}

const categoryIcons: Record<CategoryId | 'last_word', React.ElementType> = {
  rules: ShieldQuestion,
  tactics: Trophy,
  history: BookMarked,
  nutrition: Apple,
  last_word: MessageSquareQuote,
};


export function KnowledgeMapView() {
  const { t } = useTranslation();
  const { userStats } = useUserData();
  const { quizzes, categories, glossary, loading } = useQuizzesAndCategories();

  if (loading || !userStats) {
    return <div className="flex justify-center items-center h-64"><Spinner className="h-8 w-8" /></div>
  }
  
  const quizzesByCategory = categories.reduce((acc, category) => {
    acc[category.id as CategoryId] = quizzes.filter(q => q.categoryId === category.id);
    return acc;
  }, {} as Record<CategoryId, Quiz[]>);

  const allCategories = [
      ...categories,
      { id: 'last_word', name: t.iq.last_word.category, order: 99 }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">{t.nav.knowledgeMap}</h1>
        <p className="text-muted-foreground mt-2">{t.nav.knowledgeMapDescription}</p>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {allCategories.map(category => {
          const isLastWord = category.id === 'last_word';
          const Icon = categoryIcons[category.id as CategoryId | 'last_word'];
          
          let items: { id: string; titleKey: string; isCompleted: boolean; }[];
          
          if (isLastWord) {
            items = glossary.map(term => ({
              id: term.id,
              titleKey: term.termKey,
              isCompleted: userStats.correctlyAnsweredTerms.includes(term.id),
            }));
          } else {
            items = (quizzesByCategory[category.id as CategoryId] || []).map(quiz => ({
              id: quiz.id,
              titleKey: quiz.titleKey,
              isCompleted: userStats.completedQuizzes.includes(quiz.id),
            }));
          }

          const completedCount = items.filter(i => i.isCompleted).length;
          const totalCount = items.length;

          return (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Icon className="w-8 h-8 text-primary" />
                  <CardTitle className="text-2xl font-headline">
                      {isLastWord ? category.name : t.iq.categories[category.id as keyof typeof t.iq.categories]}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {completedCount} / {totalCount} {isLastWord ? 'termini indovinati' : t.stats.quizzesCompleted.toLowerCase()}
                </p>
                <TooltipProvider>
                  <div className="flex flex-wrap gap-2">
                    {items.map(item => (
                        <Tooltip key={item.id}>
                          <TooltipTrigger>
                            <div className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center border-2", 
                              item.isCompleted ? "bg-green-500 border-green-600" : "bg-muted border-border"
                            )}>
                              {item.isCompleted ? <CheckCircle2 className="h-4 w-4 text-white" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isLastWord ? t.iq.glossary[item.titleKey as keyof typeof t.iq.glossary] : t.quizQuestions[item.titleKey as keyof typeof t.quizQuestions]}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                  </div>
                </TooltipProvider>
              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  )
}