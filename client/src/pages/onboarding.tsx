import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  LANGUAGES,
  CONTENT_GOALS,
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  onboardingStep4Schema,
  onboardingStep5Schema,
  onboardingStep6Schema,
  onboardingStep7Schema,
  type ContentProfile,
} from "@shared/schema";
import { ArrowLeft, ArrowRight, X, Zap, Check, Target, Users, Award } from "lucide-react";
import { trackOnboardingComplete, trackButtonClick } from "@/lib/analytics";
import { useLanguage, useTranslation, resolveLanguage, type Language } from "@/lib/i18n";

const TOTAL_STEPS = 7;

function TagInput({
  tags,
  onChange,
  placeholder,
  max,
  testId,
  addLabel,
  tagsLabel,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  max: number;
  testId: string;
  addLabel: string;
  tagsLabel: string;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < max) {
      onChange([...tags, trimmed]);
      setInput("");
    }
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 rounded-full p-0.5 hover:bg-muted"
              data-testid={`button-remove-tag-${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={tags.length >= max}
          data-testid={testId}
        />
        <Button
          type="button"
          variant="outline"
          onClick={addTag}
          disabled={!input.trim() || tags.length >= max}
          data-testid={`button-add-${testId}`}
        >
          {addLabel}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {tags.length}/{max} {tagsLabel}
      </p>
    </div>
  );
}

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { setLanguage } = useLanguage();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    language: "pt-BR",
    industry: "",
    professionalDescription: "",
    targetAudience: [] as string[],
    topics: [] as string[],
    goals: [] as string[],
    firstName: "",
    lastName: "",
    phone: "",
    jobTitle: "",
    companyUrl: "",
  });

  const stepTitles = [
    t("onboarding.step1Title"),
    t("onboarding.step2Title"),
    t("onboarding.step3Title"),
    t("onboarding.step4Title"),
    t("onboarding.step5Title"),
    t("onboarding.step6Title"),
    t("onboarding.step7Title"),
  ];

  const stepDescriptions = [
    t("onboarding.step1Description"),
    t("onboarding.step2Description"),
    t("onboarding.step3Description"),
    t("onboarding.step4Description"),
    t("onboarding.step5Description"),
    t("onboarding.step6Description"),
    t("onboarding.step7Description"),
  ];

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

  const { data: profile } = useQuery<ContentProfile>({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (profile?.onboardingCompleted) {
      navigate("/dashboard");
    }
  }, [profile, navigate]);

  const schemas = [
    onboardingStep1Schema,
    onboardingStep2Schema,
    onboardingStep3Schema,
    onboardingStep4Schema,
    onboardingStep5Schema,
    onboardingStep6Schema,
    onboardingStep7Schema,
  ];

  const form = useForm({
    resolver: zodResolver(schemas[step - 1]),
    defaultValues: formData,
    mode: "onChange",
  });

  useEffect(() => {
    form.reset(formData);
  }, [step, form, formData]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/profile", {
        ...data,
        onboardingCompleted: true,
      });
    },
    onMutate: () => {
      trackOnboardingComplete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: t("onboarding.profileCreated"),
        description: t("onboarding.profileConfigured"),
      });
      navigate("/dashboard");
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
        description: t("onboarding.pleaseFixErrors"),
        variant: "destructive",
      });
    },
  });

  const handleLanguageChange = (langValue: string) => {
    const resolved = resolveLanguage(langValue);
    setLanguage(resolved);
  };

  const handleNext = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      const errors = form.formState.errors;
      const errorMessages = Object.values(errors)
        .map((error: any) => error?.message)
        .filter(Boolean);
      
      if (errorMessages.length > 0) {
        toast({
          title: t("onboarding.pleaseFixErrors"),
          description: errorMessages[0] as string,
          variant: "destructive",
        });
      }
      return;
    }

    const values = form.getValues();
    const newFormData = { ...formData, ...values };
    setFormData(newFormData);

    if (step === TOTAL_STEPS) {
      saveMutation.mutate(newFormData);
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold">LinkedIn Viral</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {t("common.step")} {step} {t("common.of")} {TOTAL_STEPS}
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round((step / TOTAL_STEPS) * 100)}%
                </span>
              </div>
              <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />
            </div>
            <CardTitle>{stepTitles[step - 1]}</CardTitle>
            <CardDescription>{stepDescriptions[step - 1]}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                {step === 1 && (
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.language")}</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleLanguageChange(value);
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-language">
                              <SelectValue placeholder={t("onboarding.selectLanguage")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LANGUAGES.map((lang) => (
                              <SelectItem key={lang.id} value={lang.id}>
                                {lang.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {step === 2 && (
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.industry")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("onboarding.industryPlaceholder")}
                            data-testid="input-industry"
                          />
                        </FormControl>
                        <FormDescription>
                          {t("onboarding.industryExample")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {step === 3 && (
                  <FormField
                    control={form.control}
                    name="professionalDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.professionalDescription")}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t("onboarding.professionalDescPlaceholder")}
                            className="min-h-32 resize-none"
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/500 {t("common.characters")} (20 {t("onboarding.minCharacters")})
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {step === 4 && (
                  <FormField
                    control={form.control}
                    name="targetAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.targetAudience")}</FormLabel>
                        <FormControl>
                          <TagInput
                            tags={field.value}
                            onChange={field.onChange}
                            placeholder={t("onboarding.audiencePlaceholder")}
                            max={10}
                            testId="input-audience"
                            addLabel={t("common.add")}
                            tagsLabel={t("common.tags")}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("onboarding.audienceExamples")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {step === 5 && (
                  <FormField
                    control={form.control}
                    name="topics"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.topics")}</FormLabel>
                        <FormControl>
                          <TagInput
                            tags={field.value}
                            onChange={field.onChange}
                            placeholder={t("onboarding.topicsPlaceholder")}
                            max={15}
                            testId="input-topics"
                            addLabel={t("common.add")}
                            tagsLabel={t("common.tags")}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("onboarding.topicsExamples")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {step === 6 && (
                  <FormField
                    control={form.control}
                    name="goals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("onboarding.contentGoals")}</FormLabel>
                        <FormControl>
                          <div className="grid gap-3">
                            {CONTENT_GOALS.map((goal) => {
                              const isSelected = field.value.includes(goal.id);
                              const GoalIcon = goal.id === "leads" ? Target : goal.id === "authority" ? Award : Users;
                              const goalName = t(`goals.${goal.id}`);
                              const goalDescription = t(`goals.${goal.id}Description`);
                              return (
                                <div
                                  key={goal.id}
                                  onClick={() => {
                                    if (isSelected) {
                                      field.onChange(field.value.filter((g: string) => g !== goal.id));
                                    } else if (field.value.length < 3) {
                                      field.onChange([...field.value, goal.id]);
                                    }
                                  }}
                                  className={`flex items-center gap-4 p-4 rounded-md border cursor-pointer transition-colors ${
                                    isSelected
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover-elevate"
                                  }`}
                                  data-testid={`goal-${goal.id}`}
                                >
                                  <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                                  }`}>
                                    <GoalIcon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium">{goalName}</p>
                                    <p className="text-sm text-muted-foreground">{goalDescription}</p>
                                  </div>
                                  {isSelected && (
                                    <Check className="w-5 h-5 text-primary" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </FormControl>
                        <FormDescription>
                          {t("onboarding.selectGoals")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {step === 7 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("onboarding.name")}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("onboarding.namePlaceholder")}
                                data-testid="input-first-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("onboarding.surname")}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("onboarding.surnamePlaceholder")}
                                data-testid="input-last-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => {
                        const formatPhoneDisplay = (value: string) => {
                          const digits = value.replace(/\D/g, "");
                          if (digits.length === 0) return "";
                          if (digits.length <= 2) return `+${digits}`;
                          if (digits.length <= 4) return `+${digits.slice(0, 2)}(${digits.slice(2)}`;
                          if (digits.length <= 9) return `+${digits.slice(0, 2)}(${digits.slice(2, 4)})${digits.slice(4)}`;
                          return `+${digits.slice(0, 2)}(${digits.slice(2, 4)})${digits.slice(4, 9)}-${digits.slice(9, 13)}`;
                        };
                        
                        const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          field.onChange(digits.slice(0, 13));
                        };
                        
                        return (
                          <FormItem>
                            <FormLabel>{t("settings.phone")}</FormLabel>
                            <FormControl>
                              <Input
                                name={field.name}
                                ref={field.ref}
                                onBlur={field.onBlur}
                                value={formatPhoneDisplay(field.value || "")}
                                onChange={handlePhoneChange}
                                placeholder={t("onboarding.phonePlaceholder")}
                                data-testid="input-phone"
                              />
                            </FormControl>
                            <FormDescription>
                              {t("onboarding.phoneHint")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("onboarding.jobTitleLabel")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t("onboarding.jobTitlePlaceholder")}
                              data-testid="input-job-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="companyUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("onboarding.companyUrlLabel")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t("onboarding.companyUrlPlaceholder")}
                              data-testid="input-company-url"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 1}
                    className="gap-2"
                    data-testid="button-back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t("common.back")}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={saveMutation.isPending}
                    className="gap-2"
                    data-testid="button-next"
                  >
                    {saveMutation.isPending ? (
                      t("common.saving")
                    ) : step === TOTAL_STEPS ? (
                      <>
                        {t("common.finish")}
                        <Check className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        {t("common.continue")}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
