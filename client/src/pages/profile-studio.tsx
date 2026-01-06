import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { 
  User, 
  ArrowLeft, 
  Check, 
  Circle, 
  Loader2, 
  Briefcase, 
  Brain, 
  BookOpen, 
  GraduationCap, 
  FlaskConical, 
  Pencil,
  Sparkles,
  Eye,
  FlaskRound,
  ChevronRight
} from "lucide-react";
import type { User as UserType, ContentProfile } from "@shared/schema";
import debounce from "@/lib/debounce";

interface ProfileStudioData {
  creatorArchetype: string | null;
  antiValues: string[];
  toneFormality: number;
  toneHumor: number;
  toneDepth: number;
  toneEmotion: number;
  goldenRules: string;
  profileStudioCompleted: boolean;
  profileStudioLastSection: number;
}

interface ProfileStudioConstants {
  archetypes: { id: string; name: string; description: string }[];
  antiValues: { id: string; label: string }[];
  toneSliders: { id: string; name: string; leftLabel: string; rightLabel: string }[];
}

const SECTION_ICONS = {
  intro: User,
  essentials: Sparkles,
  tests: FlaskRound,
  review: Eye,
};

export default function ProfileStudio() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState(0);
  const [formData, setFormData] = useState<ProfileStudioData>({
    creatorArchetype: null,
    antiValues: [],
    toneFormality: 5,
    toneHumor: 5,
    toneDepth: 5,
    toneEmotion: 5,
    goldenRules: "",
    profileStudioCompleted: false,
    profileStudioLastSection: 0,
  });
  const [customArchetype, setCustomArchetype] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const hasInitialized = useRef(false);

  const { data: user, isLoading: userLoading } = useQuery<UserType & { hasProfile: boolean }>({
    queryKey: ["/api/auth/user"],
  });

  const { data: profile } = useQuery<ContentProfile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const { data: studioData, isLoading: studioLoading } = useQuery<ProfileStudioData>({
    queryKey: ["/api/profile-studio"],
    enabled: !!user,
  });

  const { data: constants } = useQuery<ProfileStudioConstants>({
    queryKey: ["/api/profile-studio/constants"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<ProfileStudioData>) => {
      return apiRequest("PUT", "/api/profile-studio", data);
    },
    onSuccess: (_, variables) => {
      setSaveStatus("saved");
      // Atualiza o cache diretamente sem invalidar (evita refetch e reset da interface)
      queryClient.setQueryData(["/api/profile-studio"], (old: ProfileStudioData | undefined) => ({
        ...old,
        ...variables,
      }));
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
    onError: () => {
      toast({
        title: t("profileStudio.errorSaving"),
        description: t("profileStudio.couldNotSave"),
        variant: "destructive",
      });
      setSaveStatus("idle");
    },
  });

  const debouncedSave = useCallback(
    debounce((data: Partial<ProfileStudioData>) => {
      setSaveStatus("saving");
      saveMutation.mutate(data);
    }, 1000),
    []
  );

  useEffect(() => {
    if (studioData && !hasInitialized.current) {
      hasInitialized.current = true;
      setFormData({
        creatorArchetype: studioData.creatorArchetype,
        antiValues: studioData.antiValues || [],
        toneFormality: studioData.toneFormality ?? 5,
        toneHumor: studioData.toneHumor ?? 5,
        toneDepth: studioData.toneDepth ?? 5,
        toneEmotion: studioData.toneEmotion ?? 5,
        goldenRules: studioData.goldenRules || "",
        profileStudioCompleted: studioData.profileStudioCompleted,
        profileStudioLastSection: studioData.profileStudioLastSection ?? 0,
      });
      setActiveSection(studioData.profileStudioLastSection ?? 0);
    }
  }, [studioData]);


  const updateField = <K extends keyof ProfileStudioData>(
    field: K,
    value: ProfileStudioData[K]
  ) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    debouncedSave(newData);
  };

  const calculateProgress = (): number => {
    let progress = 0;
    if (formData.creatorArchetype) progress += 40;
    if (formData.antiValues.length > 0) progress += 20;
    if (formData.goldenRules) progress += 20;
    const slidersMoved = 
      formData.toneFormality !== 5 ||
      formData.toneHumor !== 5 ||
      formData.toneDepth !== 5 ||
      formData.toneEmotion !== 5;
    if (slidersMoved) progress += 20;
    return progress;
  };

  const getSectionStatus = (sectionIndex: number): "complete" | "partial" | "not-started" => {
    switch (sectionIndex) {
      case 0:
        return "complete";
      case 1:
        if (formData.creatorArchetype) return "complete";
        if (formData.antiValues.length > 0 || formData.goldenRules) return "partial";
        return "not-started";
      case 2:
        return "not-started";
      case 3:
        return formData.profileStudioCompleted ? "complete" : "not-started";
      default:
        return "not-started";
    }
  };

  const handleComplete = () => {
    const finalData = { ...formData, profileStudioCompleted: true };
    setSaveStatus("saving");
    saveMutation.mutate(finalData, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        toast({
          title: t("profileStudio.completedSuccess"),
          description: t("profileStudio.settingsSaved"),
          duration: 5000,
        });
        navigate("/dashboard");
      },
    });
  };

  if (userLoading || studioLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const sections = [
    { id: "intro", name: t("profileStudio.intro"), icon: SECTION_ICONS.intro },
    { id: "essentials", name: t("profileStudio.essentials"), icon: SECTION_ICONS.essentials },
    { id: "tests", name: t("profileStudio.tests"), icon: SECTION_ICONS.tests },
    { id: "review", name: t("profileStudio.review"), icon: SECTION_ICONS.review },
  ];

  const progress = calculateProgress();

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t("profileStudio.title")}</h1>
            <p className="text-muted-foreground">{t("profileStudio.subtitle")}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{progress}% {t("profileStudio.complete")}</span>
              <Progress value={progress} className="w-24 h-2" />
            </div>
            {saveStatus === "saving" && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> {t("common.saving")}
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <Check className="h-3 w-3" /> {t("common.saved")}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="w-full md:w-64 shrink-0">
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
              {sections.map((section, index) => {
                const status = getSectionStatus(index);
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(index)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors hover-elevate ${
                      activeSection === index
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground"
                    }`}
                    data-testid={`button-section-${section.id}`}
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      {status === "complete" ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : status === "partial" ? (
                        <div className="h-4 w-4 rounded-full border-2 border-amber-500 bg-amber-500/20" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </div>
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{section.name}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="flex-1 space-y-6">
            {activeSection === 0 && (
              <SectionIntro user={user} profile={profile} progress={progress} onContinue={() => setActiveSection(1)} t={t} />
            )}

            {activeSection === 1 && constants && (
              <SectionEssentials
                formData={formData}
                constants={constants}
                customArchetype={customArchetype}
                setCustomArchetype={setCustomArchetype}
                updateField={updateField}
                onContinue={() => setActiveSection(2)}
                t={t}
              />
            )}

            {activeSection === 2 && <SectionTests onContinue={() => setActiveSection(3)} t={t} />}

            {activeSection === 3 && (
              <SectionReview
                formData={formData}
                constants={constants}
                profile={profile}
                progress={progress}
                onComplete={handleComplete}
                isCompleting={saveMutation.isPending}
                t={t}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function SectionIntro({
  user,
  profile,
  progress,
  onContinue,
  t,
}: {
  user?: UserType & { hasProfile: boolean };
  profile?: ContentProfile;
  progress: number;
  onContinue: () => void;
  t: (key: string) => string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="text-2xl">
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-muted-foreground">{profile?.jobTitle || t("profileStudio.professional")}</p>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">{t("profileStudio.profileProgress")}</p>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {progress < 100
                  ? t("profileStudio.completeForPotential")
                  : t("profileStudio.profileComplete")}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <h3>{t("profileStudio.welcomeTitle")}</h3>
          <p>
            {t("profileStudio.welcomeDescription")}
          </p>
          <ul>
            <li>{t("profileStudio.quickQuestions")}</li>
            <li>{t("profileStudio.personalityTests")}</li>
            <li>{t("profileStudio.fineTuning")}</li>
          </ul>
          <p className="text-muted-foreground">
            {t("profileStudio.estimatedTime")}
          </p>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onContinue} className="gap-2" data-testid="button-continue-intro">
            {t("profileStudio.start")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionEssentials({
  formData,
  constants,
  customArchetype,
  setCustomArchetype,
  updateField,
  onContinue,
  t,
}: {
  formData: ProfileStudioData;
  constants: ProfileStudioConstants;
  customArchetype: string;
  setCustomArchetype: (v: string) => void;
  updateField: <K extends keyof ProfileStudioData>(field: K, value: ProfileStudioData[K]) => void;
  onContinue: () => void;
  t: (key: string) => string;
}) {
  const archetypeIcons: Record<string, typeof Briefcase> = {
    builder: Briefcase,
    thinker: Brain,
    storyteller: BookOpen,
    educator: GraduationCap,
    scientist: FlaskConical,
    other: Pencil,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. {t("profileStudio.creatorArchetype")}</CardTitle>
          <CardDescription>{t("profileStudio.archetypeDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.creatorArchetype || ""}
            onValueChange={(value) => updateField("creatorArchetype", value)}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            {constants.archetypes.map((archetype) => {
              const Icon = archetypeIcons[archetype.id] || User;
              const isSelected = formData.creatorArchetype === archetype.id;
              return (
                <Label
                  key={archetype.id}
                  htmlFor={`archetype-${archetype.id}`}
                  className={`flex items-start gap-3 p-4 rounded-md border cursor-pointer transition-colors hover-elevate ${
                    isSelected ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  data-testid={`radio-archetype-${archetype.id}`}
                >
                  <RadioGroupItem
                    value={archetype.id}
                    id={`archetype-${archetype.id}`}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="font-medium">{archetype.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{archetype.description}</p>
                  </div>
                </Label>
              );
            })}
          </RadioGroup>

          {formData.creatorArchetype === "other" && (
            <Textarea
              placeholder={t("profileStudio.describeYourArchetype")}
              value={customArchetype}
              onChange={(e) => setCustomArchetype(e.target.value)}
              className="mt-4"
              data-testid="input-custom-archetype"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. {t("profileStudio.antiValues")}</CardTitle>
          <CardDescription>{t("profileStudio.antiValuesDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {constants.antiValues.map((antiValue) => {
              const isChecked = formData.antiValues.includes(antiValue.id);
              return (
                <Label
                  key={antiValue.id}
                  htmlFor={`antivalue-${antiValue.id}`}
                  className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors hover-elevate ${
                    isChecked ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  data-testid={`checkbox-antivalue-${antiValue.id}`}
                >
                  <Checkbox
                    id={`antivalue-${antiValue.id}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const newValues = checked
                        ? [...formData.antiValues, antiValue.id]
                        : formData.antiValues.filter((v) => v !== antiValue.id);
                      updateField("antiValues", newValues);
                    }}
                  />
                  <span className="text-sm">{antiValue.label}</span>
                </Label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. {t("profileStudio.toneOfVoice")}</CardTitle>
          <CardDescription>{t("profileStudio.toneDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {constants.toneSliders.map((slider) => {
            const fieldKey = `tone${slider.id.charAt(0).toUpperCase() + slider.id.slice(1)}` as keyof ProfileStudioData;
            const value = formData[fieldKey] as number;
            return (
              <div key={slider.id} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{slider.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {value}/10
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-24 text-right">
                    {slider.leftLabel}
                  </span>
                  <Slider
                    value={[value]}
                    onValueChange={([v]) => updateField(fieldKey, v)}
                    max={10}
                    step={1}
                    className="flex-1"
                    data-testid={`slider-tone-${slider.id}`}
                  />
                  <span className="text-xs text-muted-foreground w-24">
                    {slider.rightLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. {t("profileStudio.goldenRules")}</CardTitle>
          <CardDescription>
            {t("profileStudio.goldenRulesDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={t("profileStudio.goldenRulesPlaceholder")}
            value={formData.goldenRules}
            onChange={(e) => updateField("goldenRules", e.target.value)}
            maxLength={300}
            className="min-h-24"
            data-testid="input-golden-rules"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {formData.goldenRules.length}/300 {t("common.characters")}
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onContinue} className="gap-2" data-testid="button-continue-essentials">
          {t("common.continue")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SectionTests({ onContinue, t }: { onContinue: () => void; t: (key: string) => string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("profileStudio.tests")}</CardTitle>
          <CardDescription>
            {t("profileStudio.testsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-md border border-dashed">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{t("profileStudio.discTest")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("profileStudio.discDescription")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">~5 {t("profileStudio.minutes")}</p>
              </div>
              <Badge variant="outline">{t("profileStudio.comingSoon")}</Badge>
            </div>
          </div>

          <div className="p-4 rounded-md border border-dashed">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{t("profileStudio.bigFive")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("profileStudio.bigFiveDescription")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">~8 {t("profileStudio.minutes")}</p>
              </div>
              <Badge variant="outline">{t("profileStudio.comingSoon")}</Badge>
            </div>
          </div>

          <div className="p-4 rounded-md border border-dashed">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{t("profileStudio.enneagram")}</h4>
                <p className="text-sm text-muted-foreground">{t("profileStudio.enneagramDescription")}</p>
                <p className="text-xs text-muted-foreground mt-1">~10 {t("profileStudio.minutes")}</p>
              </div>
              <Badge variant="outline">{t("profileStudio.comingSoon")}</Badge>
            </div>
          </div>

          <div className="p-4 rounded-md border border-dashed">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{t("profileStudio.mbti")}</h4>
                <p className="text-sm text-muted-foreground">{t("profileStudio.mbtiDescription")}</p>
                <p className="text-xs text-muted-foreground mt-1">~15 {t("profileStudio.minutes")}</p>
              </div>
              <Badge variant="outline">{t("profileStudio.comingSoon")}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onContinue} className="gap-2" data-testid="button-continue-tests">
          {t("profileStudio.continueToReview")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SectionReview({
  formData,
  constants,
  profile,
  progress,
  onComplete,
  isCompleting,
  t,
}: {
  formData: ProfileStudioData;
  constants?: ProfileStudioConstants;
  profile?: ContentProfile;
  progress: number;
  onComplete: () => void;
  isCompleting: boolean;
  t: (key: string) => string;
}) {
  const selectedArchetype = constants?.archetypes.find(
    (a) => a.id === formData.creatorArchetype
  );

  const getToneLabel = (value: number, leftLabel: string, rightLabel: string) => {
    if (value <= 3) return leftLabel;
    if (value >= 7) return rightLabel;
    return t("profileStudio.balanced");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("profileStudio.yourCompleteProfile")}</CardTitle>
          <CardDescription>
            {t("profileStudio.reviewAndFinalize")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Progress value={progress} className="flex-1 h-3" />
            <span className="text-lg font-bold">{progress}%</span>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">{t("profileStudio.archetype")}</h4>
            {selectedArchetype ? (
              <div className="p-3 rounded-md bg-muted">
                <span className="font-medium">{selectedArchetype.name}</span>
                <p className="text-sm text-muted-foreground">{selectedArchetype.description}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("profileStudio.notDefined")}</p>
            )}
          </div>

          <div>
            <h4 className="font-medium mb-2">{t("profileStudio.antiValues")}</h4>
            {formData.antiValues.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formData.antiValues.map((id) => {
                  const antiValue = constants?.antiValues.find((a) => a.id === id);
                  return (
                    <Badge key={id} variant="secondary">
                      {antiValue?.label || id}
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("profileStudio.noneSelected")}</p>
            )}
          </div>

          <div>
            <h4 className="font-medium mb-2">{t("profileStudio.toneOfVoice")}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded-md bg-muted text-center">
                <p className="text-xs text-muted-foreground">{t("profileStudio.formality")}</p>
                <p className="font-medium">
                  {getToneLabel(formData.toneFormality, t("profileStudio.corporate"), t("profileStudio.casual"))}
                </p>
              </div>
              <div className="p-2 rounded-md bg-muted text-center">
                <p className="text-xs text-muted-foreground">{t("profileStudio.humor")}</p>
                <p className="font-medium">
                  {getToneLabel(formData.toneHumor, t("profileStudio.serious"), t("profileStudio.ironic"))}
                </p>
              </div>
              <div className="p-2 rounded-md bg-muted text-center">
                <p className="text-xs text-muted-foreground">{t("profileStudio.depth")}</p>
                <p className="font-medium">
                  {getToneLabel(formData.toneDepth, t("profileStudio.accessible"), t("profileStudio.technical"))}
                </p>
              </div>
              <div className="p-2 rounded-md bg-muted text-center">
                <p className="text-xs text-muted-foreground">{t("profileStudio.emotion")}</p>
                <p className="font-medium">
                  {getToneLabel(formData.toneEmotion, t("profileStudio.rational"), t("profileStudio.vulnerable"))}
                </p>
              </div>
            </div>
          </div>

          {formData.goldenRules && (
            <div>
              <h4 className="font-medium mb-2">{t("profileStudio.goldenRules")}</h4>
              <p className="text-sm p-3 rounded-md bg-muted italic">
                "{formData.goldenRules}"
              </p>
            </div>
          )}

          <Separator />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {}} data-testid="button-edit-profile">
              {t("profileStudio.editProfile")}
            </Button>
            <Button onClick={onComplete} disabled={isCompleting} data-testid="button-finalize">
              {isCompleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("profileStudio.finalizing")}
                </>
              ) : (
                <>
                  {t("profileStudio.finalizeAndUse")}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
