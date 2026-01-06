import { Switch, Route, useLocation, Redirect } from "wouter";
import { Suspense, lazy, useTransition, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/lib/i18n";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/hooks/useAuth";
import { initAllAnalytics } from "@/lib/analytics";
import { useAnalytics } from "@/hooks/use-analytics";
import { captureTrafficSource } from "@/lib/trafficTracking";

// Lazy load pages for better initial load performance
const Landing = lazy(() => import("@/pages/landing"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Onboarding = lazy(() => import("@/pages/onboarding"));
const Studio = lazy(() => import("@/pages/studio"));
const ProfileStudio = lazy(() => import("@/pages/profile-studio"));
const Settings = lazy(() => import("@/pages/settings"));
const Signup = lazy(() => import("@/pages/signup"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

const authenticatedRoutes = ["/dashboard", "/studio", "/profile-studio", "/settings"];

function AuthenticatedRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  return (
    <AppShell>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/studio" component={Studio} />
        <Route path="/profile-studio" component={ProfileStudio} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function PublicRoutes() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/signup" component={Signup} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const [location] = useLocation();
  const isAuthenticatedRoute = authenticatedRoutes.includes(location);
  
  // Track page views across all routes
  useAnalytics();

  if (isAuthenticatedRoute) {
    return <AuthenticatedRoutes />;
  }

  return <PublicRoutes />;
}

function App() {
  // Initialize all analytics (GA4, Google Ads, Meta Pixel) and capture traffic source on app load
  useEffect(() => {
    initAllAnalytics();
    captureTrafficSource();
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Suspense fallback={<PageLoader />}>
              <Router />
            </Suspense>
          </TooltipProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
