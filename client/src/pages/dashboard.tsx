import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { OnboardingModal } from "@/components/onboarding-modal";
import { ProfileStudioPrompt } from "@/components/profile-studio-prompt";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Post, ContentProfile, Subscription } from "@shared/schema";
import { 
  Plus, 
  MoreVertical, 
  Eye, 
  Trash2, 
  Zap,
  FileText,
  Settings,
  LogOut,
  Calendar,
  TrendingUp,
  Copy,
  BarChart3,
  Download,
  Clipboard,
  Check,
  ThumbsUp,
  ThumbsDown,
  User,
  MessageSquare,
  Clock
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useTranslation } from "@/lib/i18n";

function formatLinkedInPost(post: Post): string {
  return `${post.hook}\n\n${post.body}\n\n${post.cta}`;
}

function formatPlainTextExport(post: Post, t: (key: string) => string, language: string): string {
  const dateLocale = language === "pt-BR" ? ptBR : enUS;
  return `=== ${t("dashboard.linkedInPostHeader")} ===
${t("dashboard.createdAt")}: ${format(new Date(post.createdAt!), "dd/MM/yyyy HH:mm", { locale: dateLocale })}
${t("dashboard.structure")}: ${post.structure.toUpperCase()}
${t("dashboard.type")}: ${post.contentType}
${t("dashboard.score")}: ${(post.score ?? 0).toFixed(1)}/10

--- ${t("dashboard.hook").toUpperCase()} ---
${post.hook}

--- ${t("dashboard.body").toUpperCase()} ---
${post.body}

--- ${t("dashboard.cta").toUpperCase()} ---
${post.cta}

--- ${t("dashboard.metrics")} ---
${t("dashboard.hook")}: ${(post.hookScore ?? 0).toFixed(1)}
${t("dashboard.structure")}: ${(post.structureScore ?? 0).toFixed(1)}
${t("dashboard.data")}: ${(post.dataScore ?? 0).toFixed(1)}
${t("dashboard.cta")}: ${(post.ctaScore ?? 0).toFixed(1)}
${t("dashboard.algorithm")}: ${(post.algorithmScore ?? 0).toFixed(1)}
${post.top1Probability ? `${t("dashboard.probTop1")}: ${post.top1Probability}%` : ""}
${post.top5Probability ? `${t("dashboard.probTop5")}: ${post.top5Probability}%` : ""}
${post.bestPostingDay ? `${t("dashboard.bestDay")}: ${post.bestPostingDay}` : ""}
${post.bestPostingTime ? `${t("dashboard.bestTime")}: ${post.bestPostingTime}` : ""}
`;
}

function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function ScoreBadge({ score }: { score: number | null }) {
  const { t } = useTranslation();
  
  if (score === null || score === undefined) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center bg-muted text-muted-foreground cursor-help"
            aria-label={t("dashboard.inProgress")}
          >
            <Clock className="w-4 h-4" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{t("dashboard.inProgress")}</p>
          <p className="text-xs text-muted-foreground">{t("dashboard.sessionNotFinished")}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  let bgColor = "bg-destructive text-destructive-foreground";
  let label = t("dashboard.needsImprovement");
  if (score >= 9) {
    bgColor = "bg-green-500 text-white dark:bg-green-600";
    label = t("dashboard.excellentReadyToViral");
  } else if (score >= 7) {
    bgColor = "bg-yellow-500 text-black dark:bg-yellow-600";
    label = t("dashboard.goodButCanImprove");
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm cursor-help ${bgColor}`}
          aria-label={`Score ${score.toFixed(1)} - ${label}`}
        >
          {score.toFixed(1)}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{t("dashboard.scoreBased")}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function PostCard({ 
  post, 
  onView, 
  onDelete,
  onViewHistory
}: { 
  post: Post; 
  onView: () => void; 
  onDelete: () => void;
  onViewHistory?: () => void;
}) {
  const { t, language } = useTranslation();
  const isInProgress = (post as any).status === "in_progress";
  const hookPreview = post.hook.length > 100 
    ? post.hook.substring(0, 100) + "..." 
    : post.hook;

  const hasSessionHistory = (post as any).sessionHistory && (post as any).sessionHistory.length > 0;
  const dateLocale = language === "pt-BR" ? ptBR : enUS;

  return (
    <Card className="hover-elevate active-elevate-2 transition-all" data-testid={`card-post-${post.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="flex-1 min-w-0">
          {isInProgress && (
            <Badge variant="outline" className="mb-2 text-xs border-amber-500 text-amber-600 dark:text-amber-400">
              <Clock className="w-3 h-3 mr-1" />
              {t("dashboard.inProgress")}
            </Badge>
          )}
          <p className="font-medium leading-snug line-clamp-2" data-testid={`text-hook-${post.id}`}>
            {hookPreview}
          </p>
        </div>
        <ScoreBadge score={post.score} />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(post.createdAt!), "dd MMM yyyy", { locale: dateLocale })}
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {post.structure.toUpperCase()}
            </Badge>
            {hasSessionHistory && (
              <Badge variant="outline" className="text-xs">
                <MessageSquare className="w-3 h-3 mr-1" />
                {(post as any).sessionHistory.length} {t("dashboard.msgs")}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="default" 
              size="sm" 
              onClick={onView}
              data-testid={`button-view-${post.id}`}
            >
              <Eye className="w-4 h-4 mr-1" />
              {t("dashboard.viewPost")}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid={`button-post-menu-${post.id}`}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView} data-testid={`button-view-post-${post.id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  {t("dashboard.viewFullPost")}
                </DropdownMenuItem>
                {hasSessionHistory && (
                  <DropdownMenuItem onClick={onViewHistory} data-testid={`button-view-history-${post.id}`}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {t("dashboard.viewChatHistory")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={onDelete} 
                  className="text-destructive focus:text-destructive"
                  data-testid={`button-delete-post-${post.id}`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("dashboard.deletePost")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <FileText className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{t("dashboard.noPostsYet")}</h2>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        {t("dashboard.noPostsDescription")}
      </p>
      <Button size="lg" onClick={() => navigate("/studio")} className="gap-2" data-testid="button-create-first-post">
        <Plus className="w-5 h-5" />
        {t("dashboard.createFirstPost")}
      </Button>
    </div>
  );
}

function PostsSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="w-10 h-10 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [historyPost, setHistoryPost] = useState<Post | null>(null);
  const [deletePost, setDeletePost] = useState<Post | null>(null);
  const [copiedState, setCopiedState] = useState<"none" | "linkedin" | "full">("none");

  const copyToClipboard = useCallback(async (text: string, type: "linkedin" | "full") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedState(type);
      toast({
        title: t("common.copied"),
        description: type === "linkedin" ? t("dashboard.postReadyToPaste") : t("dashboard.textCopied"),
      });
      setTimeout(() => setCopiedState("none"), 2000);
    } catch {
      toast({
        title: t("common.error"),
        description: t("dashboard.couldNotCopy"),
        variant: "destructive",
      });
    }
  }, [toast, t]);

  const handleExportText = useCallback((post: Post) => {
    const content = formatPlainTextExport(post, t, language);
    const filename = `post-linkedin-${format(new Date(post.createdAt!), "yyyy-MM-dd")}.txt`;
    downloadTextFile(content, filename);
    toast({
      title: t("dashboard.downloadStarted"),
      description: t("dashboard.fileDownloaded"),
    });
  }, [toast, t, language]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: t("common.unauthorized"),
        description: t("common.loggingIn"),
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [authLoading, isAuthenticated, toast, t]);

  const { data: profile, isLoading: profileLoading } = useQuery<ContentProfile>({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated,
  });

  const { data: subscription } = useQuery<Subscription>({
    queryKey: ["/api/subscription"],
    enabled: isAuthenticated,
  });

  const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    enabled: isAuthenticated && !!profile?.onboardingCompleted,
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      toast({
        title: t("dashboard.postDeleted"),
        description: t("dashboard.postDeletedDescription"),
      });
      setDeletePost(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: t("common.unauthorized"),
          description: t("common.loggingIn"),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: t("common.error"),
        description: t("dashboard.couldNotDeletePost"),
        variant: "destructive",
      });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async ({ postId, feedback }: { postId: string; feedback: string | null }) => {
      const response = await apiRequest("PATCH", `/api/posts/${postId}/feedback`, { feedback });
      return response.json();
    },
    onSuccess: (updatedPost: Post) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      if (selectedPost && selectedPost.id === updatedPost.id) {
        setSelectedPost(updatedPost);
      }
      toast({
        title: t("dashboard.feedbackRegistered"),
        description: t("dashboard.thanksForFeedback"),
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: t("common.unauthorized"),
          description: t("common.loggingIn"),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: t("common.error"),
        description: t("dashboard.couldNotRegisterFeedback"),
        variant: "destructive",
      });
    },
  });

  const handleOnboardingComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
  };

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

  const postsUsed = subscription?.postsUsedThisMonth ?? 0;
  const postsLimit = subscription?.postsLimit ?? 8;

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">{t("dashboard.title")}</h1>
            <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              {postsUsed}/{postsLimit} {t("common.posts")}
            </Badge>
            <Button 
              onClick={() => navigate("/studio")} 
              className="gap-2"
              disabled={postsUsed >= postsLimit}
              data-testid="button-new-post"
            >
              <Plus className="w-4 h-4" />
              {t("dashboard.newPost")}
            </Button>
          </div>
        </div>
        {postsLoading ? (
          <PostsSkeleton />
        ) : !posts || posts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onView={() => setSelectedPost(post)}
                onDelete={() => setDeletePost(post)}
                onViewHistory={() => setHistoryPost(post)}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <DialogTitle>{t("dashboard.fullPost")}</DialogTitle>
              {selectedPost && <ScoreBadge score={selectedPost.score} />}
            </div>
            <DialogDescription className="sr-only">
              {t("dashboard.chatHistoryFor")}
            </DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">{t("dashboard.hook")}</h3>
                <p className="font-semibold whitespace-pre-wrap" data-testid="text-full-hook">
                  {selectedPost.hook}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">{t("dashboard.body")}</h3>
                <p className="whitespace-pre-wrap text-muted-foreground" data-testid="text-full-body">
                  {selectedPost.body}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">{t("dashboard.cta")}</h3>
                <p className="font-medium" data-testid="text-full-cta">{selectedPost.cta}</p>
              </div>
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{(selectedPost.hookScore ?? 0).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">{t("dashboard.hook")}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{(selectedPost.structureScore ?? 0).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">{t("dashboard.structure")}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{(selectedPost.dataScore ?? 0).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">{t("dashboard.data")}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{(selectedPost.ctaScore ?? 0).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">{t("dashboard.cta")}</p>
                  </div>
                </div>
              </div>
              {(selectedPost.top1Probability || selectedPost.top5Probability) && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">{t("dashboard.performancePrediction")}</p>
                  <div className="flex gap-4">
                    {selectedPost.top1Probability && (
                      <Badge variant="secondary">Top 1%: {selectedPost.top1Probability}%</Badge>
                    )}
                    {selectedPost.top5Probability && (
                      <Badge variant="secondary">Top 5%: {selectedPost.top5Probability}%</Badge>
                    )}
                  </div>
                </div>
              )}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">{t("dashboard.export")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(formatLinkedInPost(selectedPost), "linkedin")}
                    className="gap-2"
                    data-testid="button-copy-linkedin"
                  >
                    {copiedState === "linkedin" ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                    {t("dashboard.copyToLinkedIn")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(formatPlainTextExport(selectedPost, t, language), "full")}
                    className="gap-2"
                    data-testid="button-copy-full"
                  >
                    {copiedState === "full" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {t("dashboard.copyAll")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportText(selectedPost)}
                    className="gap-2"
                    data-testid="button-download-txt"
                  >
                    <Download className="w-4 h-4" />
                    {t("dashboard.downloadTxt")}
                  </Button>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">{t("dashboard.howWasThisPost")}</p>
                <div className="flex gap-2">
                  <Button
                    variant={selectedPost.feedback === "up" ? "default" : "outline"}
                    size="sm"
                    onClick={() => feedbackMutation.mutate({ 
                      postId: selectedPost.id, 
                      feedback: selectedPost.feedback === "up" ? null : "up" 
                    })}
                    disabled={feedbackMutation.isPending}
                    className="gap-2"
                    data-testid="button-feedback-up"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {t("dashboard.good")}
                  </Button>
                  <Button
                    variant={selectedPost.feedback === "down" ? "default" : "outline"}
                    size="sm"
                    onClick={() => feedbackMutation.mutate({ 
                      postId: selectedPost.id, 
                      feedback: selectedPost.feedback === "down" ? null : "down" 
                    })}
                    disabled={feedbackMutation.isPending}
                    className="gap-2"
                    data-testid="button-feedback-down"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    {t("dashboard.canImprove")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletePost} onOpenChange={() => setDeletePost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboard.deletePostTitle")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.deletePostDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePost(null)} data-testid="button-cancel-delete">
              {t("common.cancel")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deletePost && deleteMutation.mutate(deletePost.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? t("dashboard.deleting") : t("dashboard.confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyPost} onOpenChange={() => setHistoryPost(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {t("dashboard.sessionHistory")}
            </DialogTitle>
            <DialogDescription>
              {t("dashboard.sessionHistoryDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {historyPost && (historyPost as any).sessionHistory && (
              (historyPost as any).sessionHistory.map((msg: any, index: number) => (
                <div 
                  key={msg.id || index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-md p-3 ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.options && msg.options.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs opacity-70 mb-1">{t("dashboard.optionsPresented")}</p>
                        <ul className="text-xs space-y-1">
                          {msg.options.slice(0, 3).map((opt: any, i: number) => {
                            const optText = typeof opt === 'string' 
                              ? opt 
                              : (opt?.label || opt?.description || '');
                            return (
                              <li key={i} className="opacity-80 truncate">
                                {i + 1}. {optText.substring(0, 80)}{optText.length > 80 ? '...' : ''}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {historyPost && (!(historyPost as any).sessionHistory || (historyPost as any).sessionHistory.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t("dashboard.noHistoryAvailable")}</p>
                <p className="text-sm mt-1">{t("dashboard.postsBeforeUpdate")}</p>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setHistoryPost(null)}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <OnboardingModal profile={profile} isLoading={profileLoading} onComplete={handleOnboardingComplete} user={user ? { firstName: user.firstName ?? undefined, lastName: user.lastName ?? undefined, phone: user.phone ?? undefined } : null} />
      <ProfileStudioPrompt />
    </div>
  );
}
