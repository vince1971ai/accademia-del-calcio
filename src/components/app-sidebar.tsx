'use client';

import {
  Home,
  Tally4,
  Swords,
  ShieldQuestion,
  Trophy,
  MessagesSquare,
  User,
  Database,
  Wrench,
  Map,
  Users,
  Bell,
  HeartPulse,
  BarChart3,
  Handshake,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarTrigger,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
  SidebarMenuBadge,
} from '@/components/ui/sidebar';
import { useUserData } from '@/context/user-data-context';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '@/context/auth-context';
import { adminEmails } from '@/lib/config';

export type View =
  | 'home'
  | 'tactics'
  | 'iq'
  | 'leaderboards'
  | 'discussion'
  | 'profile'
  | 'admin'
  | 'knowledge-map'
  | 'messages'
  | 'standings';

interface AppSidebarProps {
  activeView: View;
  setView: (view: View) => void;
}

export function AppSidebar({ activeView, setView }: AppSidebarProps) {
  const { t } = useTranslation();
  const { userStats } = useUserData();
  const { user } = useAuth();
  const { setOpenMobile } = useSidebar();
  
  const isAdmin = user && adminEmails.includes(user.email ?? '');

  const navItems = [
    { id: 'home', label: t.nav.home, icon: Home },
    { id: 'tactics', label: t.nav.tactics, icon: Tally4 },
    { id: 'iq', label: t.nav.iq, icon: Swords },
    { id: 'leaderboards', label: t.nav.leaderboards, icon: Trophy },
    { id: 'discussion', label: t.nav.discussion, icon: MessagesSquare },
    { id: 'profile', label: t.nav.profile, icon: HeartPulse },
    { id: 'knowledge-map', label: t.nav.knowledgeMap, icon: Map },
  ] as const;
  
  const adminNavItem = { id: 'admin', label: 'Admin', icon: Wrench };
  const messagesNavItem = { id: 'messages', label: t.nav.messages, icon: MessagesSquare };
  const standingsNavItem = { id: 'standings', label: t.nav.standings, icon: BarChart3 };


  if (!userStats) return null;

  const handleViewChange = (view: View) => {
    setView(view);
    setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 transition-all duration-200 group-data-[state=collapsed]:p-2">
        {/* Expanded view */}
        <div className="flex items-center justify-between group-data-[state=collapsed]:hidden">
          <div className="flex items-center gap-3">
            <Avatar className="size-10" data-ai-hint="team logo shield">
              <AvatarImage
                src={userStats.profile.teamLogo}
                alt={userStats.profile.team}
              />
              <AvatarFallback>
                {userStats.profile.team.substring(0, 1)}
              </AvatarFallback>
            </Avatar>
            <span className="text-lg font-semibold">
              {userStats.profile.team}
            </span>
          </div>
        </div>
        {/* Collapsed view */}
        <div className="hidden group-data-[state=collapsed]:flex justify-center items-center">
            <SidebarTrigger className="hidden md:flex" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            if(item.id === 'discussion' && isAdmin) return null;
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => handleViewChange(item.id)}
                  isActive={activeView === item.id}
                  tooltip={{ children: item.label, side: 'right' }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
           {isAdmin && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleViewChange(adminNavItem.id)}
                  isActive={activeView === adminNavItem.id}
                  tooltip={{ children: adminNavItem.label, side: 'right' }}
                >
                  <adminNavItem.icon />
                  <span>{adminNavItem.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
          )}

            <SidebarSeparator className="my-2" />
             <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleViewChange(messagesNavItem.id)}
                  isActive={activeView === messagesNavItem.id}
                  tooltip={{ children: messagesNavItem.label, side: 'right' }}
                >
                  <messagesNavItem.icon />
                  <span>{messagesNavItem.label}</span>
                   {userStats.unreadMessages && <SidebarMenuBadge />}
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleViewChange(standingsNavItem.id)}
                  isActive={activeView === 'standings'}
                  tooltip={{ children: standingsNavItem.label, side: 'right' }}
                >
                  <standingsNavItem.icon />
                  <span>{standingsNavItem.label}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}