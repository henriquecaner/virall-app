import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Post, ContentProfile } from "@shared/schema";
import { 
  Zap,
  Settings,
  LogOut,
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Calendar,
  ArrowLeft,
  Award
} from "lucide-react";
import { useEffect } from "react";

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  testId
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  testId: string;
}) {
  return (
    <Card data-testid={`card-stat-${testId}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`text-value-${testId}`}>{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Fazendo login novamente...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [authLoading, isAuthenticated, toast]);

  const { data: profile } = useQuery<ContentProfile>({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated,
  });

  const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    enabled: isAuthenticated && !!profile?.onboardingCompleted,
  });

  useEffect(() => {
    if (profile && !profile.onboardingCompleted) {
      navigate("/onboarding");
    }
  }, [profile, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const totalPosts = posts?.length ?? 0;
  const avgScore = totalPosts > 0 
    ? (posts!.reduce((sum, p) => sum + p.score, 0) / totalPosts).toFixed(1)
    : "0.0";
  const avgTop1 = totalPosts > 0
    ? Math.round(posts!.reduce((sum, p) => sum + (p.top1Probability ?? 0), 0) / totalPosts)
    : 0;
  const avgTop5 = totalPosts > 0
    ? Math.round(posts!.reduce((sum, p) => sum + (p.top5Probability ?? 0), 0) / totalPosts)
    : 0;

  const dayCount: Record<string, number> = {};
  const timeCount: Record<string, number> = {};
  
  posts?.forEach(p => {
    if (p.bestPostingDay) {
      dayCount[p.bestPostingDay] = (dayCount[p.bestPostingDay] ?? 0) + 1;
    }
    if (p.bestPostingTime) {
      timeCount[p.bestPostingTime] = (timeCount[p.bestPostingTime] ?? 0) + 1;
    }
  });

  const bestDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  const bestTime = Object.entries(timeCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

  const structureCount: Record<string, number> = {};
  const contentTypeCount: Record<string, number> = {};
  
  posts?.forEach(p => {
    structureCount[p.structure] = (structureCount[p.structure] ?? 0) + 1;
    contentTypeCount[p.contentType] = (contentTypeCount[p.contentType] ?? 0) + 1;
  });

  const topStructures = Object.entries(structureCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  const topContentTypes = Object.entries(contentTypeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topPosts = [...(posts ?? [])]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Acompanhe a performance dos seus posts</p>
          </div>
        </div>
        {postsLoading ? (
          <AnalyticsSkeleton />
        ) : totalPosts === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <BarChart3 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Sem dados ainda</h2>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              Crie posts para ver suas métricas de performance aqui.
            </p>
            <Button onClick={() => navigate("/studio")} className="gap-2" data-testid="button-go-studio">
              Criar primeiro post
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total de Posts"
                value={totalPosts}
                subtitle="posts criados"
                icon={BarChart3}
                testId="total-posts"
              />
              <StatCard
                title="Score Médio"
                value={avgScore}
                subtitle="de 10 pontos"
                icon={Target}
                testId="avg-score"
              />
              <StatCard
                title="Prob. Top 1%"
                value={`${avgTop1}%`}
                subtitle="média dos posts"
                icon={Award}
                testId="avg-top1"
              />
              <StatCard
                title="Prob. Top 5%"
                value={`${avgTop5}%`}
                subtitle="média dos posts"
                icon={TrendingUp}
                testId="avg-top5"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card data-testid="card-best-day">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Melhor Dia para Postar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary capitalize mb-2" data-testid="text-best-day">
                    {bestDay}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Baseado na análise de {totalPosts} posts
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-best-time">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Melhor Horário
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary mb-2" data-testid="text-best-time">
                    {bestTime}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Horário mais recomendado
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estruturas Mais Usadas</CardTitle>
                </CardHeader>
                <CardContent>
                  {topStructures.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                  ) : (
                    <div className="space-y-3">
                      {topStructures.map(([structure, count]) => (
                        <div key={structure} className="flex items-center justify-between">
                          <Badge variant="secondary" className="uppercase">
                            {structure}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {count} post{count > 1 ? "s" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tipos de Conteúdo Mais Usados</CardTitle>
                </CardHeader>
                <CardContent>
                  {topContentTypes.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                  ) : (
                    <div className="space-y-3">
                      {topContentTypes.map(([contentType, count]) => (
                        <div key={contentType} className="flex items-center justify-between">
                          <Badge variant="secondary">
                            {contentType}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {count} post{count > 1 ? "s" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top 5 Posts por Score</CardTitle>
              </CardHeader>
              <CardContent>
                {topPosts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
                ) : (
                  <div className="space-y-4">
                    {topPosts.map((post, index) => (
                      <div 
                        key={post.id} 
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                        data-testid={`top-post-${index}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{post.hook}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs uppercase">
                              {post.structure}
                            </Badge>
                            {post.top1Probability && (
                              <span className="text-xs text-muted-foreground">
                                Top 1%: {post.top1Probability}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          post.score >= 9 ? "bg-green-500 text-white dark:bg-green-600" : 
                          post.score >= 7 ? "bg-yellow-500 text-black dark:bg-yellow-600" : 
                          "bg-destructive text-destructive-foreground"
                        }`}>
                          {post.score.toFixed(1)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
