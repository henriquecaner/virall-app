import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLocation } from "wouter";

interface AppShellProps {
  children: React.ReactNode;
}

const routeNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/studio": "Criar Post",
  "/profile-studio": "Profile Studio",
  "/settings": "Configurações",
  "/analytics": "Analytics",
};

export function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();
  const currentPageName = routeNames[location] || "Página";

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider defaultOpen={false} style={sidebarStyle}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-h-0">
          <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <SidebarTrigger 
              className="-ml-1" 
              data-testid="button-sidebar-toggle"
              aria-label="Alternar menu lateral"
            />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Viral Content</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentPageName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 min-h-0 flex flex-col">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
