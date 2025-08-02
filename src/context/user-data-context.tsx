'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Handshake, BrainCircuit, GraduationCap, Trophy, Gavel, Scroll, Apple,
  ClipboardSignature, Gem, Star, Sparkles, Crown, Rocket, Flame, Sun,
  Award, Medal, ShieldCheck, TrendingUp, CalendarDays, CalendarHeart,
  CalendarCheck, Lock, PenTool, Shield, Brain, ChevronsRight, Footprints,
  Hand, Rotate3d, Castle, Zap, MousePointer, ShieldHalf, Ribbon, Bird,
  Crosshair, Network, Dices, Train, Archive, ArchiveRestore, Library,
  Layers, Landmark, Baby, CaseSensitive, ToyBrick, School, University,
  Briefcase
} from 'lucide-react';
import { useAuth } from './auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { allMissions, type Mission } from '@/lib/missions-data';


export interface UserProfile {
  name: string;
  team: string;
  avatar: string;
  teamLogo: string;
  position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';
  preferredFoot: 'left' | 'right';
}

export interface ActiveMission {
    id: string;
    progress: number;
}

export interface BaseUserStats {
  profile: UserProfile;
  xp: number;
  level: number;
  completedQuizzes: string[];
  correctAnswers: number;
  totalQuestions: number;
  badges: string[];
  streak: number;
  lastLogin: string | null;
  penaltiesTaken: number;
  penaltiesScored: number;
  penaltiesFaced: number;
  penaltiesSaved: number;
  completedMissions: string[];
  unreadMessages?: boolean;
  correctlyAnsweredTerms: string[];
}

export interface UserStats extends BaseUserStats {
  levels: LevelInfo[];
  averageAccuracy: number;
  badgesEarned: number;
  levelProgress: number;
  xpForNextLevel: number;
  currentLevelInfo: LevelInfo;
}


export interface LevelInfo {
  level: number;
  nameKey: string;
  xpRequired: number;
  icon: React.ElementType;
}

interface BadgeData {
  id: string;
  nameKey: string;
  icon: React.ElementType;
  condition: (stats: BaseUserStats) => boolean;
}

const levels: LevelInfo[] = [
    { level: 1, nameKey: 'prospect', xpRequired: 0, icon: Baby },
    { level: 2, nameKey: 'rookie', xpRequired: 100, icon: CaseSensitive },
    { level: 3, nameKey: 'starter', xpRequired: 250, icon: ToyBrick },
    { level: 4, nameKey: 'specialist', xpRequired: 500, icon: School },
    { level: 5, nameKey: 'veteran', xpRequired: 1000, icon: University },
    { level: 6, nameKey: 'playmaker', xpRequired: 1750, icon: Briefcase },
    { level: 7, nameKey: 'trequartista', xpRequired: 2500, icon: GraduationCap },
    { level: 8, nameKey: 'maestro', xpRequired: 5000, icon: Brain },
    { level: 9, nameKey: 'champion', xpRequired: 7500, icon: Trophy },
    { level: 10, nameKey: 'legend', xpRequired: 10000, icon: Crown },
];

export const allBadgeData: Record<string, BadgeData> = {
  welcome: { id: 'welcome', nameKey: 'welcome', icon: Handshake, condition: (stats) => true },
  quizRookie: { id: 'quizRookie', nameKey: 'quizRookie', icon: BrainCircuit, condition: (stats) => stats.completedQuizzes.length >= 1 },
  quizAdept: { id: 'quizAdept', nameKey: 'quizAdept', icon: GraduationCap, condition: (stats) => stats.completedQuizzes.length >= 3 },
  quizPro: { id: 'quizPro', nameKey: 'quizPro', icon: Trophy, condition: (stats) => stats.completedQuizzes.length >= 5 },
  rulesExpert: { id: 'rulesExpert', nameKey: 'rulesExpert', icon: Gavel, condition: (stats) => stats.completedQuizzes.includes('rules_1') },
  historyBuff: { id: 'historyBuff', nameKey: 'historyBuff', icon: Scroll, condition: (stats) => stats.completedQuizzes.includes('history_1') },
  nutritionGuru: { id: 'nutritionGuru', nameKey: 'nutritionGuru', icon: Apple, condition: (stats) => stats.completedQuizzes.includes('nutrition_1') },
  tacticsExpert: { id: 'tacticsExpert', nameKey: 'tacticsExpert', icon: ClipboardSignature, condition: (stats) => stats.completedQuizzes.includes('tactics_1') },
  tacticsMaster: { id: 'tacticsMaster', nameKey: 'tacticsMaster', icon: Brain, condition: (stats) => false }, // Placeholder, needs to fetch quizzes
  perfectionist: { id: 'perfectionist', nameKey: 'perfectionist', icon: Gem, condition: (stats) => stats.badges.includes('perfectionist') },
  xp100: { id: 'xp100', nameKey: 'xp100', icon: Star, condition: (stats) => stats.xp >= 100 },
  xp500: { id: 'xp500', nameKey: 'xp500', icon: Sparkles, condition: (stats) => stats.xp >= 500 },
  xp1000: { id: 'xp1000', nameKey: 'xp1000', icon: Crown, condition: (stats) => stats.xp >= 1000 },
  xp2500: { id: 'xp2500', nameKey: 'xp2500', icon: Rocket, condition: (stats) => stats.xp >= 2500 },
  xp5000: { id: 'xp5000', nameKey: 'xp5000', icon: Flame, condition: (stats) => stats.xp >= 5000 },
  xp10000: { id: 'xp10000', nameKey: 'xp10000', icon: Sun, condition: (stats) => stats.xp >= 10000 },
  level2: { id: 'level2', nameKey: 'level2', icon: Award, condition: (stats) => stats.level >= 2 },
  level5: { id: 'level5', nameKey: 'level5', icon: Medal, condition: (stats) => stats.level >= 5 },
  level10: { id: 'level10', nameKey: 'level10', icon: ShieldCheck, condition: (stats) => stats.level >= 10 },
  streak3: { id: 'streak3', nameKey: 'streak3', icon: TrendingUp, condition: (stats) => stats.streak >= 3 },
  streak7: { id: 'streak7', nameKey: 'streak7', icon: CalendarDays, condition: (stats) => stats.streak >= 7 },
  streak14: { id: 'streak14', nameKey: 'streak14', icon: CalendarHeart, condition: (stats) => stats.streak >= 14 },
  streak30: { id: 'streak30', nameKey: 'streak30', icon: CalendarCheck, condition: (stats) => stats.streak >= 30 },
  collector: { id: 'collector', nameKey: 'collector', icon: Archive, condition: (stats) => stats.badges.length >= 10 },
  seniorCollector: { id: 'seniorCollector', nameKey: 'seniorCollector', icon: ArchiveRestore, condition: (stats) => stats.badges.length >= 20 },
  masterCollector: { id: 'masterCollector', nameKey: 'masterCollector', icon: Library, condition: (stats) => stats.badges.length >= 30 },
  ultraCollector: { id: 'ultraCollector', nameKey: 'ultraCollector', icon: Layers, condition: (stats) => stats.badges.length >= 40 },
  legendaryCollector: { id: 'legendaryCollector', nameKey: 'legendaryCollector', icon: Landmark, condition: (stats) => stats.badges.length >= 50 },
  catenaccio: { id: 'catenaccio', nameKey: 'catenaccio', icon: Lock, condition: () => false }, 
  trequartista: { id: 'trequartista', nameKey: 'trequartista', icon: PenTool, condition: () => false },
  libero: { id: 'libero', nameKey: 'libero', icon: Shield, condition: () => false },
  regista: { id: 'regista', nameKey: 'regista', icon: Brain, condition: () => false },
  mezzala: { id: 'mezzala', nameKey: 'mezzala', icon: ChevronsRight, condition: () => false },
  pele: { id: 'pele', nameKey: 'pele', icon: Footprints, condition: () => false },
  maradona: { id: 'maradona', nameKey: 'maradona', icon: Hand, condition: () => false },
  cruyff: { id: 'cruyff', nameKey: 'cruyff', icon: Rotate3d, condition: () => false },
  beckenbauer: { id: 'beckenbauer', nameKey: 'beckenbauer', icon: Castle, condition: () => false },
  zidane: { id: 'zidane', nameKey: 'zidane', icon: Zap, condition: () => false },
  ronaldo: { id: 'ronaldo', nameKey: 'ronaldo', icon: Zap, condition: () => false },
  messi: { id: 'messi', nameKey: 'messi', icon: MousePointer, condition: () => false },
  maldini: { id: 'maldini', nameKey: 'maldini', icon: ShieldHalf, condition: () => false },
  bobbyMoore: { id: 'bobbyMoore', nameKey: 'bobbyMoore', icon: Ribbon, condition: () => false },
  garrincha: { id: 'garrincha', nameKey: 'garrincha', icon: Bird, condition: () => false },
  puskas: { id: 'puskas', nameKey: 'puskas', icon: Crosshair, condition: () => false },
  yashin: { id: 'yashin', nameKey: 'yashin', icon: Network, condition: () => false },
  hatTrick: { id: 'hatTrick', nameKey: 'hatTrick', icon: Dices, condition: (stats) => stats.completedQuizzes.length >= 3 && stats.badges.includes('hatTrick') === false },
  unstoppable: { id: 'unstoppable', nameKey: 'unstoppable', icon: Train, condition: (stats) => stats.streak >= 5 && !stats.badges.includes('unstoppable')},
};

export const getInitialStats = (user: User | null): BaseUserStats => ({
  profile: {
    name: user?.displayName || 'Nuovo Giocatore',
    team: 'Campioni Digitali',
    avatar: user?.photoURL || 'https://placehold.co/128x128.png',
    teamLogo: 'https://placehold.co/128x128.png',
    position: 'Midfielder',
    preferredFoot: 'right',
  },
  xp: 0,
  level: 1,
  completedQuizzes: [],
  correctAnswers: 0,
  totalQuestions: 0,
  badges: ['welcome'],
  streak: 1,
  lastLogin: new Date().toISOString().split('T')[0],
  penaltiesTaken: 0,
  penaltiesScored: 0,
  penaltiesFaced: 0,
  penaltiesSaved: 0,
  completedMissions: [],
  unreadMessages: false,
  correctlyAnsweredTerms: [],
});

const calculateDerivedStats = (stats: BaseUserStats): UserStats => {
    const averageAccuracy = stats.totalQuestions > 0 
        ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) 
        : 0;

    const badgesEarned = stats.badges.length;
    const currentLevelInfo = levels[stats.level - 1] || levels[0];
    const nextLevelInfo = levels[stats.level];
    
    const xpForCurrentLevel = currentLevelInfo.xpRequired;
    const xpForNextLevel = nextLevelInfo ? nextLevelInfo.xpRequired : currentLevelInfo.xpRequired;
    
    const xpIntoLevel = stats.xp - xpForCurrentLevel;
    const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
    const levelProgress = xpNeededForLevel > 0 ? (xpIntoLevel / xpNeededForLevel) * 100 : 100;

    return {
        ...stats,
        levels,
        averageAccuracy,
        badgesEarned,
        levelProgress,
        xpForNextLevel,
        currentLevelInfo,
    }
}


interface UserDataContextType {
  userStats: UserStats | null;
  loading: boolean;
  completeQuiz: (quizId: string, score: number, xpGained: number, totalQuestions: number) => Promise<void>;
  updateProfile: (newProfileData: Partial<UserProfile>) => Promise<void>;
  updateUserStats: (newStats: Partial<BaseUserStats>) => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (user: User) => {
    setLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      let stats = userDoc.data() as BaseUserStats;
      // Ensure complex fields are initialized
      if (!stats.completedMissions) {
        stats.completedMissions = [];
      }
      if (!stats.correctlyAnsweredTerms) {
        stats.correctlyAnsweredTerms = [];
      }
      setUserStats(calculateDerivedStats(stats));
    } else {
      // This case is handled by createUserProfile in AuthProvider
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData(user);
    } else {
      setUserStats(null);
      setLoading(false);
    }
  }, [user, fetchUserData]);

  const updateAndSaveStats = async (newStats: BaseUserStats) => {
      if(!user) return;

      // Check for newly completed missions
      const newlyCompletedMissions: Mission[] = [];
      for (const mission of Object.values(allMissions)) {
          if (!newStats.completedMissions.includes(mission.id) && mission.condition(newStats)) {
              newlyCompletedMissions.push(mission);
          }
      }

      if (newlyCompletedMissions.length > 0) {
          newlyCompletedMissions.forEach(mission => {
              newStats.completedMissions.push(mission.id);
              if (mission.reward.xp) {
                  newStats.xp += mission.reward.xp;
              }
              if (mission.reward.badgeId && !newStats.badges.includes(mission.reward.badgeId)) {
                  newStats.badges.push(mission.reward.badgeId);
              }
          });
      }

      // Check for newly earned badges from other conditions
      const newlyEarnedBadges: string[] = [];
      for (const badge of Object.values(allBadgeData)) {
          if (!newStats.badges.includes(badge.id) && badge.condition(newStats)) {
              newlyEarnedBadges.push(badge.id);
          }
      }
      if(newlyEarnedBadges.length > 0) {
          newStats.badges = [...newStats.badges, ...newlyEarnedBadges];
      }
      
      // Update level based on new XP
      let currentLevel = newStats.level;
      while(currentLevel < levels.length && newStats.xp >= levels[currentLevel].xpRequired) {
        currentLevel++;
      }
      newStats.level = currentLevel;

      setUserStats(calculateDerivedStats(newStats));
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, JSON.parse(JSON.stringify(newStats)), { merge: true });
  }

  const updateUserStats = async (newStatsData: Partial<BaseUserStats>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);

    // Fetch the latest stats to avoid overwriting with stale data
    const docSnap = await getDoc(userDocRef);
    if(docSnap.exists()){
      const currentStats = docSnap.data() as BaseUserStats;
      const newStats = { ...currentStats, ...newStatsData };
       if(newStatsData.correctlyAnsweredTerms){
           // Use a Set to ensure no duplicates
           newStats.correctlyAnsweredTerms = Array.from(new Set(newStatsData.correctlyAnsweredTerms));
       }
      setUserStats(calculateDerivedStats(newStats));
      await updateDoc(userDocRef, JSON.parse(JSON.stringify(newStatsData)));
    }
  };

  const completeQuiz = async (quizId: string, score: number, xpGained: number, totalQuestions: number) => {
    if(!userStats) return;

    const newStats: BaseUserStats = { ...userStats };
    
    newStats.xp += xpGained;
    newStats.correctAnswers += score;
    newStats.totalQuestions += totalQuestions;

    if (!newStats.completedQuizzes.includes(quizId)) {
      newStats.completedQuizzes = [...newStats.completedQuizzes, quizId];
    }

    if (score === totalQuestions) {
      if (!newStats.badges.includes('perfectionist')) {
          newStats.badges = [...newStats.badges, 'perfectionist'];
      }
    }
    
    await updateAndSaveStats(newStats);
  };

  const updateProfile = async (newProfileData: Partial<UserProfile>) => {
    if (!userStats) return;
      
    const newProfile = { ...userStats.profile, ...newProfileData };
    const newStats = { ...userStats, profile: newProfile };
      
    await updateAndSaveStats(newStats);
  };

  return (
    <UserDataContext.Provider value={{ userStats, loading, completeQuiz, updateProfile, updateUserStats }}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};