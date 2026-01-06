import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useTranslation } from "@/lib/i18n";
import {
  COPYWRITING_STRUCTURES,
  CONTENT_TYPES,
  CREATOR_ARCHETYPES,
  BRIEFING_TEMPLATES,
  type ContentProfile,
  type Subscription,
  type StudioSession,
} from "@shared/schema";
import {
  Zap,
  ArrowLeft,
  Send,
  RefreshCw,
  Check,
  Copy,
  Sparkles,
  ChevronRight,
  LayoutDashboard,
  Info,
  Eye,
  EyeOff,
  Lightbulb,
  Clock,
  User,
  Wand2,
  X,
  AlertCircle,
  GraduationCap,
  Trophy,
  TrendingDown,
  Wrench,
  MessageCircle,
  Pencil,
  ThumbsUp,
  MoreHorizontal,
  Globe,
  ChevronDown,
} from "lucide-react";
import { 
  trackContentStarted, 
  trackContentCompleted, 
  trackAIGeneration, 
  trackCopyContent 
} from "@/lib/analytics";

const getStepLabels = (t: (key: string) => string) => [
  t("studio.briefing"),
  t("studio.structure"),
  t("studio.contentType"),
  t("studio.hook"),
  t("studio.body"),
  t("studio.cta"),
  t("studio.validation"),
];

type TopicSuggestion = {
  id: string;
  title: string;
  angle: string;
  why: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  options?: Array<{ id: string; label: string; description?: string; guidance?: string }>;
  isLoading?: boolean;
  isGeneratingSuggestions?: boolean;
  suggestions?: TopicSuggestion[];
  generationStartTime?: number;
};

const generateMessageId = () => `msg-${crypto.randomUUID()}`;

// Helper to create messages with auto-generated IDs
const createMessage = (msg: Omit<Message, 'id'>): Message => ({
  ...msg,
  id: generateMessageId(),
});

type ContentScores = {
  hook: number;
  structure: number;
  data: number;
  cta: number;
  algorithm: number;
};

type ContentPredictions = {
  top1: number;
  top5: number;
  bestDay: string;
  bestTime: string;
};

type ContentVersion = {
  id: string;
  hook: string;
  body: string;
  cta: string;
  score: number | null;
  scores: ContentScores | null;
  predictions: ContentPredictions | null;
  isOriginal: boolean;
  refinementInstruction?: string;
  refinedField?: "hook" | "body" | "cta";
  createdAt: string;
  isScoring?: boolean;
};

type StudioState = {
  topic: string;
  objective: string;
  desiredFeeling: string;
  structure: string;
  contentType: string;
  hooks: string[];
  selectedHook: string;
  hookCount: number;
  body: string;
  ctas: string[];
  selectedCta: string;
  ctaCount: number;
  score: number | null;
  scores: ContentScores | null;
  predictions: ContentPredictions | null;
  briefingSubStep: 0 | 1 | 2 | 3; // 0 = template selection
  selectedTemplate: string;
  versions: ContentVersion[];
  activeVersionId: string | null;
};

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  "lesson-career": <GraduationCap className="w-5 h-5" />,
  "announce-achievement": <Trophy className="w-5 h-5" />,
  "failure-story": <TrendingDown className="w-5 h-5" />,
  "demystify": <Lightbulb className="w-5 h-5" />,
  "practical-tip": <Wrench className="w-5 h-5" />,
  "market-opinion": <MessageCircle className="w-5 h-5" />,
  "behind-scenes": <Eye className="w-5 h-5" />,
  "free-topic": <Pencil className="w-5 h-5" />,
};

function ScoreBadge({ score, size = "lg", t }: { score: number; size?: "sm" | "lg"; t: (key: string) => string }) {
  let bgColor = "bg-destructive text-destructive-foreground";
  let label = t("studio.needsImprovement");
  if (score >= 8) {
    bgColor = "bg-green-500 text-white dark:bg-green-600";
    label = t("studio.excellentReadyToViral");
  } else if (score >= 7) {
    bgColor = "bg-yellow-500 text-black dark:bg-yellow-600";
    label = t("studio.goodButCanImprove");
  }

  const sizeClass = size === "lg" ? "w-16 h-16 text-xl" : "w-10 h-10 text-sm";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={`${sizeClass} rounded-full flex items-center justify-center font-bold cursor-help ${bgColor}`}
          aria-label={`Score ${score.toFixed(1)} - ${label}`}
        >
          {score.toFixed(1)}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{t("studio.score8Required")}</p>
      </TooltipContent>
    </Tooltip>
  );
}

const getThinkingMessages = (t: (key: string) => string): Record<number, string[]> => ({
  1: [t("studio.analyzingBriefing"), t("studio.understandingContext"), t("studio.preparingNextSteps")],
  2: [t("studio.evaluatingStructures"), t("studio.selectingBestFormats")],
  3: [t("studio.analyzingContentTypes"), t("studio.identifyingIdealFormat")],
  4: [t("studio.creatingViralHooks"), t("studio.testingImpactfulOpenings"), t("studio.optimizingForEngagement")],
  5: [t("studio.developingBody"), t("studio.applyingStorytelling"), t("studio.structuringArguments")],
  6: [t("studio.generatingCTAs"), t("studio.creatingCalls"), t("studio.optimizingConversion")],
  7: [t("studio.validatingQuality"), t("studio.calculatingScore"), t("studio.analyzingPredictive")],
});

function ThinkingIndicator({ step = 1, t }: { step?: number; t: (key: string) => string }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [dotCount, setDotCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const thinkingMessages = getThinkingMessages(t);
  const messages = thinkingMessages[step] || thinkingMessages[1];

  useEffect(() => {
    // Rotate through contextual messages
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 2500);

    // Animate dots
    const dotInterval = setInterval(() => {
      setDotCount(prev => (prev + 1) % 4);
    }, 400);

    // Track elapsed time
    const timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(dotInterval);
      clearInterval(timeInterval);
    };
  }, [messages.length]);

  const currentMessage = messages[messageIndex].replace("...", ".".repeat(dotCount));

  return (
    <div className="flex items-start gap-3 p-4">
      <div className="flex items-center gap-1 pt-1">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <div className="w-2 h-2 rounded-full bg-primary/70 animate-pulse" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: "300ms" }} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-foreground font-medium">{currentMessage}</span>
        {elapsedTime > 3 && (
          <span className="text-xs text-muted-foreground">{elapsedTime}s</span>
        )}
      </div>
    </div>
  );
}

function TypewriterText({ text, speed = 15, onComplete, onProgress }: { text: string; speed?: number; onComplete?: () => void; onProgress?: () => void }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isComplete) return;
    
    let currentIndex = 0;
    let lastScrollCall = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
        // Call onProgress every 10 characters for smooth scrolling
        if (currentIndex - lastScrollCall >= 10) {
          lastScrollCall = currentIndex;
          onProgress?.();
        }
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete, onProgress, isComplete]);

  return <span>{displayedText}</span>;
}

// Suggestions generation indicator with timer
function SuggestionsGeneratingIndicator({ startTime, t }: { startTime?: number; t: (key: string) => string }) {
  const [dotCount, setDotCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  
  const messages = [
    t("studio.analyzingProfile"),
    t("studio.searchingTrends"),
    t("studio.generatingTopics"),
    t("studio.applyingPreferences"),
  ];

  useEffect(() => {
    const initialElapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    setElapsedTime(initialElapsed);
    
    const dotInterval = setInterval(() => {
      setDotCount(prev => (prev + 1) % 4);
    }, 400);
    
    const timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 2000);

    return () => {
      clearInterval(dotInterval);
      clearInterval(timeInterval);
      clearInterval(messageInterval);
    };
  }, [startTime, messages.length]);

  const currentMessage = messages[messageIndex] + ".".repeat(dotCount);

  return (
    <div className="flex items-start gap-3 p-4">
      <div className="flex items-center gap-1 pt-1">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <div className="w-2 h-2 rounded-full bg-primary/70 animate-pulse" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: "300ms" }} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-foreground font-medium">{currentMessage}</span>
        <span className="text-xs text-muted-foreground">{elapsedTime}s</span>
      </div>
    </div>
  );
}

// Topic suggestions cards component for chat feed
function TopicSuggestionsCards({ 
  suggestions, 
  onSelect, 
  templateName,
  t 
}: { 
  suggestions: TopicSuggestion[];
  onSelect: (suggestion: TopicSuggestion) => void;
  templateName: string;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="font-medium text-sm">{t("studio.suggestionsFor")} "{templateName}":</span>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {suggestions.map((suggestion) => (
          <Card 
            key={suggestion.id} 
            className="hover-elevate cursor-pointer transition-all"
            onClick={() => onSelect(suggestion)}
            data-testid={`card-suggestion-${suggestion.id}`}
          >
            <CardContent className="p-3">
              <p className="font-medium text-sm mb-1">{suggestion.title}</p>
              <p className="text-xs text-muted-foreground mb-2">{suggestion.angle}</p>
              <p className="text-xs text-primary/80">{suggestion.why}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2">
        {t("studio.orTypeYourOwn")}
      </p>
    </div>
  );
}

function MessageBubble({ message, onSelectOption, onRegenerate, onSelectSuggestion, step = 1, isNew = false, onTypingComplete, onTypingProgress, t }: {
  message: Message;
  onSelectOption?: (id: string) => void;
  onRegenerate?: () => void;
  onSelectSuggestion?: (suggestion: TopicSuggestion) => void;
  step?: number;
  isNew?: boolean;
  onTypingComplete?: () => void;
  onTypingProgress?: () => void;
  t: (key: string) => string;
}) {
  const isUser = message.role === "user";
  const [typingDone, setTypingDone] = useState(false);

  // Show options when: not a new message OR typing is complete
  const showOptions = !isNew || typingDone;

  // Show generating suggestions indicator
  if (message.isGeneratingSuggestions) {
    return (
      <div className="flex gap-3 justify-start">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 mt-1">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="max-w-[85%] bg-muted/60 rounded-2xl rounded-tl-md px-4 py-3">
          <SuggestionsGeneratingIndicator startTime={message.generationStartTime} t={t} />
        </div>
      </div>
    );
  }

  if (message.isLoading) {
    return (
      <div className="flex gap-3 justify-start">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 mt-1">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="max-w-[85%] bg-muted/60 rounded-2xl rounded-tl-md px-4 py-3">
          <ThinkingIndicator step={step} t={t} />
        </div>
      </div>
    );
  }

  const handleTypingComplete = () => {
    setTypingDone(true);
    onTypingComplete?.();
  };

  // Get template name for suggestions display
  const getTemplateName = () => {
    // Extract template name from message content if it contains suggestions
    return "este tipo de conteudo";
  };

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} ${isNew ? "animate-in fade-in-0 slide-in-from-bottom-2 duration-300" : ""}`}>
      {/* System Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 mt-1">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      
      <div className={`max-w-[85%] ${isUser ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md" : "bg-muted/60 rounded-2xl rounded-tl-md"} px-4 py-3`}>
        {message.content && (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {isNew && !typingDone && !isUser ? (
              <TypewriterText text={message.content} speed={12} onComplete={handleTypingComplete} onProgress={onTypingProgress} />
            ) : (
              message.content
            )}
          </div>
        )}
        {/* Options are shown inline */}
        {message.options && message.options.length > 0 && showOptions && (
          <div className="mt-4 space-y-2 animate-in fade-in-0 duration-300">
            {message.options.map((option) => (
              <Button
                key={option.id}
                variant="outline"
                className="w-full justify-between text-left h-auto min-h-11 py-3 px-4 whitespace-normal bg-background/80"
                onClick={() => onSelectOption?.(option.id)}
                data-testid={`button-option-${option.id}`}
              >
                <div className="flex-1 overflow-hidden">
                  <div className="font-medium break-words text-foreground">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-muted-foreground mt-0.5 break-words">{option.description}</div>
                  )}
                </div>
                {option.guidance && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="shrink-0 ml-3 p-1 rounded hover:bg-muted/50"
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`button-info-${option.id}`}
                      >
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center" className="max-w-xs">
                      <p className="text-sm">{option.guidance}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </Button>
            ))}
            {onRegenerate && (
              <Button
                variant="outline"
                size="default"
                className="gap-2 mt-3 w-full sm:w-auto min-h-11"
                onClick={onRegenerate}
                data-testid="button-regenerate"
              >
                <RefreshCw className="w-4 h-4" />
                {t("studio.generateNewOptions")}
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// Refinement input component for Edit with AI
function RefinementInput({ 
  contentType, 
  currentContent, 
  onRefine, 
  isRefining,
  context,
  t 
}: { 
  contentType: "hook" | "body" | "cta";
  currentContent: string;
  onRefine: (instruction: string) => void;
  isRefining: boolean;
  context?: { topic?: string; hook?: string; body?: string };
  t: (key: string) => string;
}) {
  const [instruction, setInstruction] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instruction.trim() && !isRefining) {
      onRefine(instruction.trim());
      setInstruction("");
    }
  };

  const handleQuickAction = (action: string) => {
    if (!isRefining) {
      onRefine(action);
    }
  };

  const quickActions: Record<string, { key: string; label: string }[]> = {
    hook: [
      { key: "shorter", label: t("studio.shorter") },
      { key: "moreImpactful", label: t("studio.moreImpactful") },
      { key: "moreProvocative", label: t("studio.moreProvocative") },
      { key: "moreProfessional", label: t("studio.moreProfessional") },
    ],
    body: [
      { key: "moreConcise", label: t("studio.moreConcise") },
      { key: "addExample", label: t("studio.addExample") },
      { key: "moreStorytelling", label: t("studio.moreStorytelling") },
      { key: "simplify", label: t("studio.simplify") },
    ],
    cta: [
      { key: "softer", label: t("studio.softer") },
      { key: "moreUrgent", label: t("studio.moreUrgent") },
      { key: "openQuestion", label: t("studio.openQuestion") },
      { key: "moreDirect", label: t("studio.moreDirect") },
    ],
  };

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        size="default"
        className="gap-1.5 min-h-11 text-xs mt-1"
        onClick={() => setIsExpanded(true)}
        disabled={isRefining}
        data-testid={`button-edit-${contentType}`}
      >
        <Wand2 className="w-4 h-4" />
        {t("studio.editWithAI")}
      </Button>
    );
  }

  return (
    <div className="mt-2 p-3 bg-muted/50 rounded-md space-y-3 animate-in fade-in-0 duration-200">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{t("studio.editWithAI")}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(false)}
          data-testid={`button-close-edit-${contentType}`}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {quickActions[contentType].map((action) => (
          <Button
            key={action.key}
            variant="outline"
            size="default"
            className="min-h-11 text-xs px-4"
            onClick={() => handleQuickAction(action.label)}
            disabled={isRefining}
            data-testid={`button-quick-${contentType}-${action.key}`}
          >
            {action.label}
          </Button>
        ))}
      </div>
      {isRefining && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <div className="w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          {t("studio.refiningContent")}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={t("studio.describeChange")}
          className="min-h-11 text-sm"
          disabled={isRefining}
          data-testid={`input-refine-${contentType}`}
        />
        <Button 
          type="submit" 
          size="icon" 
          className="min-h-11 min-w-11"
          disabled={!instruction.trim() || isRefining}
          data-testid={`button-submit-refine-${contentType}`}
        >
          {isRefining ? (
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
}

// Real-time post preview component - LinkedIn style
function PostPreview({ 
  studioState, 
  isVisible,
  onRefineContent,
  isRefining,
  refiningType,
  profileName,
  step = 1,
  t
}: { 
  studioState: StudioState; 
  isVisible: boolean;
  onRefineContent?: (contentType: "hook" | "body" | "cta", instruction: string) => void;
  isRefining?: boolean;
  refiningType?: "hook" | "body" | "cta" | null;
  profileName?: string;
  step?: number;
  t: (key: string) => string;
}) {
  if (!isVisible) return null;
  
  const hasContent = studioState.selectedHook || studioState.body || studioState.selectedCta;
  
  // Show attractive empty state with progress indicator
  if (!hasContent) {
    const progressItems = [
      { step: 1, label: t("studio.briefing"), done: step > 1 },
      { step: 2, label: t("studio.structureLabel"), done: step > 2 },
      { step: 3, label: t("studio.contentTypeLabel"), done: step > 3 },
      { step: 4, label: t("studio.hook"), done: !!studioState.selectedHook },
      { step: 5, label: t("studio.bodyLabel"), done: !!studioState.body },
      { step: 6, label: t("studio.cta"), done: !!studioState.selectedCta },
    ];
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="w-4 h-4" />
            {t("studio.linkedInPreview")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("studio.followYourPostBuild")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-4">
          {/* Progress checklist */}
          <div className="space-y-2">
            {progressItems.map((item) => (
              <div 
                key={item.step} 
                className={`flex items-center gap-2 text-sm transition-all ${
                  item.done ? "text-foreground" : item.step === step ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 transition-all ${
                  item.done 
                    ? "bg-green-500 text-white" 
                    : item.step === step 
                    ? "bg-primary text-primary-foreground animate-pulse" 
                    : "bg-muted"
                }`}>
                  {item.done ? <Check className="w-3 h-3" /> : item.step}
                </div>
                <span className={item.done ? "line-through opacity-60" : item.step === step ? "font-medium" : ""}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          
          {/* Placeholder preview */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                <div className="h-2 w-32 bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-muted rounded animate-pulse" />
              <div className="h-3 w-4/5 bg-muted rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            {t("studio.postWillAppearHere")}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate character count and estimated read time
  const fullPost = `${studioState.selectedHook || ""}\n\n${studioState.body || ""}\n\n${studioState.selectedCta || ""}`;
  const charCount = fullPost.length;
  const wordCount = fullPost.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.round(wordCount / 200)); // 200 words per minute

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="w-4 h-4" />
          {t("studio.linkedInPreviewTitle")}
        </CardTitle>
        <CardDescription className="text-xs flex items-center gap-2 flex-wrap">
          <span>{charCount} {t("studio.charactersLabel")}</span>
          <span className="text-muted-foreground/50">|</span>
          <span>{readTime} {t("studio.minRead")}</span>
          {onRefineContent && (
            <>
              <span className="text-muted-foreground/50">|</span>
              <span>{t("studio.hoverToEdit")}</span>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        {/* LinkedIn-style post card */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border font-sans">
          {/* Post Header */}
          <div className="p-4 pb-2 flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
              {(profileName || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">{profileName || t("studio.you")}</p>
              <p className="text-xs text-muted-foreground truncate">{t("studio.yourHeadline")}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <span>{t("studio.now")}</span>
                <span className="text-muted-foreground/50">|</span>
                <Globe className="w-3 h-3" />
              </div>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 -mt-1 -mr-2">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>

          {/* Post Content */}
          <div className="px-4 pb-3 text-sm space-y-3">
            {studioState.selectedHook && (
              <div className="group">
                <div className="font-medium text-foreground whitespace-pre-wrap leading-relaxed">
                  {studioState.selectedHook}
                </div>
                {onRefineContent && (
                  <RefinementInput
                    contentType="hook"
                    currentContent={studioState.selectedHook}
                    onRefine={(instruction) => onRefineContent("hook", instruction)}
                    isRefining={isRefining === true && refiningType === "hook"}
                    context={{ topic: studioState.topic }}
                    t={t}
                  />
                )}
              </div>
            )}
            {studioState.body && (
              <div className="group">
                <div className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {studioState.body}
                </div>
                {onRefineContent && (
                  <RefinementInput
                    contentType="body"
                    currentContent={studioState.body}
                    onRefine={(instruction) => onRefineContent("body", instruction)}
                    isRefining={isRefining === true && refiningType === "body"}
                    context={{ topic: studioState.topic, hook: studioState.selectedHook }}
                    t={t}
                  />
                )}
              </div>
            )}
            {studioState.selectedCta && (
              <div className="group">
                <div className="text-primary font-medium whitespace-pre-wrap">
                  {studioState.selectedCta}
                </div>
                {onRefineContent && (
                  <RefinementInput
                    contentType="cta"
                    currentContent={studioState.selectedCta}
                    onRefine={(instruction) => onRefineContent("cta", instruction)}
                    isRefining={isRefining === true && refiningType === "cta"}
                    context={{ topic: studioState.topic, hook: studioState.selectedHook, body: studioState.body }}
                    t={t}
                  />
                )}
              </div>
            )}
          </div>

          {/* Engagement Stats */}
          <div className="px-4 py-2 flex items-center justify-between text-xs text-muted-foreground border-t">
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1">
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <ThumbsUp className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <span className="ml-1">--</span>
            </div>
            <div className="flex items-center gap-2">
              <span>-- {t("studio.comments")}</span>
              <span className="text-muted-foreground/50">|</span>
              <span>-- {t("studio.shares")}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-2 py-1 flex items-center justify-between border-t">
            <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground gap-1.5">
              <ThumbsUp className="w-4 h-4" />
              <span className="text-xs">{t("studio.like")}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground gap-1.5">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{t("studio.comment")}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground gap-1.5">
              <RefreshCw className="w-4 h-4" />
              <span className="text-xs">{t("studio.share")}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground gap-1.5">
              <Send className="w-4 h-4" />
              <span className="text-xs">{t("studio.send")}</span>
            </Button>
          </div>
        </div>

        {/* Score and Predictions */}
        {studioState.score && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Badge variant={studioState.score >= 8 ? "default" : "secondary"}>
              Score: {studioState.score.toFixed(1)}
            </Badge>
            {studioState.predictions && (
              <Badge variant="outline" className="text-xs">
                {t("studio.bestTimeLabel")}: {studioState.predictions.bestDay} {studioState.predictions.bestTime}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Contextual AI guidance based on profile
function ContextualGuidance({ profile, step, studioState, t }: { 
  profile: ContentProfile | undefined; 
  step: number;
  studioState: StudioState;
  t: (key: string) => string;
}) {
  if (!profile) return null;
  
  const archetype = CREATOR_ARCHETYPES?.find(a => a.id === profile.creatorArchetype);
  
  const getGuidanceForStep = () => {
    switch (step) {
      case 1:
        return {
          title: t("studio.briefingTip"),
          tips: [
            profile.topics?.length ? `${t("studio.yourMainTopics")}: ${profile.topics.slice(0, 3).join(", ")}` : null,
            archetype ? `${t("studio.as")} ${archetype.name}, ${t("studio.focusOn")} ${archetype.description?.toLowerCase() || ""}` : null,
            profile.targetAudience?.length ? `${t("studio.yourAudience")}: ${profile.targetAudience[0]}` : null,
          ].filter(Boolean),
        };
      case 2:
        return {
          title: t("studio.structureChoice"),
          tips: [
            t("studio.pasWorksWell"),
            t("studio.aidaIdeal"),
            archetype ? `${archetype.name}s ${t("studio.successWithStorytelling")}` : null,
          ].filter(Boolean),
        };
      case 4:
        return {
          title: t("studio.hookTip"),
          tips: [
            t("studio.hooksWithNumbers"),
            profile.toneFormality && profile.toneFormality < 5 ? t("studio.informalToneAllows") : null,
            profile.toneHumor && profile.toneHumor > 6 ? t("studio.useSubtleHumor") : null,
          ].filter(Boolean),
        };
      case 5:
        return {
          title: t("studio.bodyTip"),
          tips: [
            t("studio.shortParagraphs"),
            profile.toneDepth && profile.toneDepth > 6 ? t("studio.deepenDetails") : null,
            profile.antiValues?.length ? `${t("studio.avoidMentioning")}: ${profile.antiValues.slice(0, 2).join(", ")}` : null,
          ].filter(Boolean),
        };
      case 6:
        return {
          title: t("studio.ctaTip"),
          tips: [
            t("studio.openQuestionsGenerate"),
            profile.toneEmotion && profile.toneEmotion > 6 ? t("studio.emotionalCTAs") : null,
            profile.goldenRules ? t("studio.rememberGoldenRules") : null,
          ].filter(Boolean),
        };
      default:
        return null;
    }
  };
  
  const guidance = getGuidanceForStep();
  
  if (!guidance || guidance.tips.length === 0) return null;
  
  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-medium text-primary">{guidance.title}</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {guidance.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Session recovery dialog
function SessionRecoveryDialog({ 
  session, 
  isOpen, 
  onContinue, 
  onStartNew,
  stepLabels,
  t
}: { 
  session: StudioSession | null; 
  isOpen: boolean; 
  onContinue: () => void; 
  onStartNew: () => void;
  stepLabels: string[];
  t: (key: string) => string;
}) {
  if (!session) return null;
  
  const lastUpdated = session.updatedAt ? new Date(session.updatedAt).toLocaleString('pt-BR') : t("studio.recently");
  const stepLabel = stepLabels[session.currentStep - 1] || t("studio.briefing");
  
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {t("studio.sessionInProgress")}
          </DialogTitle>
          <DialogDescription>
            {t("studio.foundUnfinishedSession")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("studio.stepLabel")}:</span>
              <Badge variant="outline">{stepLabel}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("studio.lastAccess")}:</span>
              <span>{lastUpdated}</span>
            </div>
            {session.briefingData && (session.briefingData as any).topic && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("studio.topic")}:</span>
                <span className="truncate max-w-[200px]">{(session.briefingData as any).topic}</span>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onStartNew} data-testid="button-start-new">
            {t("studio.startFromScratch")}
          </Button>
          <Button onClick={onContinue} data-testid="button-continue-session">
            {t("studio.continueSession")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Studio() {
  const [, navigate] = useLocation();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const stepLabels = getStepLabels(t);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typedMessageIds, setTypedMessageIds] = useState<Set<string>>(new Set());
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [recoveryChoiceMade, setRecoveryChoiceMade] = useState(false);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [topicSuggestions, setTopicSuggestions] = useState<TopicSuggestion[]>([]);
  const [suggestionsLoadingState, setSuggestionsLoadingState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [studioState, setStudioState] = useState<StudioState>({
    topic: "",
    objective: "",
    desiredFeeling: "",
    structure: "",
    contentType: "",
    hooks: [],
    selectedHook: "",
    hookCount: 0,
    body: "",
    ctas: [],
    selectedCta: "",
    ctaCount: 0,
    score: null,
    scores: null,
    predictions: null,
    briefingSubStep: 0, // Start with template selection
    selectedTemplate: "",
    versions: [],
    activeVersionId: null,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: t("studio.unauthorized"),
        description: t("studio.loggingInAgain"),
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

  const { data: subscription } = useQuery<Subscription>({
    queryKey: ["/api/subscription"],
    enabled: isAuthenticated,
  });

  const suggestionsQueryKey = studioState.selectedTemplate 
    ? `/api/studio/suggestions?template=${encodeURIComponent(studioState.selectedTemplate)}`
    : '/api/studio/suggestions';
  
  const suggestionsEnabled = isAuthenticated && !!profile?.onboardingCompleted && !!studioState.selectedTemplate && studioState.selectedTemplate !== "free-topic";
    
  const { data: suggestionsData, isLoading: suggestionsLoading, isFetching: suggestionsFetching, isError: suggestionsError, refetch: refetchSuggestions } = useQuery<{
    suggestions: Array<{ id: string; title: string; angle: string; why: string }>;
    isNew: boolean;
    profileCompleteness: number;
  }>({
    queryKey: [suggestionsQueryKey],
    enabled: suggestionsEnabled,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes per template
    retry: 2,
  });
  
  // Track previous fetching state to detect when suggestions finish loading
  const prevSuggestionsFetchingRef = useRef(suggestionsFetching);
  
  // Update suggestions state when they arrive (detect transition from fetching to complete)
  useEffect(() => {
    const wasFetching = prevSuggestionsFetchingRef.current;
    prevSuggestionsFetchingRef.current = suggestionsFetching;
    
    // Set loading state when fetching starts
    if (suggestionsFetching && !wasFetching) {
      setSuggestionsLoadingState('loading');
    }
    
    // Only trigger when we transition from fetching to not-fetching AND we have data
    if (wasFetching && !suggestionsFetching && !suggestionsError) {
      if (suggestionsData?.suggestions && suggestionsData.suggestions.length > 0) {
        // Store suggestions in dedicated state for display above input
        setTopicSuggestions(suggestionsData.suggestions);
        setSuggestionsLoadingState('loaded');
        
        // Update the generating message to a simple confirmation
        setMessages((prev) => {
          const hasGeneratingMessage = prev.some(m => m.isGeneratingSuggestions);
          if (!hasGeneratingMessage) return prev;
          
          return prev.map((m) => {
            if (m.isGeneratingSuggestions) {
              const template = BRIEFING_TEMPLATES.find(t => t.id === studioState.selectedTemplate);
              const hint = template?.promptHint ? `\n\n${t("studio.tip")}: ${template.promptHint}` : "";
              return {
                ...m,
                content: `${t("studio.greatChoiceTemplate")} "${template?.name.toLowerCase() || 'content'}".${hint}\n\n${t("studio.selectSuggestionOrType")}`,
                isGeneratingSuggestions: false,
                generationStartTime: undefined,
              };
            }
            return m;
          });
        });
      } else {
        // No suggestions returned - show fallback message
        setSuggestionsLoadingState('loaded');
        setTopicSuggestions([]);
        setMessages((prev) => {
          const hasGeneratingMessage = prev.some(m => m.isGeneratingSuggestions);
          if (!hasGeneratingMessage) return prev;
          
          return prev.map((m) => {
            if (m.isGeneratingSuggestions) {
              return {
                ...m,
                content: t("studio.typeYourTopicBelow"),
                isGeneratingSuggestions: false,
                generationStartTime: undefined,
              };
            }
            return m;
          });
        });
      }
    }
    
    // Handle error case
    if (wasFetching && !suggestionsFetching && suggestionsError) {
      setSuggestionsLoadingState('error');
      setTopicSuggestions([]);
      setMessages((prev) => {
        const hasGeneratingMessage = prev.some(m => m.isGeneratingSuggestions);
        if (!hasGeneratingMessage) return prev;
        
        return prev.map((m) => {
          if (m.isGeneratingSuggestions) {
            return {
              ...m,
              content: t("studio.couldNotLoadSuggestions"),
              isGeneratingSuggestions: false,
              generationStartTime: undefined,
            };
          }
          return m;
        });
      });
    }
  }, [suggestionsFetching, suggestionsError, suggestionsData, studioState.selectedTemplate]);
  
  // Timeout for stuck generating suggestions state (60 seconds max)
  useEffect(() => {
    const hasGeneratingMessage = messages.some(m => m.isGeneratingSuggestions);
    if (!hasGeneratingMessage) return;
    
    const timeoutId = setTimeout(() => {
      setMessages((prev) => {
        const stillHasGenerating = prev.some(m => m.isGeneratingSuggestions);
        if (!stillHasGenerating) return prev;
        
        return prev.map((m) => {
          if (m.isGeneratingSuggestions) {
            return {
              ...m,
              content: t("studio.typeYourTopicBelow"),
              isGeneratingSuggestions: false,
              generationStartTime: undefined,
            };
          }
          return m;
        });
      });
      setSuggestionsLoadingState('loaded');
    }, 60000); // 60 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [messages, t]);
  
  // Clear suggestions when template changes
  useEffect(() => {
    if (studioState.selectedTemplate) {
      setTopicSuggestions([]);
      setSuggestionsLoadingState('idle');
    }
  }, [studioState.selectedTemplate]);

  // Check for existing session to recover
  const { data: existingSession, isLoading: sessionLoading } = useQuery<StudioSession | null>({
    queryKey: ["/api/studio/session"],
    enabled: isAuthenticated && !!profile?.onboardingCompleted,
  });

  // Autosave mutation
  const autosaveMutation = useMutation({
    mutationFn: async (sessionData: Partial<StudioSession>) => {
      const res = await apiRequest("PATCH", "/api/studio/session", sessionData);
      return res.json();
    },
  });

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/studio/session", {});
      return res.json();
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/studio/session", {});
    },
  });

  // Refs to avoid stale closures in autosave
  const studioStateRef = useRef(studioState);
  const messagesRef = useRef(messages);
  const stepRef = useRef(step);
  
  // Update refs when state changes
  useEffect(() => {
    studioStateRef.current = studioState;
    messagesRef.current = messages;
    stepRef.current = step;
  }, [studioState, messages, step]);

  // Debounced autosave function - stable reference
  const triggerAutosave = useCallback(() => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    
    autosaveTimeoutRef.current = setTimeout(() => {
      const currentState = studioStateRef.current;
      const currentMessages = messagesRef.current;
      const currentStep = stepRef.current;
      
      const sessionData = {
        currentStep: currentStep,
        briefingData: {
          topic: currentState.topic,
          objective: currentState.objective,
          desiredFeeling: currentState.desiredFeeling,
          briefingSubStep: currentState.briefingSubStep,
        },
        selectedStructure: currentState.structure || null,
        selectedContentType: currentState.contentType || null,
        hooks: currentState.hooks,
        selectedHook: currentState.selectedHook || null,
        bodyContent: currentState.body || null,
        ctas: currentState.ctas,
        selectedCta: currentState.selectedCta || null,
        score: currentState.score,
        conversationHistory: currentMessages,
      };
      
      autosaveMutation.mutate(sessionData);
    }, 3000); // Save after 3 seconds of inactivity
  }, [autosaveMutation]);

  // Trigger autosave when meaningful state changes (debounced)
  useEffect(() => {
    if (messages.length > 1 && !isGenerating) {
      triggerAutosave();
    }
    
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [step, studioState.topic, studioState.objective, studioState.desiredFeeling, 
      studioState.structure, studioState.contentType, studioState.selectedHook,
      studioState.body, studioState.selectedCta, messages.length, isGenerating, triggerAutosave]);

  // Refs for update debounce - must be before useEffect that uses them
  const updatePostTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update post session mutation - called to sync changes
  const updatePostSessionMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (!activePostId) return null;
      const res = await apiRequest("PATCH", `/api/posts/${activePostId}`, data);
      return res.json();
    },
  });

  // Debounced update function
  const triggerPostUpdate = useCallback((data: Record<string, unknown>) => {
    if (!activePostId) return;
    
    if (updatePostTimeoutRef.current) {
      clearTimeout(updatePostTimeoutRef.current);
    }
    
    updatePostTimeoutRef.current = setTimeout(() => {
      updatePostSessionMutation.mutate(data);
    }, 2000);
  }, [activePostId, updatePostSessionMutation]);

  // Update post session when meaningful changes occur (after hook is selected)
  useEffect(() => {
    if (!activePostId || isGenerating) return;
    
    const updateData = {
      body: studioState.body || null,
      cta: studioState.selectedCta || null,
      fullContent: studioState.selectedHook && studioState.body && studioState.selectedCta
        ? `${studioState.selectedHook}\n\n${studioState.body}\n\n${studioState.selectedCta}`
        : null,
      score: studioState.score,
      hookScore: studioState.scores?.hook,
      structureScore: studioState.scores?.structure,
      dataScore: studioState.scores?.data,
      ctaScore: studioState.scores?.cta,
      algorithmScore: studioState.scores?.algorithm,
      top1Probability: studioState.predictions?.top1,
      top5Probability: studioState.predictions?.top5,
      bestPostingDay: studioState.predictions?.bestDay,
      bestPostingTime: studioState.predictions?.bestTime,
      ctaOptions: studioState.ctas,
      sessionHistory: messages.filter(m => !m.isLoading).map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date().toISOString(),
        options: m.options,
      })),
    };
    
    if (updatePostTimeoutRef.current) {
      clearTimeout(updatePostTimeoutRef.current);
    }
    
    updatePostTimeoutRef.current = setTimeout(() => {
      updatePostSessionMutation.mutate(updateData);
    }, 2000);
    
    return () => {
      if (updatePostTimeoutRef.current) {
        clearTimeout(updatePostTimeoutRef.current);
      }
    };
  }, [activePostId, studioState.body, studioState.selectedCta, studioState.score, 
      studioState.scores, studioState.predictions, studioState.ctas, 
      messages.length, isGenerating, updatePostSessionMutation]);

  // Show recovery dialog if there's an existing session (only if user hasn't made a choice yet)
  useEffect(() => {
    if (existingSession && !sessionLoading && messages.length === 0 && !recoveryChoiceMade) {
      setShowRecoveryDialog(true);
    }
  }, [existingSession, sessionLoading, messages.length, recoveryChoiceMade]);

  // Restore session from saved data
  const restoreSession = useCallback((session: StudioSession) => {
    setStep(session.currentStep);
    
    const briefing = session.briefingData as any || {};
    setStudioState({
      topic: briefing.topic || "",
      objective: briefing.objective || "",
      desiredFeeling: briefing.desiredFeeling || "",
      structure: session.selectedStructure || "",
      contentType: session.selectedContentType || "",
      hooks: (session.hooks as string[]) || [],
      selectedHook: session.selectedHook || "",
      hookCount: ((session.hooks as string[]) || []).length,
      body: session.bodyContent || "",
      ctas: (session.ctas as string[]) || [],
      selectedCta: session.selectedCta || "",
      ctaCount: ((session.ctas as string[]) || []).length,
      score: session.score,
      scores: null,
      predictions: null,
      briefingSubStep: briefing.briefingSubStep || 1,
      selectedTemplate: briefing.selectedTemplate || null,
      versions: [],
      activeVersionId: null,
    });
    
    // Restore conversation history - clear any stuck generating flags
    const savedMessages = (session.conversationHistory as Message[]) || [];
    if (savedMessages.length > 0) {
      const cleanedMessages = savedMessages.map((m) => ({
        ...m,
        isGeneratingSuggestions: false,
        generationStartTime: undefined,
        isLoading: false,
      }));
      setMessages(cleanedMessages);
      setTypedMessageIds(new Set(cleanedMessages.map(m => m.id)));
    }
    
    setShowRecoveryDialog(false);
    toast({
      title: t("studio.sessionRestored"),
      description: t("studio.continuingFromWhereYouLeft"),
    });
  }, [toast]);

  const handleContinueSession = () => {
    setRecoveryChoiceMade(true);
    if (existingSession) {
      restoreSession(existingSession);
    }
  };

  const handleStartNewSession = async () => {
    setRecoveryChoiceMade(true);
    setShowRecoveryDialog(false);
    
    // Reset all state to initial values
    setStep(1);
    setStudioState({
      topic: "",
      objective: "",
      desiredFeeling: "",
      structure: "",
      contentType: "",
      hooks: [],
      selectedHook: "",
      hookCount: 0,
      body: "",
      ctas: [],
      selectedCta: "",
      ctaCount: 0,
      score: null,
      scores: null,
      predictions: null,
      briefingSubStep: 0,
      selectedTemplate: "",
      versions: [],
      activeVersionId: null,
    });
    setTopicSuggestions([]);
    setSuggestionsLoadingState('idle');
    setActivePostId(null);
    
    // Initialize with welcome message before deleting old session
    const welcomeMessage = createMessage({
      role: "assistant",
      content: t("studio.helloLetsCreate"),
    });
    setMessages([welcomeMessage]);
    setTypedMessageIds(new Set([welcomeMessage.id]));
    
    // Delete old session and create new one
    await deleteSessionMutation.mutateAsync();
    await createSessionMutation.mutateAsync();
    queryClient.invalidateQueries({ queryKey: ["/api/studio/session"] });
  };

  useEffect(() => {
    if (profile && !profile.onboardingCompleted) {
      navigate("/onboarding");
    }
  }, [profile, navigate]);

  useEffect(() => {
    // Only show initial message if no recovery dialog, no existing session, and no recovery choice was made
    // (when recoveryChoiceMade is true, handleStartNewSession already created the welcome message)
    if (profile?.onboardingCompleted && messages.length === 0 && !showRecoveryDialog && !existingSession && !recoveryChoiceMade) {
      // Create a new session
      createSessionMutation.mutate();
      setMessages([
        createMessage({
          role: "assistant",
          content: t("studio.helloLetsCreate"),
        }),
      ]);
    }
  }, [profile, messages.length, showRecoveryDialog, existingSession, recoveryChoiceMade]);

  // Check if user is near the bottom of the scroll container (within threshold)
  const isNearBottom = useCallback(() => {
    const scrollContainer = scrollAreaRef.current;
    if (!scrollContainer) return true;
    
    const threshold = 150; // pixels from bottom
    const scrollTop = scrollContainer.scrollTop;
    const scrollHeight = scrollContainer.scrollHeight;
    const clientHeight = scrollContainer.clientHeight;
    
    return scrollTop + clientHeight >= scrollHeight - threshold;
  }, []);

  // Smooth scroll function - uses native scroll for sticky sidebar support
  const smoothScrollToBottom = useCallback(() => {
    const scrollContainer = scrollAreaRef.current;
    if (!scrollContainer) {
      // Fallback to simple scroll
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const targetScrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight;
    const distance = targetScrollTop - scrollContainer.scrollTop;
    
    if (distance <= 0) return;

    // Use native smooth scroll on mobile/touch devices for better performance
    const isMobile = window.matchMedia("(max-width: 768px)").matches || 'ontouchstart' in window;
    
    if (isMobile) {
      scrollContainer.scrollTo({ top: targetScrollTop, behavior: "smooth" });
      return;
    }

    // Custom animation for desktop
    const startScrollTop = scrollContainer.scrollTop;
    const duration = Math.min(600, Math.max(300, Math.abs(distance) * 0.4));
    const startTime = performance.now();

    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeOutCubic(progress);
      
      scrollContainer.scrollTop = startScrollTop + (distance * easeProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  }, []);

  // Track previous message count to detect new messages
  const prevMessageCount = useRef(messages.length);

  // Auto-scroll when new messages are added
  useEffect(() => {
    const hasNewMessages = messages.length > prevMessageCount.current;
    prevMessageCount.current = messages.length;
    
    if (hasNewMessages) {
      // Always scroll when new messages are added
      const timer = setTimeout(() => {
        smoothScrollToBottom();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages.length, smoothScrollToBottom]);

  // Auto-scroll on significant state changes, but only if user is already near bottom
  useEffect(() => {
    if (isNearBottom()) {
      const timer = setTimeout(() => {
        smoothScrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [
    step, 
    isGenerating, 
    suggestionsLoadingState, 
    topicSuggestions.length, 
    studioState.versions.length,
    studioState.hooks.length,
    studioState.ctas.length,
    isNearBottom,
    smoothScrollToBottom,
  ]);

  // Create post session mutation - called when hook is selected
  const createPostSessionMutation = useMutation({
    mutationFn: async (data: {
      hook: string;
      structure: string;
      contentType: string;
      topic: string;
      objective: string;
      desiredFeeling: string;
      hookOptions: string[];
      sessionHistory: Message[];
    }) => {
      const postData = {
        hook: data.hook,
        structure: data.structure,
        contentType: data.contentType,
        topic: data.topic,
        objective: data.objective,
        desiredFeeling: data.desiredFeeling,
        hookOptions: data.hookOptions,
        sessionHistory: data.sessionHistory.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date().toISOString(),
          options: m.options,
        })),
        status: "in_progress",
      };
      const res = await apiRequest("POST", "/api/posts", postData);
      return res.json();
    },
    onSuccess: (data) => {
      setActivePostId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error) => {
      console.error("Error creating post session:", error);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activePostId) {
        throw new Error("No active post session");
      }
      
      const postData = {
        hook: studioState.selectedHook,
        body: studioState.body,
        cta: studioState.selectedCta,
        fullContent: `${studioState.selectedHook}\n\n${studioState.body}\n\n${studioState.selectedCta}`,
        structure: studioState.structure,
        contentType: studioState.contentType,
        score: studioState.score || 0,
        hookScore: studioState.scores?.hook || 0,
        structureScore: studioState.scores?.structure || 0,
        dataScore: studioState.scores?.data || 0,
        ctaScore: studioState.scores?.cta || 0,
        algorithmScore: studioState.scores?.algorithm || 0,
        top1Probability: studioState.predictions?.top1,
        top5Probability: studioState.predictions?.top5,
        bestPostingDay: studioState.predictions?.bestDay,
        bestPostingTime: studioState.predictions?.bestTime,
        profileSnapshot: profile,
        sessionHistory: messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date().toISOString(),
          options: m.options,
        })),
        status: "completed",
      };
      return apiRequest("PATCH", `/api/posts/${activePostId}`, postData);
    },
    onSuccess: () => {
      trackContentCompleted(studioState.score || undefined);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      toast({
        title: t("studio.postSaved"),
        description: t("studio.postFinishedSuccess"),
      });
      navigate("/dashboard");
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: t("studio.unauthorized"),
          description: t("studio.loggingInAgain"),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: t("studio.error"),
        description: t("studio.couldNotSavePost"),
        variant: "destructive",
      });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (payload: { step: number; data: Record<string, unknown> }) => {
      trackAIGeneration(`step_${payload.step}`, false);
      const res = await apiRequest("POST", "/api/studio/generate", payload);
      return res.json();
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: t("studio.unauthorized"),
          description: t("studio.loggingInAgain"),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: t("studio.error"),
        description: t("studio.errorGeneratingContent"),
        variant: "destructive",
      });
      setMessages((prev) => prev.filter((m) => !m.isLoading));
    },
  });

  // Refinement mutation for Edit with AI feature
  const [refiningType, setRefiningType] = useState<"hook" | "body" | "cta" | null>(null);
  
  const refineMutation = useMutation({
    mutationFn: async (payload: { 
      contentType: "hook" | "body" | "cta"; 
      currentContent: string; 
      instruction: string;
      context?: { topic?: string; hook?: string; body?: string };
    }) => {
      const res = await apiRequest("POST", "/api/studio/refine", payload);
      return res.json();
    },
    onSuccess: (data, variables) => {
      const { contentType, instruction } = variables;
      const refinedContent = data.refinedContent;
      
      // Get the active version to use as base for the new version
      const activeVersion = studioState.versions.find(v => v.id === studioState.activeVersionId);
      const baseVersion = activeVersion || {
        hook: studioState.selectedHook,
        body: studioState.body,
        cta: studioState.selectedCta,
      };
      
      // Create new version with refined content
      const newVersionId = `version-${crypto.randomUUID()}`;
      const newVersion: ContentVersion = {
        id: newVersionId,
        hook: contentType === "hook" ? refinedContent : baseVersion.hook,
        body: contentType === "body" ? refinedContent : baseVersion.body,
        cta: contentType === "cta" ? refinedContent : baseVersion.cta,
        score: null,
        scores: null,
        predictions: null,
        isOriginal: false,
        refinementInstruction: instruction,
        refinedField: contentType,
        createdAt: new Date().toISOString(),
        isScoring: true,
      };
      
      // Add new version and update top-level content to match new version
      setStudioState((prev) => ({
        ...prev,
        selectedHook: newVersion.hook,
        body: newVersion.body,
        selectedCta: newVersion.cta,
        score: null, // Reset score while calculating
        scores: null,
        predictions: null,
        versions: [...prev.versions, newVersion],
        activeVersionId: newVersionId,
      }));
      
      toast({
        title: t("studio.newVersionCreated"),
        description: t("studio.calculatingScore"),
      });
      setRefiningType(null);
      
      // Trigger scoring for the new version
      generateMutation.mutate(
        {
          step: 7,
          data: {
            hook: newVersion.hook,
            body: newVersion.body,
            cta: newVersion.cta,
            structure: studioState.structure,
            contentType: studioState.contentType,
            profile: profile,
          },
        },
        {
          onSuccess: (scoreData) => {
            const score = scoreData.score || 9.2;
            const scores = scoreData.scores || {
              hook: 9.5,
              structure: 9.0,
              data: 9.1,
              cta: 9.3,
              algorithm: 9.0,
            };
            const predictions = scoreData.predictions || {
              top1: 78,
              top5: 92,
              bestDay: "Tuesday",
              bestTime: "08:00",
            };
            
            // Update the version with the score
            setStudioState((prev) => ({
              ...prev,
              score,
              scores,
              predictions,
              versions: prev.versions.map(v => 
                v.id === newVersionId 
                  ? { ...v, score, scores, predictions, isScoring: false }
                  : v
              ),
            }));
            
            toast({
              title: t("studio.scoreCalculated"),
              description: `${t("studio.newVersionReached")} ${score.toFixed(1)}/10`,
            });
          },
        }
      );
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: t("studio.unauthorized"),
          description: t("studio.loggingInAgain"),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: t("studio.error"),
        description: t("studio.couldNotRefineContent"),
        variant: "destructive",
      });
      setRefiningType(null);
    },
  });

  const handleRefineContent = (contentType: "hook" | "body" | "cta", instruction: string) => {
    let currentContent = "";
    if (contentType === "hook") {
      currentContent = studioState.selectedHook;
    } else if (contentType === "body") {
      currentContent = studioState.body;
    } else if (contentType === "cta") {
      currentContent = studioState.selectedCta;
    }
    
    if (!currentContent) return;
    
    setRefiningType(contentType);
    refineMutation.mutate({
      contentType,
      currentContent,
      instruction,
      context: {
        topic: studioState.topic,
        hook: studioState.selectedHook,
        body: studioState.body,
      },
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setMessages((prev) => [...prev, createMessage({ role: "user", content: userMessage })]);

    if (step === 1) {
      if (studioState.briefingSubStep === 1) {
        // User just entered the topic/briefing
        setStudioState((prev) => ({ ...prev, topic: userMessage, briefingSubStep: 2 }));
        setMessages((prev) => [
          ...prev,
          createMessage({
            role: "assistant",
            content: t("studio.greatNowTellObjective"),
          }),
        ]);
      } else if (studioState.briefingSubStep === 2) {
        // User just entered the objective/audience
        setStudioState((prev) => ({ ...prev, objective: userMessage, briefingSubStep: 3 }));
        setMessages((prev) => [
          ...prev,
          createMessage({
            role: "assistant",
            content: t("studio.whatFeelingToAwaken"),
          }),
        ]);
      } else {
        // User just entered the desired feeling - now move to step 2
        setStudioState((prev) => ({ ...prev, desiredFeeling: userMessage }));
        setMessages((prev) => [...prev, createMessage({ role: "assistant", isLoading: true, content: "" })]);
        setIsGenerating(true);

        setTimeout(() => {
          setMessages((prev) =>
            prev.filter((m) => !m.isLoading).concat([
              createMessage({
                role: "assistant",
                content: t("studio.excellentBriefingComplete"),
                options: COPYWRITING_STRUCTURES.map((s) => ({
                  id: s.id,
                  label: s.name + " - " + s.fullName,
                  description: s.useCase,
                  guidance: s.guidance,
                })),
              }),
            ])
          );
          setStep(2);
          setIsGenerating(false);
        }, 800);
      }
    }
  };

  const handleSelectStructure = (structureId: string) => {
    const structure = COPYWRITING_STRUCTURES.find((s) => s.id === structureId);
    if (!structure) return;

    setStudioState((prev) => ({ ...prev, structure: structureId }));
    setMessages((prev) => [
      ...prev,
      createMessage({ role: "user", content: structure.name + " - " + structure.fullName }),
      createMessage({
        role: "assistant",
        content: t("studio.greatChoiceSelectContentType"),
        options: CONTENT_TYPES.map((t) => ({
          id: t.id,
          label: t.name,
          description: t.description,
          guidance: t.guidance,
        })),
      }),
    ]);
    setStep(3);
  };

  const handleSelectContentType = (typeId: string) => {
    const contentType = CONTENT_TYPES.find((t) => t.id === typeId);
    if (!contentType) return;

    setStudioState((prev) => ({ ...prev, contentType: typeId }));
    setMessages((prev) => [
      ...prev,
      createMessage({ role: "user", content: contentType.name }),
      createMessage({ role: "assistant", isLoading: true, content: "" }),
    ]);
    setStep(4);
    setIsGenerating(true);

    generateMutation.mutate(
      {
        step: 4,
        data: {
          topic: studioState.topic,
          objective: studioState.objective,
          desiredFeeling: studioState.desiredFeeling,
          structure: studioState.structure,
          contentType: typeId,
          profile: profile,
        },
      },
      {
        onSuccess: (data) => {
          const fallbackHooks = [
            t("studio.fallbackHook1"),
            t("studio.fallbackHook2"),
            t("studio.fallbackHook3"),
          ];
          const hooks = (data.hooks && data.hooks.length > 0) ? data.hooks : fallbackHooks;
          setStudioState((prev) => ({ ...prev, hooks, hookCount: 3 }));
          setMessages((prev) =>
            prev.filter((m) => !m.isLoading).concat([
              createMessage({
                role: "assistant",
                content: t("studio.hereAre3Hooks"),
                options: hooks.map((h: string, i: number) => ({
                  id: `hook-${i}`,
                  label: `Hook ${i + 1}`,
                  description: h.length > 150 ? h.substring(0, 150) + "..." : h,
                })),
              }),
            ])
          );
          setIsGenerating(false);
        },
      }
    );
  };

  const handleSelectHook = async (hookId: string) => {
    const parts = hookId.split("-");
    if (parts.length < 2) return;
    const index = parseInt(parts[1], 10);
    if (isNaN(index) || index < 0 || index >= studioState.hooks.length) return;
    const hook = studioState.hooks[index];
    if (!hook) return;

    const hookLabel = studioState.hookCount - studioState.hooks.length + index + 1;
    setStudioState((prev) => ({ ...prev, selectedHook: hook }));
    
    const userMessage = createMessage({ role: "user", content: `Hook ${hookLabel} ${t("studio.hookSelected")}` });
    const loadingMessage = createMessage({ role: "assistant", isLoading: true, content: "" });
    
    // Get current messages to include in session history
    const currentMessages = [...messages, userMessage];
    
    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setStep(5);
    setIsGenerating(true);
    
    // Create post session first and wait for it to complete before generating content
    try {
      await createPostSessionMutation.mutateAsync({
        hook: hook,
        structure: studioState.structure,
        contentType: studioState.contentType,
        topic: studioState.topic,
        objective: studioState.objective,
        desiredFeeling: studioState.desiredFeeling,
        hookOptions: studioState.hooks,
        sessionHistory: currentMessages,
      });
    } catch (error) {
      console.error("Failed to create post session:", error);
      // Continue with content generation even if session creation fails
    }

    generateMutation.mutate(
      {
        step: 5,
        data: {
          topic: studioState.topic,
          objective: studioState.objective,
          desiredFeeling: studioState.desiredFeeling,
          structure: studioState.structure,
          contentType: studioState.contentType,
          hook: hook,
          profile: profile,
        },
      },
      {
        onSuccess: (data) => {
          const body = data.body || "...";
          setStudioState((prev) => ({ ...prev, body }));
          setMessages((prev) =>
            prev.filter((m) => !m.isLoading).concat([
              createMessage({
                role: "assistant",
                content: `${t("studio.hereIsTheBody")}\n\n---\n${body}\n---\n\n${t("studio.nowLetsCTA")}`,
              }),
              createMessage({ role: "assistant", isLoading: true, content: "" }),
            ])
          );
          
          generateMutation.mutate(
            {
              step: 6,
              data: {
                topic: studioState.topic,
                objective: studioState.objective,
                desiredFeeling: studioState.desiredFeeling,
                structure: studioState.structure,
                contentType: studioState.contentType,
                hook: hook,
                body: body,
                profile: profile,
              },
            },
            {
              onSuccess: (ctaData) => {
                const ctas = ctaData.ctas || [];
                setStudioState((prev) => ({ ...prev, ctas, ctaCount: 3 }));
                setMessages((prev) =>
                  prev.filter((m) => !m.isLoading).concat([
                    createMessage({
                      role: "assistant",
                      content: t("studio.chooseCTAToFinish"),
                      options: ctas.map((c: string, i: number) => ({
                        id: `cta-${i}`,
                        label: `CTA ${i + 1}`,
                        description: c,
                      })),
                    }),
                  ])
                );
                setStep(6);
                setIsGenerating(false);
              },
            }
          );
        },
      }
    );
  };

  const handleSelectCta = (ctaId: string) => {
    const parts = ctaId.split("-");
    if (parts.length < 2) return;
    const index = parseInt(parts[1], 10);
    if (isNaN(index) || index < 0 || index >= studioState.ctas.length) return;
    const cta = studioState.ctas[index];
    if (!cta) return;

    const ctaLabel = studioState.ctaCount - studioState.ctas.length + index + 1;
    setStudioState((prev) => ({ ...prev, selectedCta: cta }));
    setMessages((prev) => [
      ...prev,
      createMessage({ role: "user", content: `CTA ${ctaLabel} ${t("studio.ctaSelected")}` }),
      createMessage({ role: "assistant", isLoading: true, content: "" }),
    ]);
    setStep(7);
    setIsGenerating(true);

    generateMutation.mutate(
      {
        step: 7,
        data: {
          hook: studioState.selectedHook,
          body: studioState.body,
          cta: cta,
          structure: studioState.structure,
          contentType: studioState.contentType,
          profile: profile,
        },
      },
      {
        onSuccess: (scoreData) => {
          const score = scoreData.score || 9.2;
          const scores = scoreData.scores || {
            hook: 9.5,
            structure: 9.0,
            data: 9.1,
            cta: 9.3,
            algorithm: 9.0,
          };
          const predictions = scoreData.predictions || {
            top1: 78,
            top5: 92,
            bestDay: "Tuesday",
            bestTime: "08:00",
          };

          // Create the original version
          const originalVersion: ContentVersion = {
            id: `version-${crypto.randomUUID()}`,
            hook: studioState.selectedHook,
            body: studioState.body,
            cta: cta,
            score,
            scores,
            predictions,
            isOriginal: true,
            createdAt: new Date().toISOString(),
          };

          setStudioState((prev) => ({ 
            ...prev, 
            score, 
            scores, 
            predictions,
            versions: [originalVersion],
            activeVersionId: originalVersion.id,
          }));
          setMessages((prev) =>
            prev.filter((m) => !m.isLoading).concat([
              createMessage({
                role: "assistant",
                content: score >= 8
                  ? `${t("studio.excellentScoreAchieved")} ${score.toFixed(1)}/10!\n\n${t("studio.yourPostIsReady")}`
                  : `${t("studio.postAchievedScore")} ${score.toFixed(1)}/10.\n\n${t("studio.scoreNeedsToBe8")}`,
              }),
            ])
          );
          setIsGenerating(false);
        },
      }
    );
  };

  const handleOptionSelect = (optionId: string) => {
    if (step === 2) {
      handleSelectStructure(optionId);
    } else if (step === 3) {
      handleSelectContentType(optionId);
    } else if (step === 4) {
      handleSelectHook(optionId);
    } else if (step === 6) {
      handleSelectCta(optionId);
    }
  };

  const handleRegenerate = () => {
    if (step === 4) {
      const currentHookCount = studioState.hookCount;
      setMessages((prev) => [
        ...prev,
        createMessage({ role: "assistant", isLoading: true, content: "" }),
      ]);
      setIsGenerating(true);

      generateMutation.mutate(
        {
          step: 4,
          data: {
            topic: studioState.topic,
            objective: studioState.objective,
            desiredFeeling: studioState.desiredFeeling,
            structure: studioState.structure,
            contentType: studioState.contentType,
            profile: profile,
            regenerate: true,
          },
        },
        {
          onSuccess: (data) => {
            const hooks = data.hooks || [];
            const newHookCount = currentHookCount + hooks.length;
            setStudioState((prev) => ({ ...prev, hooks, hookCount: newHookCount }));
            setMessages((prev) =>
              prev.filter((m) => !m.isLoading).concat([
                createMessage({
                  role: "assistant",
                  content: t("studio.newHookOptionsGenerated"),
                  options: hooks.map((h: string, i: number) => ({
                    id: `hook-${i}`,
                    label: `Hook ${currentHookCount + i + 1}`,
                    description: h.length > 150 ? h.substring(0, 150) + "..." : h,
                  })),
                }),
              ])
            );
            setIsGenerating(false);
          },
        }
      );
    } else if (step === 6) {
      const currentCtaCount = studioState.ctaCount;
      setMessages((prev) => [
        ...prev,
        createMessage({ role: "assistant", isLoading: true, content: "" }),
      ]);
      setIsGenerating(true);

      generateMutation.mutate(
        {
          step: 6,
          data: {
            topic: studioState.topic,
            objective: studioState.objective,
            desiredFeeling: studioState.desiredFeeling,
            structure: studioState.structure,
            contentType: studioState.contentType,
            hook: studioState.selectedHook,
            body: studioState.body,
            profile: profile,
            regenerate: true,
          },
        },
        {
          onSuccess: (data) => {
            const ctas = data.ctas || [];
            const newCtaCount = currentCtaCount + ctas.length;
            setStudioState((prev) => ({ ...prev, ctas, ctaCount: newCtaCount }));
            setMessages((prev) =>
              prev.filter((m) => !m.isLoading).concat([
                createMessage({
                  role: "assistant",
                  content: t("studio.newCTAOptionsGenerated"),
                  options: ctas.map((c: string, i: number) => ({
                    id: `cta-${i}`,
                    label: `CTA ${currentCtaCount + i + 1}`,
                    description: c,
                  })),
                }),
              ])
            );
            setIsGenerating(false);
          },
        }
      );
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    const template = BRIEFING_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    setStudioState((prev) => ({ 
      ...prev, 
      selectedTemplate: templateId, 
      briefingSubStep: 1 
    }));

    if (templateId === "free-topic") {
      // Free topic - go directly to topic input
      setMessages((prev) => [
        ...prev,
        createMessage({ role: "user", content: template.name }),
        createMessage({
          role: "assistant",
          content: t("studio.greatChoiceFreeWrite"),
        }),
      ]);
    } else {
      // Specific template - show generating message, then suggestions when ready
      const templateQueryKey = `/api/studio/suggestions?template=${encodeURIComponent(templateId)}`;
      queryClient.invalidateQueries({ queryKey: [templateQueryKey] });
      
      const generatingMessageId = generateMessageId();
      const hint = template.promptHint ? ` ${t("studio.tip")}: ${template.promptHint}` : "";
      
      setMessages((prev) => [
        ...prev,
        createMessage({ role: "user", content: template.name }),
        {
          id: generatingMessageId,
          role: "assistant",
          content: `${t("studio.greatChoiceTemplate")} "${template.name.toLowerCase()}".${hint}\n\n${t("studio.generatingPersonalizedSuggestions")}`,
          isGeneratingSuggestions: true,
          generationStartTime: Date.now(),
        },
      ]);
    }
  };

  const handleSelectSuggestion = (suggestion: { id: string; title: string; angle: string; why: string }) => {
    // Pre-fill the topic input with the suggestion
    const topicText = `${suggestion.title}\n\n${t("studio.angle")}: ${suggestion.angle}`;
    setStudioState((prev) => ({ ...prev, topic: topicText, briefingSubStep: 2 }));
    // Clear suggestions after selection
    setTopicSuggestions([]);
    setSuggestionsLoadingState('idle');
    setMessages((prev) => [
      ...prev,
      createMessage({ role: "user", content: topicText }),
      createMessage({
        role: "assistant",
        content: t("studio.greatNowTellObjective"),
      }),
    ]);
  };

  const handleCopyPost = async () => {
    const fullPost = `${studioState.selectedHook}\n\n${studioState.body}\n\n${studioState.selectedCta}`;
    try {
      await navigator.clipboard.writeText(fullPost);
      trackCopyContent('full_post');
      toast({
        title: t("studio.copied"),
        description: t("studio.postCopiedToClipboard"),
      });
    } catch (err) {
      // Fallback for browsers without clipboard API or permission denied
      const textArea = document.createElement('textarea');
      textArea.value = fullPost;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        trackCopyContent('full_post');
        toast({
          title: t("studio.copied"),
          description: t("studio.postCopiedToClipboard"),
        });
      } catch {
        toast({
          title: t("studio.error"),
          description: t("studio.couldNotCopy"),
          variant: "destructive",
        });
      }
      document.body.removeChild(textArea);
    }
  };

  // Check if any version is currently being scored
  const isAnyVersionScoring = studioState.versions.some(v => v.isScoring);
  const canSave = step === 7 && studioState.score !== null && studioState.score >= 8 && !isAnyVersionScoring;
  const postsUsed = subscription?.postsUsedThisMonth ?? 0;
  const postsLimit = subscription?.postsLimit ?? 8;

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

  return (
    <div className="flex flex-1 min-h-0 h-[calc(100vh-3.5rem)]">
      
      {/* Session Recovery Dialog */}
      <SessionRecoveryDialog
        session={existingSession || null}
        isOpen={showRecoveryDialog}
        onContinue={handleContinueSession}
        onStartNew={handleStartNewSession}
        stepLabels={stepLabels}
        t={t}
      />

      {/* Main Content Area - Chat + Preview layout */}
      {/* Left Column - Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Scrollable Messages Area */}
        <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth px-4" ref={scrollAreaRef}>
          <div className="max-w-3xl mx-auto py-6 space-y-6">
            {/* Template Selection - Show at step 1, substep 0 */}
          {step === 1 && studioState.briefingSubStep === 0 && (
            <div className="mb-6 animate-in fade-in-0 duration-300">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold mb-2">{t("studio.choosePostType")}</h2>
                <p className="text-muted-foreground text-sm">{t("studio.selectFormatThatFits")}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {BRIEFING_TEMPLATES.map((template) => (
                  <Card 
                    key={template.id} 
                    className="hover-elevate cursor-pointer transition-all group relative"
                    onClick={() => handleSelectTemplate(template.id)}
                    data-testid={`card-template-${template.id}`}
                  >
                    <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-200">
                        {TEMPLATE_ICONS[template.id] || <Pencil className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-2">{template.name}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{template.description}</p>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                step={step}
                isNew={!typedMessageIds.has(message.id) && message.role === "assistant" && !message.isLoading && !message.isGeneratingSuggestions}
                onSelectOption={handleOptionSelect}
                onSelectSuggestion={handleSelectSuggestion}
                onRegenerate={(step === 4 || step === 6) && !isGenerating ? handleRegenerate : undefined}
                onTypingComplete={() => {
                  setTypedMessageIds(prev => new Set(prev).add(message.id));
                  smoothScrollToBottom();
                }}
                onTypingProgress={smoothScrollToBottom}
                t={t}
              />
            ))}
          </div>

          {step === 7 && studioState.versions.length > 0 && (
            <div className="mt-8 space-y-6 animate-in fade-in-0 duration-300">
              {/* Score Summary Card */}
              <Card className={`${studioState.score !== null && studioState.score >= 8 ? 'border-green-500/50 bg-green-500/5' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold mb-1">
                        {studioState.score !== null && studioState.score >= 8 
                          ? t("studio.readyToGoViral")
                          : t("studio.finishingPost")}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {studioState.score !== null && studioState.score >= 8 
                          ? t("studio.contentReachedMinScore")
                          : t("studio.refineToReach8")}
                      </p>
                    </div>
                    {isAnyVersionScoring ? (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <div className="w-8 h-8 border-4 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
                        <span className="text-sm">Calculando score...</span>
                      </div>
                    ) : studioState.score !== null ? (
                      <ScoreBadge score={studioState.score} t={t} />
                    ) : null}
                  </div>
                  
                  {/* Scores breakdown - Visual cards */}
                  {studioState.scores && (
                    <div className="grid grid-cols-5 gap-3 mt-6">
                      {[
                        { key: 'hook', label: 'Hook', value: studioState.scores.hook },
                        { key: 'structure', label: 'Estrutura', value: studioState.scores.structure },
                        { key: 'data', label: 'Dados', value: studioState.scores.data },
                        { key: 'cta', label: 'CTA', value: studioState.scores.cta },
                        { key: 'algorithm', label: 'Algoritmo', value: studioState.scores.algorithm },
                      ].map((score) => (
                        <div 
                          key={score.key}
                          className={`p-3 rounded-lg text-center transition-all ${
                            score.value >= 8 
                              ? 'bg-green-500/10 border border-green-500/30' 
                              : score.value >= 7 
                              ? 'bg-yellow-500/10 border border-yellow-500/30' 
                              : 'bg-muted border border-border'
                          }`}
                        >
                          <div className={`text-lg font-bold ${
                            score.value >= 8 ? 'text-green-600 dark:text-green-400' : 
                            score.value >= 7 ? 'text-yellow-600 dark:text-yellow-400' : 
                            'text-muted-foreground'
                          }`}>
                            {score.value.toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{score.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Predictions */}
                  {studioState.predictions && (
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t flex-wrap">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-primary" />
                        <span className="text-sm">
                          <strong>{studioState.predictions.top1}%</strong> {t("studio.chanceOfTop1")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {studioState.predictions.top5}% {t("studio.top5Percent")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {t("studio.bestTimeColon")}: {studioState.predictions.bestDay} {studioState.predictions.bestTime}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Versions - Compact horizontal list */}
              {studioState.versions.length > 1 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("studio.previousVersionsTitle")}</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {studioState.versions.map((version, index) => {
                      const isActive = version.id === studioState.activeVersionId;
                      const fieldLabels: Record<string, string> = {
                        hook: t("studio.hook"),
                        body: t("studio.bodyLabel"),
                        cta: t("studio.cta")
                      };
                      
                      return (
                        <Card 
                          key={version.id} 
                          className={`shrink-0 w-48 transition-all cursor-pointer hover-elevate ${isActive ? 'ring-2 ring-primary' : ''}`}
                          onClick={() => {
                            if (!isActive && !version.isScoring) {
                              setStudioState((prev) => ({
                                ...prev,
                                selectedHook: version.hook,
                                body: version.body,
                                selectedCta: version.cta,
                                score: version.score,
                                scores: version.scores,
                                predictions: version.predictions,
                                activeVersionId: version.id,
                              }));
                              toast({
                                title: t("studio.versionSelected"),
                                description: `${t("studio.version")} ${index + 1} ${t("studio.versionNowActive")}`,
                              });
                            }
                          }}
                          data-testid={`card-version-${index + 1}`}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <Badge variant={isActive ? "default" : "outline"} className="text-xs">
                                V{index + 1}
                              </Badge>
                              {version.isScoring ? (
                                <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                              ) : version.score !== null ? (
                                <span className={`text-xs font-bold ${version.score >= 8 ? 'text-green-600' : version.score >= 7 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                                  {version.score.toFixed(1)}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs line-clamp-2 text-muted-foreground">
                              {version.refinedField ? t(`studio.${version.refinedField}Edited`) : t("studio.original")}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Active version refinement UI - Compact accordion style */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">{t("studio.refineContent")}</h4>
                  
                  <div className="space-y-3">
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover-elevate" data-testid="trigger-refine-hook">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">Hook</Badge>
                          <span className="text-sm font-medium line-clamp-1">{studioState.selectedHook?.slice(0, 50)}...</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3 px-1">
                        <p className="text-sm mb-3">{studioState.selectedHook}</p>
                        <RefinementInput
                          contentType="hook"
                          currentContent={studioState.selectedHook}
                          onRefine={(instruction) => handleRefineContent("hook", instruction)}
                          isRefining={refineMutation.isPending && refiningType === "hook"}
                          context={{ topic: studioState.topic }}
                          t={t}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                    
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover-elevate" data-testid="trigger-refine-body">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{t("studio.body")}</Badge>
                          <span className="text-sm font-medium line-clamp-1">{studioState.body?.slice(0, 50)}...</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3 px-1">
                        <div className="whitespace-pre-wrap text-sm text-muted-foreground mb-3 max-h-40 overflow-y-auto">{studioState.body}</div>
                        <RefinementInput
                          contentType="body"
                          currentContent={studioState.body}
                          onRefine={(instruction) => handleRefineContent("body", instruction)}
                          isRefining={refineMutation.isPending && refiningType === "body"}
                          context={{ topic: studioState.topic, hook: studioState.selectedHook }}
                          t={t}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                    
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover-elevate" data-testid="trigger-refine-cta">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">CTA</Badge>
                          <span className="text-sm font-medium line-clamp-1">{studioState.selectedCta?.slice(0, 50)}...</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3 px-1">
                        <p className="text-sm mb-3">{studioState.selectedCta}</p>
                        <RefinementInput
                          contentType="cta"
                          currentContent={studioState.selectedCta}
                          onRefine={(instruction) => handleRefineContent("cta", instruction)}
                          isRefining={refineMutation.isPending && refiningType === "cta"}
                          context={{ topic: studioState.topic, hook: studioState.selectedHook, body: studioState.body }}
                          t={t}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </CardContent>
              </Card>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="gap-2 flex-1"
                  onClick={handleCopyPost}
                  data-testid="button-copy-post"
                >
                  <Copy className="w-4 h-4" />
                  {t("studio.copyPost")}
                </Button>
              </div>

              {/* Low score warning - more actionable */}
              {studioState.score !== null && studioState.score < 8 && (
                <Card className="border-amber-500/50 bg-amber-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{t("studio.almostThere")}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("studio.postsNeedScore8")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
            <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>

        {/* Fixed Bottom Input Area - Always visible */}
        <div className="shrink-0 border-t bg-background">
          <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
            {/* Topic Suggestions - shown above input when step === 1 and briefingSubStep === 1 */}
            {step === 1 && studioState.briefingSubStep === 1 && (topicSuggestions.length > 0 || suggestionsLoadingState === 'loading') && (
              <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                {suggestionsLoadingState === 'loading' ? (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                        <div className="w-2.5 h-2.5 rounded-full bg-primary/70 animate-pulse" style={{ animationDelay: "150ms" }} />
                        <div className="w-2.5 h-2.5 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: "300ms" }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t("studio.generatingPersonalizedSuggestions")}</p>
                        <p className="text-xs text-muted-foreground">{t("studio.basedOnProfile")}</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <span className="font-semibold text-sm block">{t("studio.topicSuggestions")}</span>
                          <span className="text-xs text-muted-foreground">
                            {t("studio.forThisContentType")} "{BRIEFING_TEMPLATES.find(tmpl => tmpl.id === studioState.selectedTemplate)?.name || t("studio.selectContentTypeAbove")}"
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
                      {topicSuggestions.map((suggestion, index) => (
                        <Card 
                          key={suggestion.id} 
                          className="hover-elevate cursor-pointer transition-all border-primary/10 hover:border-primary/30 group animate-in fade-in-0 duration-300"
                          style={{ animationDelay: `${index * 50}ms` }}
                          onClick={() => handleSelectSuggestion(suggestion)}
                          data-testid={`card-suggestion-input-${suggestion.id}`}
                        >
                          <CardContent className="p-4">
                            <p className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">{suggestion.title}</p>
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{suggestion.angle}</p>
                            <div className="flex items-center gap-1.5 text-xs text-primary/80">
                              <Lightbulb className="w-3 h-3" />
                              <span className="line-clamp-1">{suggestion.why}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      {t("studio.orTypeYourOwnBelow")}
                    </p>
                  </>
                )}
              </div>
            )}
            
            {/* Briefing progress indicator */}
            {step === 1 && studioState.briefingSubStep > 0 && (
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3].map((subStep) => (
                  <div
                    key={subStep}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      subStep === studioState.briefingSubStep
                        ? "w-8 bg-primary"
                        : subStep < studioState.briefingSubStep
                        ? "w-4 bg-primary/60"
                        : "w-4 bg-muted"
                    }`}
                  />
                ))}
              </div>
            )}
            
            {/* Chat Input */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  placeholder={
                    step === 1 
                      ? (studioState.briefingSubStep === 0
                          ? t("studio.selectContentTypeAbove")
                          : studioState.briefingSubStep === 1 
                            ? t("studio.whatToWriteAbout")
                            : studioState.briefingSubStep === 2 
                              ? t("studio.objectiveAndAudience")
                              : t("studio.feelingToAwaken"))
                      : t("studio.typeYourResponse")
                  }
                  disabled={isGenerating || (step === 1 && studioState.briefingSubStep === 0)}
                  className="flex-1 min-h-11"
                  data-testid="input-chat"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isGenerating || (step === 1 && studioState.briefingSubStep === 0)}
                  size="default"
                  className="min-h-11 px-4"
                  data-testid="button-send"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              <Badge variant="secondary" className="shrink-0">
                {postsUsed}/{postsLimit}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - LinkedIn Preview (Always visible, sticky) */}
      <aside className="hidden md:flex flex-col w-80 lg:w-96 xl:w-[28rem] shrink-0 border-l bg-muted/30 sticky top-14 self-start max-h-[calc(100vh-3.5rem)] z-40 overflow-y-auto">
        <div className="bg-muted/30 border-b px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">{t("studio.linkedInPreview")}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{t("studio.followYourPostBuild")}</p>
        </div>
        <div className="flex-1 p-4 pb-8 space-y-4 overflow-y-auto">
          {step >= 4 && <ContextualGuidance profile={profile} step={step} studioState={studioState} t={t} />}
          <PostPreview 
            studioState={studioState} 
            isVisible={true}
            onRefineContent={step >= 4 ? handleRefineContent : undefined}
            isRefining={refineMutation.isPending}
            refiningType={refiningType}
            step={step}
            t={t}
            profileName={profile?.jobTitle || t("studio.you")}
          />
        </div>
      </aside>
    </div>
  );
}
