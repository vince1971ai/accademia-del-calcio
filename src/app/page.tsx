'use client';

import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import dynamic from 'next/dynamic';

import { AppSidebar, type View } from '@/components/app-sidebar';
import { Header } from '@/components/header';
import { FullScreenLoader } from '@/components/loader';
import { useUserData } from '@/context/user-data-context';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { AdminView } from '@/components/views/admin-view';

const HomeView = dynamic(() => import('@/components/views/home-view').then(mod => mod.HomeView), {
  ssr: false,
  loading: () => <FullScreenLoader />,
});
const TacticsView = dynamic(() => import('@/components/views/tactics-view').then(mod => mod.TacticsView), {
  ssr: false,
  loading: () => <FullScreenLoader />,
});
const IqView = dynamic(() => import('@/components/views/iq-view').then(mod => mod.IqView), {
  ssr: false,
  loading: () => <FullScreenLoader />,
});
const LeaderboardsView = dynamic(() => import('@/components/views/leaderboards-view').then(mod => mod.LeaderboardsView), {
  ssr: false,
  loading: () => <FullScreenLoader />,
});
const DiscussionView = dynamic(() => import('@/components/views/discussion-view').then(mod => mod.DiscussionView), {
  ssr: false,
  loading: () => <FullScreenLoader />,
});
const ProfileView = dynamic(() => import('@/components/views/profile-view').then(mod => mod.ProfileView), {
  ssr: false,
  loading: () => <FullScreenLoader />,
});
// AdminView is not dynamically imported to pass props
const KnowledgeMapView = dynamic(() => import('@/components/views/knowledge-map-view').then(mod => mod.KnowledgeMapView), {
  ssr: false,
  loading: () => <FullScreenLoader />,
});
const MessagesView = dynamic(() => import('@/components/views/messages-view').then(mod => mod.MessagesView), {
  ssr: false,
  loading: () => <FullScreenLoader />,
});
const StandingsView = dynamic(() => import('@/components/views/standings-view').then(mod => mod.StandingsView), {
  ssr: false,
  loading: () => <FullScreenLoader />,
});


const views: Record<View, FC<any>> = {
  home: HomeView,
  'knowledge-map': KnowledgeMapView,
  tactics: TacticsView,
  iq: IqView,
  leaderboards: LeaderboardsView,
  discussion: DiscussionView,
  profile: ProfileView,
  admin: AdminView,
  messages: MessagesView,
  standings: StandingsView,
};

function MainApp() {
  const { userStats, loading: userDataLoading } = useUserData();
  const [view, setView] = useState<View>('home');
  const [preselectedUserId, setPreselectedUserId] = useState<string | null>(null);

  const CurrentView = views[view];

  const handleNavigateToMessages = (userId: string) => {
    setPreselectedUserId(userId);
    setView('messages');
  };

  const viewProps: Record<string, any> = {
    admin: { onNavigateToMessages: handleNavigateToMessages },
    messages: { preselectedUserId, setPreselectedUserId },
  };


  if (userDataLoading || !userStats) {
    return <FullScreenLoader />;
  }

  return (
    <SidebarProvider>
      <AppSidebar activeView={view} setView={setView} />
      <SidebarInset>
        <Header />
        <div className="flex-1 w-full max-w-4xl mx-auto pt-4 px-4 sm:px-6 lg:px-8 pb-8">
          <CurrentView {...(viewProps[view] || {})} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);


  if (loading || !user) {
    return <FullScreenLoader />;
  }