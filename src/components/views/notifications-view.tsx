'use client';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Swords } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { Spinner } from '../loader';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { formatDistanceToNow } from 'date-fns';
import { it, enUS } from 'date-fns/locale';

interface Challenger {
    uid: string;
    name: string;
    avatar: string;
}

interface Challenge {
    id: string;
    challenger: Challenger;
    quizId: string;
    quizTitleKey: string;
    status: 'pending' | 'accepted' | 'completed' | 'declined';
    createdAt: Timestamp;
}

export function NotificationsView() {
    const { t, language } = useTranslation();
    const { user } = useAuth();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        };

        const challengesCol = collection(db, 'challenges');
        const q = query(
            challengesCol, 
            where('opponentId', '==', user.uid),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const challengesData: Challenge[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Safety check to ensure challenger data exists
                if (data.challenger && data.challenger.name) {
                    challengesData.push({ id: doc.id, ...data } as Challenge);
                }
            });
            // Sort client-side
            challengesData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            setChallenges(challengesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching challenges: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);


    const dateLocale = language === 'it' ? it : enUS;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center">
                <h1 className="text-3xl font-bold font-headline">{t.nav.notifications}</h1>
                <p className="text-muted-foreground mt-2">{t.notifications.subtitle}</p>
            </div>
            
            {loading ? (
                 <div className="flex justify-center items-center h-64"><Spinner className="h-8 w-8" /></div>
            ) : challenges.length > 0 ? (
                 <div className="space-y-4">
                    {challenges.map(challenge => (
                         <Card key={challenge.id}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <Swords className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p>
                                        <span className="font-bold">{challenge.challenger.name}</span> ti ha sfidato a un quiz su <span className="font-semibold">"{t.quizQuestions[challenge.quizTitleKey as keyof typeof t.quizQuestions]}"</span>.
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {challenge.createdAt ? formatDistanceToNow(challenge.createdAt.toDate(), { addSuffix: true, locale: dateLocale }) : ''}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm">Accetta</Button>
                                    <Button size="sm" variant="outline">Rifiuta</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-48">
                            <Bell className="h-12 w-12 mb-4" />
                            <p className="font-semibold">{t.notifications.noNotifications}</p>
                            <p className="text-sm">{t.notifications.noNotificationsDesc}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

        </div>
    );
}