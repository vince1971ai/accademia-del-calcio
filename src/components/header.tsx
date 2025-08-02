'use client';

import { useTranslation } from '@/lib/i18n';
import { LanguageSwitcher } from './language-switcher';
import { useUserData } from '@/context/user-data-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from './ui/sidebar';
import { ThemeSwitcher } from './theme-switcher';
import { useAuth } from '@/context/auth-context';
import { Button } from './ui/button';
import { LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const { t } = useTranslation();
  const { userStats } = useUserData();
  const { user, logout } = useAuth();

  if (!userStats || !user) return null;

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container flex h-20 items-center space-x-4 sm:justify-between sm:space-x-0 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-3 items-center">
           <SidebarTrigger className="md:hidden" />
           <Avatar className="h-16 w-16" data-ai-hint="team logo shield">
            <AvatarImage src={userStats.profile.teamLogo} alt={userStats.profile.team} />
            <AvatarFallback>{userStats.profile.team.substring(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold font-headline text-primary tracking-tight">
              {userStats.profile.team}
            </h1>
            <span className="text-sm text-muted-foreground hidden sm:inline-block">/ {t.appName}</span>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                 <Avatar className="h-10 w-10">
                  <AvatarImage src={user.photoURL ?? userStats.profile.avatar} alt={user.displayName ?? userStats.profile.name} />
                  <AvatarFallback>{userStats.profile.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.displayName ?? userStats.profile.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}