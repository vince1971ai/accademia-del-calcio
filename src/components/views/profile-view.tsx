'use client';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Award, Edit, Camera, Shield, Lock, CheckCircle2 } from 'lucide-react';
import { useUserData, type UserProfile } from '@/context/user-data-context';
import { allBadgeData } from '@/context/user-data-context';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  team: z.string().min(2, { message: 'Team name must be at least 2 characters.' }),
  position: z.enum(['Goalkeeper', 'Defender', 'Midfielder', 'Forward']),
  preferredFoot: z.enum(['left', 'right']),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileView() {
  const { t } = useTranslation();
  const { userStats, updateProfile } = useUserData();
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: userStats.profile,
  });

  useEffect(() => {
    form.reset(userStats.profile);
  }, [userStats.profile, form]);

  const onSubmit = (data: ProfileFormValues) => {
    updateProfile(data);
    toast({
      title: t.profile.successTitle,
      description: t.profile.successDescription,
    })
    setIsSheetOpen(false);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'teamLogo') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({
            variant: "destructive",
            title: t.profile.invalidFileTitle,
            description: t.profile.invalidFileDescription,
        });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        updateProfile({ [field]: dataUrl });
      }
    };
    reader.readAsDataURL(file);
    
    if(event.target) {
        event.target.value = '';
    }
  };

  const isGoalkeeper = userStats.profile.position === 'Goalkeeper';

  const penaltySuccessRate = isGoalkeeper 
    ? (userStats.penaltiesFaced > 0 ? (userStats.penaltiesSaved / userStats.penaltiesFaced) * 100 : 0)
    : (userStats.penaltiesTaken > 0 ? (userStats.penaltiesScored / userStats.penaltiesTaken) * 100 : 0);
  
  const allBadges = Object.values(allBadgeData);
  const badgesTranslations = t.quizQuestions as any;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col items-center text-center p-6 relative">
             <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute top-4 right-4">
                  <Edit className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <Avatar className="w-24 h-24 border-4 border-background shadow-lg mb-2" data-ai-hint="soccer player">
              <AvatarImage src={userStats.profile.avatar} alt={userStats.profile.name} />
              <AvatarFallback>{userStats.profile.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl font-headline">{userStats.profile.name}</CardTitle>
            <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 border" data-ai-hint="team logo shield">
                    <AvatarImage src={userStats.profile.teamLogo} alt={userStats.profile.team} />
                    <AvatarFallback>{userStats.profile.team.substring(0, 1)}</AvatarFallback>
                </Avatar>
                <CardDescription className="text-foreground">{userStats.profile.team}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Separator className="mb-6"/>
            <div className="flex justify-around items-center text-center">
              <div>
                <p className="text-sm text-muted-foreground">{t.profile.points}</p>
                <p className="text-2xl md:text-3xl font-bold">{userStats.xp}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.profile.position.label}</p>
                <p className="text-xl md:text-2xl font-bold">{t.goalSetter.position[userStats.profile.position.toLowerCase() as keyof typeof t.goalSetter.position]}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.profile.preferredFoot}</p>
                <p className="text-2xl md:text-3xl font-bold">{t.goalSetter.preferredFoot[userStats.profile.preferredFoot]}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <SheetContent>
            <SheetHeader>
                <SheetTitle>{t.profile.editProfile}</SheetTitle>
                <SheetDescription>{t.profile.editDescription}</SheetDescription>
            </SheetHeader>
             <div className="grid grid-cols-2 gap-4 py-4">
                <Button variant="outline" onClick={() => avatarInputRef.current?.click()}>
                    <Camera className="mr-2 h-4 w-4" />
                    {t.profile.changePhoto}
                </Button>
                <input
                    type="file"
                    ref={avatarInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'avatar')}
                />
                <Button variant="outline" onClick={() => logoInputRef.current?.click()}>
                    <Shield className="mr-2 h-4 w-4" />
                    {t.profile.changeTeamLogo}
                </Button>
                 <input
                    type="file"
                    ref={logoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'teamLogo')}
                />
            </div>
            <Separator />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t.goalSetter.name.label}</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="team" render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t.profile.team}</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="position" render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t.profile.position.label}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Goalkeeper">{t.goalSetter.position.goalkeeper}</SelectItem>
                                    <SelectItem value="Defender">{t.goalSetter.position.defender}</SelectItem>
                                    <SelectItem value="Midfielder">{t.goalSetter.position.midfielder}</SelectItem>
                                    <SelectItem value="Forward">{t.goalSetter.position.forward}</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="preferredFoot" render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t.profile.preferredFoot}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="left">{t.goalSetter.preferredFoot.left}</SelectItem>
                                    <SelectItem value="right">{t.goalSetter.preferredFoot.right}</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <SheetFooter className="pt-4">
                        <SheetClose asChild>
                            <Button type="button" variant="ghost">{t.profile.cancel}</Button>
                        </SheetClose>
                        <Button type="submit">{t.profile.saveChanges}</Button>
                    </SheetFooter>
                </form>
            </Form>
        </SheetContent>
      </Sheet>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Target className="mr-2"/>{t.profile.statsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-1 text-sm">
                <span>{isGoalkeeper ? t.profile.penaltiesSaved : t.profile.penalties}</span>
                <span>{isGoalkeeper ? `${userStats.penaltiesSaved} / ${userStats.penaltiesFaced}` : `${userStats.penaltiesScored} / ${userStats.penaltiesTaken}`}</span>
            </div>
            <Progress value={penaltySuccessRate} aria-label={`${penaltySuccessRate.toFixed(0)}% ${isGoalkeeper ? 'penalty save' : 'penalty success'} rate`} />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Award className="mr-2"/>{t.profile.careerPath}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {userStats.levels.map((level, index) => {
            const isUnlocked = userStats.level >= level.level;
            const isCurrent = userStats.level === level.level;
            const LevelIcon = level.icon;

            return (
              <div key={level.level} className={cn(
                "flex items-center p-3 rounded-lg border transition-all",
                isCurrent ? "border-primary bg-primary/10 shadow" : "bg-muted/40",
                !isUnlocked && "opacity-60"
              )}>
                <div className={cn("flex items-center justify-center w-10 h-10 rounded-full mr-4", isUnlocked ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground")}>
                  {isUnlocked ? <LevelIcon className="h-6 w-6"/> : <Lock className="h-5 w-5" />}
                </div>
                <div className="flex-grow">
                  <h4 className={cn("font-bold", isCurrent && "text-primary")}>
                    {t.careerLevels[level.nameKey as keyof typeof t.careerLevels]}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t.stats.level} {level.level} - {level.xpRequired} XP
                  </p>
                </div>
                {isCurrent && <Badge variant="default">{t.profile.current}</Badge>}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Award className="mr-2"/>{t.profile.badgesTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 justify-center">
            {allBadges.map(badgeInfo => {
                const hasBadge = userStats.badges.includes(badgeInfo.id);
                const BadgeIcon = badgeInfo.icon;
                
                return (
                  <Dialog key={badgeInfo.id}>
                    <DialogTrigger asChild>
                      <button
                        className={cn(
                          "flex flex-col items-center gap-2 p-2 rounded-lg transition-all duration-200 transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          !hasBadge && "opacity-40 grayscale",
                          hasBadge && "shadow-[0_0_15px_hsl(var(--chart-4))/0.5)]"
                        )}
                        aria-label={`View details for ${badgesTranslations[badgeInfo.nameKey]?.name} badge`}
                      >
                        <div className="bg-muted p-3 rounded-full border-2 border-primary/20">
                            <BadgeIcon className={cn("h-8 w-8", hasBadge ? "text-[hsl(var(--chart-4))]" : "text-muted-foreground" )} />
                        </div>
                        <span className="text-xs text-center font-semibold w-20 truncate">{badgesTranslations[badgeInfo.nameKey]?.name}</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader className="items-center text-center space-y-4">
                        <div className="bg-muted p-4 rounded-full border-2 border-primary/20 inline-block">
                           <BadgeIcon className={cn("h-12 w-12", hasBadge ? "text-[hsl(var(--chart-4))]" : "text-muted-foreground" )} />
                        </div>
                        <div className="space-y-1">
                          <DialogTitle className="text-2xl font-headline">{badgesTranslations[badgeInfo.nameKey]?.name}</DialogTitle>
                          <DialogDescription className="text-base text-muted-foreground px-4">
                            {badgesTranslations[badgeInfo.nameKey]?.description}
                          </DialogDescription>
                        </div>
                      </DialogHeader>
                        {!hasBadge && (
                          <div className="flex justify-center">
                            <Badge variant="destructive">{t.profile.locked}</Badge>
                          </div>
                        )}
                    </DialogContent>
                  </Dialog>
                )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}