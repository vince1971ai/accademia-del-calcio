'use client';

import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit, Target, Zap, CalendarDays, Star, Award, BarChart3, ListChecks, CalendarCheck, Megaphone, Trash2, ClipboardList, CheckCircle } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { collection, query, orderBy, onSnapshot, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import { Spinner } from '../loader';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { useAuth } from '@/context/auth-context';
import { adminEmails } from '@/lib/config';
import { Button } from '../ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { allMissions } from '@/lib/missions-data';
import { allBadgeData } from '@/context/user-data-context';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Image from 'next/image';
import { deleteObject, ref } from 'firebase/storage';

interface AnnouncementAuthor {
  uid: string;
  name: string;
  avatar: string;
}

interface Announcement {
    id: string;
    title: string;
    category: 'training' | 'match' | 'friendly' | 'communication' | 'information';
    text: string;
    date: Timestamp;
    author: AnnouncementAuthor;
    imageUrl?: string;
}

export function HomeView() {
  const { t, language } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { userStats } = useUserData();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const isAdmin = user ? adminEmails.includes(user.email ?? '') : false;

  useEffect(() => {
    const q = query(collection(db, 'coach_announcements'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const announcementsData: Announcement[] = [];
        querySnapshot.forEach((doc) => {
            announcementsData.push({ id: doc.id, ...doc.data() } as Announcement);
        });
        setAnnouncements(announcementsData);
        setLoadingAnnouncements(false);
    });

    return () => unsubscribe();
  }, []);

  if (authLoading || !userStats) {
      return (
          <div className="flex justify-center items-center h-full">
              <Spinner />
          </div>
      )
  }

  const {
      averageAccuracy,
      badgesEarned,
      levelProgress,
      xpForNextLevel,
      currentLevelInfo,
  } = userStats;

  const LevelIcon = currentLevelInfo.icon;


  const handleDelete = async (announcement: Announcement) => {
    setIsDeleting(announcement.id);
    try {
        // Delete image from storage if it exists
        if (announcement.imageUrl) {
            const imageRef = ref(storage, announcement.imageUrl);
            await deleteObject(imageRef).catch(error => {
                // Ignore 'object-not-found' error if the file doesn't exist
                if (error.code !== 'storage/object-not-found') {
                    throw error;
                }
            });
        }
        // Delete announcement document from Firestore
        await deleteDoc(doc(db, 'coach_announcements', announcement.id));
        
        toast({
            title: "Annuncio eliminato",
            description: "L'annuncio è stato rimosso con successo.",
        });
    } catch (error) {
        console.error("Errore during l'eliminazione dell'annuncio:", error);
        toast({
            variant: "destructive",
            title: "Errore",
            description: "Impossibile eliminare l'annuncio.",
        });
    } finally {
        setIsDeleting(null);
    }
  }

  let badgeTier = t.stats.beginner;
  if (badgesEarned >= 20) {
    badgeTier = t.stats.master;
  } else if (badgesEarned >= 10) {
    badgeTier = t.stats.expert;
  } else if (badgesEarned >= 5) {
    badgeTier = t.stats.adept;
  }

  const getCategoryStyle = (category: Announcement['category']) => {
    switch (category) {
        case 'training':
            return { variant: 'secondary' as const };
        case 'match':
            return { variant: 'destructive' as const };
        case 'friendly':
            return { variant: 'default' as const, className: 'bg-blue-600 hover:bg-blue-700' };
        case 'communication':
            return { variant: 'default' as const, className: 'bg-purple-600 hover:bg-purple-700' };
        case 'information':
            return { variant: 'outline' as const };
        default:
            return { variant: 'outline' as const };
    }
  };

  const getDisplayDate = (date: Date) => {
    const locale = language === 'it' ? it : enUS;
    return format(date, "PPP p", { locale });
  };
  
  const eventTypeMap: Record<Announcement['category'], string> = {
    training: t.home.calendar.types.training,
    match: t.home.calendar.types.match,
    friendly: t.home.calendar.types.friendly,
    communication: t.home.calendar.types.communication,
    information: t.home.calendar.types.information,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">
          {t.home.welcomeTitle.replace('{name}', userStats.profile.name)}
        </h1>
        <p className="text-muted-foreground mt-2">{t.home.welcomeSubtitle}</p>
      </div>

      <div className="space-y-8">
        <div className="text-center">
            <h2 className="text-2xl font-bold font-headline flex items-center justify-center gap-3">
              <Megaphone className="h-7 w-7 text-primary"/>
              {t.home.calendar.upcomingEvents}
            </h2>
        </div>
        <div className="lg:col-span-3 space-y-4">
            {loadingAnnouncements ? (
                <div className="flex justify-center items-center h-40">
                    <Spinner />
                </div>
            ) : announcements.length > 0 ? (
                <div className="space-y-4">
                    {announcements.map((event) => {
                        const style = getCategoryStyle(event.category);
                        return (
                            <Card key={event.id}>
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-4">
                                    <Avatar>
                                      <AvatarImage src={event.author?.avatar} alt={event.author?.name} />
                                      <AvatarFallback><ClipboardList className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                          <div className="flex items-baseline gap-2">
                                            <p className="font-semibold">{event.author?.name || 'Mister'}</p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <p className="text-xs text-muted-foreground">{getDisplayDate(event.date.toDate())}</p>
                                            {isAdmin && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isDeleting === event.id}>
                                                            {isDeleting === event.id ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t.admin.announcement.deleteConfirmTitle}</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {t.admin.announcement.deleteConfirmDesc}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>{t.profile.cancel}</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(event)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                                {t.admin.announcement.deleteButton}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                           )}
                                          </div>
                                      </div>
                                       {event.imageUrl && (
                                        <div className="mt-2 relative aspect-video w-full rounded-lg overflow-hidden border">
                                            <Image src={event.imageUrl} alt={event.title} layout="fill" objectFit="cover" />
                                        </div>
                                       )}
                                      <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                          <h3 className="font-bold text-lg">{event.title}</h3>
                                          <Badge variant={style.variant} className={cn(style.className, "text-xs")}>{eventTypeMap[event.category]}</Badge>
                                        </div>
                                        <p className="text-card-foreground/90 whitespace-pre-wrap">{event.text}</p>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-4 pt-4">
                        <p className="text-center text-muted-foreground py-8">Nessun annuncio dal mister per ora.</p>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
      
       <Card className="bg-gradient-to-tr from-card to-primary/10">
        <CardContent className="p-6 text-center">
          <div className="flex justify-center items-center gap-4 mb-4">
             <LevelIcon className="h-10 w-10 text-primary drop-shadow-[0_2px_4px_hsl(var(--primary)/0.5)]" />
            <div>
              <p className="text-sm text-muted-foreground">{t.stats.currentLevel}</p>
              <h2 className="text-3xl font-bold font-headline text-primary">
                {t.careerLevels[currentLevelInfo.nameKey as keyof typeof t.careerLevels]}
              </h2>
            </div>
          </div>
          
           {xpForNextLevel > userStats.xp ? (
            <>
              <Progress value={levelProgress} className="h-2 my-2"/>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{userStats.xp} XP</span>
                <span>{t.stats.xpToNextLevel.replace('{xp}', String(xpForNextLevel - userStats.xp))}</span>
                <span>{xpForNextLevel} XP</span>
              </div>
            </>
          ) : (
             <div className="flex justify-center items-center gap-2 text-primary">
              <Award className="h-5 w-5"/>
              <p className="font-semibold">{t.stats.maxLevel}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ListChecks className="mr-2 h-6 w-6 text-primary" />
            {t.home.missions.title}
          </CardTitle>
          <CardDescription>{t.home.missions.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TooltipProvider>
            {Object.values(allMissions).map((mission) => {
              const isCompleted = userStats.completedMissions.includes(mission.id);
              const progress = mission.progress ? mission.progress(userStats) : { current: 0, total: 1 };
              const progressPercentage = (progress.current / progress.total) * 100;
              const rewardBadge = mission.reward.badgeId ? allBadgeData[mission.reward.badgeId] : null;

              return (
                <div key={mission.id} className={cn("p-3 rounded-lg border", isCompleted ? "bg-green-100/50 dark:bg-green-900/20 border-green-500/50" : "bg-muted/40")}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{t.quizQuestions[mission.titleKey as keyof typeof t.quizQuestions]}</h4>
                    {isCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{t.quizQuestions[mission.descriptionKey as keyof typeof t.quizQuestions]}</p>
                  
                  {!isCompleted && (
                    <>
                      <Progress value={progressPercentage} className="h-2 mb-1" />
                      <p className="text-xs text-muted-foreground text-right">{progress.current} / {progress.total}</p>
                    </>
                  )}

                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm font-semibold text-primary">{t.home.missions.reward}:</span>
                    <div className="flex items-center gap-4">
                      {mission.reward.xp && <Badge variant="secondary">+{mission.reward.xp} XP</Badge>}
                      {rewardBadge && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Award className="h-3 w-3" /> Badge
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-bold">{(t.quizQuestions as any)[rewardBadge.nameKey].name}</p>
                            <p className="text-xs">{(t.quizQuestions as any)[rewardBadge.nameKey].description}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </TooltipProvider>
        </CardContent>
      </Card>
      
      <Separator />

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
        <Card>
          <CardHeader className="pb-2">
            <BrainCircuit className="h-6 w-6 mx-auto text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{userStats.completedQuizzes.length}</p>
            <p className="text-xs text-muted-foreground">{t.stats.quizzesCompleted}</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="pb-2">
            <Target className="h-6 w-6 mx-auto text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{averageAccuracy}%</p>
            <p className="text-xs text-muted-foreground">{t.stats.averageAccuracy}</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="pb-2">
            <Award className="h-6 w-6 mx-auto text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{badgesEarned}</p>
            <p className="text-xs text-muted-foreground">{t.stats.badgesObtained}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CalendarCheck className="h-6 w-6 mx-auto text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{userStats.streak}</p>
            <p className="text-xs text-muted-foreground">{t.stats.streakDays}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}