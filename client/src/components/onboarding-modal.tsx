import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ArrowLeft, ArrowRight, X, Check, Target, Users, Award } from "lucide-react";

const TOTAL_STEPS = 7;

const stepTitles = [
  "You write in",
  "You work in",
  "You are a",
  "You want to reach",
  "You post about",
  "Your goals",
  "Qualification",
];

const stepDescriptions = [
  "The language you use to write your posts",
  "The industry you operate in",
  "Your job title or how you describe your work",
  "Your ideal audience or customer",
  "The topics you would like to start posting about",
  "What you want to achieve with your LinkedIn content",
  "Final information for better service",
];

const schemas = [
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  onboardingStep4Schema,
  onboardingStep5Schema,
  onboardingStep6Schema,
  onboardingStep7Schema,
];

type FormData = {
  language: string;
  industry: string;
  professionalDescription: string;
  targetAudience: string[];
  topics: string[];
  goals: string[];
  firstName: string;
  lastName: string;
  phone: string;
  jobTitle: string;
  companyUrl: string;
};

function TagInput({
  tags,
  onChange,
  placeholder,
  max,
  testId,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  max: number;
  testId: string;
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
          Adicionar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {tags.length}/{max} tags
      </p>
    </div>
  );
}

interface StepFormProps {
  step: number;
  formData: FormData;
  onNext: (values: FormData) => void;
  onBack: (values: FormData) => void;
  isPending: boolean;
}

function StepForm({ step, formData, onNext, onBack, isPending }: StepFormProps) {
  const form = useForm({
    resolver: zodResolver(schemas[step - 1]),
    defaultValues: formData,
    mode: "onChange",
  });

  const handleNext = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;
    onNext(form.getValues() as FormData);
  };

  const handleBack = () => {
    onBack(form.getValues() as FormData);
  };

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {step === 1 && (
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-language">
                      <SelectValue placeholder="Select language" />
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
                <FormDescription>
                  Example: American English, Portuguese
                </FormDescription>
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
                <FormLabel>Industry</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Growth Hacking, Travel Arrangements, SaaS..."
                    data-testid="input-industry"
                  />
                </FormControl>
                <FormDescription>
                  Example: Growth Hacking, Travel Arrangements, Tech
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
                <FormLabel>Professional description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="I am a seasoned Head of Growth, GTM Engineer, and Growth Hacking advisor with expertise in demand generation, revenue optimization, and scaling startups to successful M&A..."
                    className="min-h-32 resize-none"
                    data-testid="textarea-description"
                  />
                </FormControl>
                <FormDescription>
                  {field.value?.length || 0}/500 characters (minimum 20)
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
                <FormLabel>Target audience</FormLabel>
                <FormControl>
                  <TagInput
                    tags={field.value || []}
                    onChange={field.onChange}
                    placeholder="e.g., Startup founders seeking growth strategies"
                    max={10}
                    testId="input-audience"
                  />
                </FormControl>
                <FormDescription>
                  Examples: CMOs in tech and SaaS companies, Investors and VCs interested in high-growth startups
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
                <FormLabel>Content topics</FormLabel>
                <FormControl>
                  <TagInput
                    tags={field.value || []}
                    onChange={field.onChange}
                    placeholder="e.g., Growth hacking strategies and case studies"
                    max={15}
                    testId="input-topics"
                  />
                </FormControl>
                <FormDescription>
                  Examples: Demand generation and revenue optimization, Go-to-market (GTM) frameworks
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
                <FormLabel>Content goals</FormLabel>
                <FormControl>
                  <div className="grid gap-3">
                    {CONTENT_GOALS.map((goal) => {
                      const isSelected = (field.value || []).includes(goal.id);
                      const GoalIcon = goal.id === "leads" ? Target : goal.id === "authority" ? Award : Users;
                      return (
                        <div
                          key={goal.id}
                          onClick={() => {
                            if (isSelected) {
                              field.onChange((field.value || []).filter((g: string) => g !== goal.id));
                            } else if ((field.value || []).length < 3) {
                              field.onChange([...(field.value || []), goal.id]);
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
                            <p className="font-medium">{goal.name}</p>
                            <p className="text-sm text-muted-foreground">{goal.description}</p>
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
                  Select 1-3 goals for your content strategy
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
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: João"
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
                    <FormLabel>Sobrenome</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: Silva"
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
                    <FormLabel>Telefone/WhatsApp</FormLabel>
                    <FormControl>
                      <Input
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={formatPhoneDisplay(field.value || "")}
                        onChange={handlePhoneChange}
                        placeholder="+55(11)93344-0033"
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormDescription>
                      Digite seu telefone com DDD
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
                  <FormLabel>Cargo/Título</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: CEO, CTO, Head de Marketing..."
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
                  <FormLabel>URL da empresa (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://suaempresa.com"
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
            disabled={step === 1 || isPending}
            className="gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={isPending}
            className="gap-2"
            data-testid="button-next"
          >
            {isPending ? (
              "Salvando..."
            ) : step === TOTAL_STEPS ? (
              <>
                Finalizar
                <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface OnboardingModalProps {
  profile: ContentProfile | null | undefined;
  isLoading: boolean;
  onComplete: () => void;
  user?: { firstName?: string; lastName?: string; phone?: string } | null;
}

export function OnboardingModal({ profile, isLoading, onComplete, user }: OnboardingModalProps) {
  const { toast } = useToast();
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    language: "pt-BR",
    industry: "",
    professionalDescription: "",
    targetAudience: [],
    topics: [],
    goals: [],
    firstName: "",
    lastName: "",
    phone: "",
    jobTitle: "",
    companyUrl: "",
  });

  useEffect(() => {
    if (!isLoading && !hasInitialized) {
      if (profile) {
        setStep(profile.onboardingStep || 1);
        setFormData((prev) => ({
          ...prev,
          language: profile.language || "pt-BR",
          industry: profile.industry || "",
          professionalDescription: profile.professionalDescription || "",
          targetAudience: profile.targetAudience || [],
          topics: profile.topics || [],
          goals: profile.goals || [],
          jobTitle: profile.jobTitle || "",
          companyUrl: profile.companyUrl || "",
        }));
        setIsCompleted(!!profile.onboardingCompleted);
      } else {
        setIsCompleted(false);
      }
      setHasInitialized(true);
    }
  }, [profile, isLoading, hasInitialized]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: prev.firstName || user.firstName || "",
        lastName: prev.lastName || user.lastName || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (profile?.onboardingCompleted && hasInitialized) {
      setIsCompleted(true);
    }
  }, [profile?.onboardingCompleted, hasInitialized]);

  const saveProgressMutation = useMutation({
    mutationFn: async (data: FormData & { onboardingStep: number }) => {
      const response = await apiRequest("PATCH", "/api/profile/progress", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Não autorizado",
          description: "Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível salvar o progresso. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("POST", "/api/profile", {
        ...data,
        onboardingCompleted: true,
      });
    },
    onSuccess: () => {
      setIsCompleted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Perfil criado!",
        description: "Seu perfil de conteúdo foi configurado com sucesso.",
      });
      onComplete();
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Não autorizado",
          description: "Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Não foi possível salvar o perfil.",
        variant: "destructive",
      });
    },
  });

  const handleNext = async (values: FormData) => {
    const newFormData = { ...formData, ...values };

    if (step === TOTAL_STEPS) {
      completeMutation.mutate(newFormData);
    } else {
      const nextStep = step + 1;
      try {
        await saveProgressMutation.mutateAsync({
          ...newFormData,
          onboardingStep: nextStep,
        });
        setFormData(newFormData);
        setStep(nextStep);
      } catch {
        // Error handled in onError
      }
    }
  };

  const handleBack = async (values: FormData) => {
    if (step > 1) {
      const newFormData = { ...formData, ...values };
      const prevStep = step - 1;
      try {
        await saveProgressMutation.mutateAsync({
          ...newFormData,
          onboardingStep: prevStep,
        });
        setFormData(newFormData);
        setStep(prevStep);
      } catch {
        // Error handled in onError
      }
    }
  };

  if (isCompleted === null) {
    return null;
  }

  const isOpen = !isCompleted;
  const isPending = saveProgressMutation.isPending || completeMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Passo {step} de {TOTAL_STEPS}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round((step / TOTAL_STEPS) * 100)}%
              </span>
            </div>
            <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />
          </div>
          <DialogTitle>{stepTitles[step - 1]}</DialogTitle>
          <DialogDescription>{stepDescriptions[step - 1]}</DialogDescription>
        </DialogHeader>

        <StepForm 
          key={step}
          step={step} 
          formData={formData} 
          onNext={handleNext} 
          onBack={handleBack}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
