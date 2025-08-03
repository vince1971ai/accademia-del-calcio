'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Flame, Scale, Shield, LayoutGrid, CheckCircle2, AlertTriangle, Trophy, Star, ClipboardList, Lightbulb } from 'lucide-react';
import type { Formation, FormationStyle } from '@/lib/tactics-data';
import { SoccerField } from '@/components/soccer-field';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Spinner } from '../loader';


// Custom Hook to fetch formations
function useFormations() {
    const [formations, setFormations] = useState<Formation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFormations = async () => {
            try {
                const formationsCol = query(collection(db, 'formations'), orderBy('order'));
                const formationsSnapshot = await getDocs(formationsCol);
                const formationsList = formationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Formation));
                setFormations(formationsList);
            } catch (error) {
                console.error("Error fetching formations: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFormations();
    }, []);

    return { formations, loading };
}


type FilterType = 'All' | FormationStyle;

export function TacticsView() {
  const { t } = useTranslation();
  const { formations: allFormations, loading: formationsLoading } = useFormations();
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [filter, setFilter] = useState<FilterType>('All');

  useEffect(() => {
    if (!selectedFormation && allFormations.length > 0) {
      setSelectedFormation(allFormations[0]);
    }
  }, [allFormations, selectedFormation]);
  
  const filteredFormations = filter === 'All' 
    ? allFormations 
    : allFormations.filter(f => f.style === filter);

  const difficultyColors: Record<Formation['difficulty'], string> = {
    'Low': 'bg-green-200 text-green-800 border-green-300 dark:bg-green-800/50 dark:text-green-200 dark:border-green-700',
    'Medium': 'bg-yellow-200 text-yellow-800 border-yellow-300 dark:bg-yellow-800/50 dark:text-yellow-200 dark:border-yellow-700',
    'Hard': 'bg-red-200 text-red-800 border-red-300 dark:bg-red-800/50 dark:text-red-200 dark:border-red-700',
  }

  const styleColors: Record<Formation['style'], string> = {
    'Offensive': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-800/50 dark:text-red-200 dark:border-red-700',
    'Balanced': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-800/50 dark:text-blue-200 dark:border-blue-700',
    'Defensive': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-200 dark:border-gray-700',
  }

  const filters: {id: FilterType, labelKey: keyof typeof t.tactics.filters, icon: React.ElementType}[] = [
      { id: 'All', labelKey: 'all', icon: LayoutGrid },
      { id: 'Offensive', labelKey: 'offensive', icon: Flame },
      { id: 'Balanced', labelKey: 'balanced', icon: Scale },
      { id: 'Defensive', labelKey: 'defensive', icon: Shield },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
        <div className="text-center">
            <h1 className="text-3xl font-bold font-headline">{t.tactics.title}</h1>
            <p className="text-muted-foreground mt-2">{t.tactics.subtitle}</p>
        </div>

        <Card>
            <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                    {filters.map(({ id, labelKey, icon: Icon }) => (
                         <Button key={id} variant={filter === id ? "default" : "outline"} onClick={() => setFilter(id)} className="flex-1 sm:flex-auto">
                            <Icon className="w-4 h-4 mr-2" />
                            {t.tactics.filters[labelKey]}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
        
        {formationsLoading ? <div className="flex justify-center items-center p-8"><Spinner className="w-8 h-8"/></div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {filteredFormations.map(formation => (
                    <Card 
                        key={formation.id} 
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-lg",
                            selectedFormation?.id === formation.id ? 'border-primary shadow-lg scale-[1.02]' : 'border-border'
                        )}
                        onClick={() => setSelectedFormation(formation)}
                    >
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="font-headline text-2xl">{formation.id}</CardTitle>
                                <Badge className={cn("text-xs font-bold", difficultyColors[formation.difficulty])}>{t.tactics.difficulty[formation.difficulty.toLowerCase() as keyof typeof t.tactics.difficulty]}</Badge>
                            </div>
                            <Badge className={cn("text-xs font-semibold w-fit", styleColors[formation.style])}>{t.tactics.style[formation.style.toLowerCase() as keyof typeof t.tactics.style]}</Badge>
                        </CardHeader>
                        <CardContent>
                            <p className="font-semibold">{t.tactics[formation.descriptionKey as keyof typeof t.tactics]}</p>
                            <p className="text-sm text-muted-foreground mt-1">{t.tactics[formation.idealForKey as keyof typeof t.tactics]}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}

        {selectedFormation && !formationsLoading && (
            <div className="animate-in fade-in duration-500">
                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-2xl font-bold font-headline">{t.tactics[selectedFormation.titleKey as keyof typeof t.tactics]} {t.tactics.style[selectedFormation.style.toLowerCase() as keyof typeof t.tactics.style]}</h2>
                            <Badge className={cn("text-xs font-bold", difficultyColors[selectedFormation.difficulty])}>{t.tactics.difficulty[selectedFormation.difficulty.toLowerCase() as keyof typeof t.tactics.difficulty]}</Badge>
                            <Badge className={cn("text-xs font-semibold w-fit", styleColors[selectedFormation.style])}>{t.tactics.style[selectedFormation.style.toLowerCase() as keyof typeof t.tactics.style]}</Badge>
                        </div>
                        <p className="text-lg text-muted-foreground pt-2">{t.tactics[selectedFormation.summaryKey as keyof typeof t.tactics]}</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <div className="md:sticky md:top-24">
                            <SoccerField positions={selectedFormation.positions} formationId={selectedFormation.id} />
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <p><span className="font-semibold">{t.tactics.formation}:</span> {t.tactics[selectedFormation.descriptionKey as keyof typeof t.tactics]}</p>
                                    <p><span className="font-semibold">{t.tactics.idealFor}:</span> {t.tactics[selectedFormation.idealForKey as keyof typeof t.tactics]}</p>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold flex items-center text-green-600"><CheckCircle2 className="mr-2"/>{t.tactics.advantages}</h3>
                                    <ul className="space-y-1 list-inside">
                                        {selectedFormation.advantages.map(adv => <li key={adv} className="flex items-start"><span className="text-green-500 mr-2 mt-1">•</span>{t.tactics[adv as keyof typeof t.tactics]}</li>)}
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold flex items-center text-red-600"><AlertTriangle className="mr-2"/>{t.tactics.disadvantages}</h3>
                                    <ul className="space-y-1 list-inside">
                                        {selectedFormation.disadvantages.map(dis => <li key={dis} className="flex items-start"><span className="text-red-500 mr-2 mt-1">•</span>{t.tactics[dis as keyof typeof t.tactics]}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold flex items-center mb-2"><Trophy className="mr-2 text-yellow-500"/>{t.tactics.famousTeams}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedFormation.famousTeams.map(team => <Badge variant="secondary" key={team}>{t.tactics[team as keyof typeof t.tactics]}</Badge>)}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold flex items-center mb-2"><Star className="mr-2 text-yellow-400"/>{t.tactics.keyRoles}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedFormation.keyRoles.map(role => <Badge variant="secondary" key={role}>{t.tactics[role as keyof typeof t.tactics]}</Badge>)}
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                            <h3 className="font-semibold flex items-center"><ClipboardList className="mr-2"/>{t.tactics.tacticalTip}</h3>
                            <p className="italic text-muted-foreground">"{t.tactics.tipQuote}"</p>
                            <p className="text-sm flex items-start"><Lightbulb className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-yellow-500"/>{t.tactics.tipReminder}</p>
                        </div>

                    </CardContent>
                </Card>
            </div>
        )}
    </div>
  );
}
