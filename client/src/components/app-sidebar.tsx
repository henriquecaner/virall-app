import { Link, useLocation } from "wouter";
import { LayoutDashboard, PenTool, User, Settings, LogOut, Zap, ChevronUp } from "lucide-react";
import { trackLogout } from "@/lib/analytics";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import type { User as UserType, ContentProfile, Subscription } from "@shared/schema";
import { useTranslation } from "@/lib/i18n";

function CreditsIndicator({ isCollapsed }: { isCollapsed: boolean }) {
  const { t } = useTranslation();
  
  const { data: subscription } = useQuery<Subscription>({
    queryKey: ["/api/subscription"],
  });

  const postsUsed = subscription?.postsUsedThisMonth ?? 0;
  const postsLimit = subscription?.postsLimit ?? 8;
  const postsRemaining = Math.max(0, postsLimit - postsUsed);
  const percentageRemaining = postsLimit > 0 ? (postsRemaining / postsLimit) * 100 : 0;
  const isLow = percentageRemaining <= 30;
  const isMedium = percentageRemaining > 30 && percentageRemaining <= 50;

  const getProgressColor = () => {
    if (percentageRemaining > 50) return "from-blue-500 to-cyan-400";
    if (percentageRemaining > 30) return "from-yellow-500 to-orange-400";
    return "from-red-500 to-red-400";
  };

  const getRadialStrokeClass = () => {
    if (percentageRemaining > 50) return "stroke-blue-500";
    if (percentageRemaining > 30) return "stroke-yellow-500";
    return "stroke-red-500";
  };

  const getCounterTextClass = () => {
    if (isLow) return "text-red-400";
    if (isMedium) return "text-yellow-400";
    return "text-blue-400";
  };

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-1 p-2" data-testid="credits-indicator-collapsed">
            <div className="relative">
              <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  className="stroke-muted"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  className={getRadialStrokeClass()}
                  strokeWidth="3"
                  strokeDasharray={`${percentageRemaining * 0.94} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium" data-testid="text-credits-remaining-collapsed">
                {postsRemaining}
              </span>
              {isLow && (
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" data-testid="indicator-low-credits" />
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex flex-col gap-1">
          <span className="font-medium" data-testid="text-credits-tooltip">{postsRemaining}/{postsLimit} {t("sidebar.postsRemaining")}</span>
          {isLow && (
            <span className="text-red-400 text-xs">{t("sidebar.lowCredits")}</span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="mx-2 mb-2 p-3 rounded-md bg-sidebar-accent/50" data-testid="credits-indicator-expanded">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-sidebar-foreground" data-testid="text-credits-label">{t("sidebar.credits")}</span>
          {isLow && (
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" data-testid="indicator-low-credits-expanded" />
          )}
        </div>
        <span className={`text-sm font-semibold ${getCounterTextClass()}`} data-testid="text-credits-count">
          {postsRemaining}/{postsLimit}
        </span>
      </div>
      
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-2" data-testid="progress-credits-bar">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${getProgressColor()} transition-all duration-500`}
          style={{ width: `${percentageRemaining}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground" data-testid="text-credits-remaining">
          {postsRemaining} {t("sidebar.postsRemaining")}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-400"
              data-testid="button-more-credits"
            >
              {t("sidebar.moreCredits")}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {t("sidebar.buyMoreCredits")}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { state } = useSidebar();
  const { t } = useTranslation();
  const isCollapsed = state === "collapsed";
  
  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: profile } = useQuery<ContentProfile>({
    queryKey: ["/api/profile"],
  });

  const showProfileBadge = 
    profile?.onboardingCompleted && 
    !profile?.profileStudioCompleted;

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const navigationItems = [
    {
      title: t("dashboard.title"),
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t("studio.createPost"),
      url: "/studio",
      icon: PenTool,
    },
    {
      title: t("profileStudio.title"),
      url: "/profile-studio",
      icon: User,
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary">
            <PenTool className="h-4 w-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-sidebar-foreground">Viral Content</span>
          )}
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navigationItems.map((item) => {
            const isProfileStudio = item.url === "/profile-studio";
            const shouldShowBadge = isProfileStudio && showProfileBadge;
            
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton 
                  asChild 
                  isActive={location === item.url}
                  tooltip={shouldShowBadge ? t("profileStudio.completeProfile") : item.title}
                  data-testid={`nav-${item.url.replace("/", "")}`}
                >
                  <Link href={item.url}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {shouldShowBadge && (
                  <SidebarMenuBadge className="animate-pulse bg-primary text-primary-foreground">
                    !
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
        
        <div className="mt-auto pt-4">
          <CreditsIndicator isCollapsed={isCollapsed} />
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <Popover>
          <PopoverTrigger asChild>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="flex flex-col items-center p-1 rounded-md hover-elevate cursor-pointer" data-testid="button-user-menu-collapsed">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(user?.firstName)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {user?.firstName || t("common.user")}
                </TooltipContent>
              </Tooltip>
            ) : (
              <button className="flex items-center gap-3 w-full p-2 rounded-md hover-elevate cursor-pointer" data-testid="button-user-menu">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(user?.firstName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user?.firstName || t("common.user")}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email || ""}
                  </p>
                </div>
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </PopoverTrigger>
          <PopoverContent 
            side={isCollapsed ? "right" : "top"} 
            align="start"
            className="w-56 p-1"
          >
            <div className="flex flex-col">
              {!isCollapsed && (
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-medium truncate" data-testid="text-user-email">{user?.email || ""}</p>
                </div>
              )}
              <Link href="/settings">
                <button 
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover-elevate text-left"
                  data-testid="button-settings"
                >
                  <Settings className="h-4 w-4" />
                  {t("settings.title")}
                </button>
              </Link>
              <button 
                className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover-elevate text-left text-destructive"
                onClick={async () => {
                  await trackLogout('manual');
                  window.location.href = '/api/logout';
                }}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
                {t("common.logout")}
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </SidebarFooter>
    </Sidebar>
  );
}
