import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { trackAccountDeleted, setUserDataForMatching } from "@/lib/analytics";
import { useLanguage, useTranslation, resolveLanguage } from "@/lib/i18n";
import {
  LANGUAGES,
  TIMEZONES,
  type ContentProfile,
  type Subscription,
} from "@shared/schema";
import {
  ArrowLeft,
  Zap,
  User,
  FileText,
  CreditCard,
  Trash2,
  Save,
  X,
  TrendingUp,
  Calendar,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const createProfileFormSchema = (t: (key: string) => string) => z.object({
  language: z.string().min(1, t("common.required")),
  timezone: z.string().min(1, t("common.required")),
  industry: z.string().min(1, t("common.required")),
  professionalDescription: z.string().min(20, t("settings.minCharsRequired")).max(500, t("settings.maxCharsExceeded")),
  jobTitle: z.string().min(1, t("common.required")),
  companyUrl: z.string().url(t("settings.invalidUrl")).optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<ReturnType<typeof createProfileFormSchema>>;

const createUserProfileSchema = (t: (key: string) => string) => z.object({
  firstName: z.string().min(1, t("settings.firstNameRequired")),
  lastName: z.string().min(1, t("settings.lastNameRequired")),
  phone: z.string().optional(),
  location: z.string().optional(),
});

type UserProfileFormValues = z.infer<ReturnType<typeof createUserProfileSchema>>;

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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          disabled={tags.length >= max}
          data-testid={testId}
        />
        <Button
          type="button"
          variant="outline"
          onClick={addTag}
          disabled={!input.trim() || tags.length >= max}
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

export default function Settings() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);

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

  const profileFormSchema = createProfileFormSchema(t);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      language: "pt-BR",
      timezone: "America/Sao_Paulo",
      industry: "",
      professionalDescription: "",
      jobTitle: "",
      companyUrl: "",
    },
  });

  const userProfileSchema = createUserProfileSchema(t);
  const userForm = useForm<UserProfileFormValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      location: "",
    },
  });

  useEffect(() => {
    if (user) {
      userForm.reset({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        phone: user.phone ?? "",
        location: user.location ?? "",
      });
    }
  }, [user, userForm]);

  useEffect(() => {
    if (profile) {
      form.reset({
        language: profile.language ?? "pt-BR",
        timezone: profile.timezone ?? "America/Sao_Paulo",
        industry: profile.industry ?? "",
        professionalDescription: profile.professionalDescription ?? "",
        jobTitle: profile.jobTitle ?? "",
        companyUrl: profile.companyUrl ?? "",
      });
      setTargetAudience(profile.targetAudience || []);
      setTopics(profile.topics || []);
    }
  }, [profile, form]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: UserProfileFormValues) => {
      return apiRequest("PATCH", "/api/user/profile", data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setUserDataForMatching({
        email: user?.email || undefined,
        phone: variables.phone || undefined,
        firstName: variables.firstName || undefined,
        lastName: variables.lastName || undefined,
        city: variables.location?.split(',')[0]?.trim() || undefined,
        state: variables.location?.split(',')[1]?.trim() || undefined,
        country: 'br',
      });
      toast({
        title: t("settings.dataUpdated"),
        description: t("settings.personalInfoSaved"),
      });
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
        description: t("settings.couldNotUpdateData"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormValues & { targetAudience: string[]; topics: string[] }) => {
      return apiRequest("PATCH", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: t("settings.profileUpdated"),
        description: t("settings.changesSaved"),
      });
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
        description: t("settings.couldNotUpdateProfile"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await trackAccountDeleted('user_requested', false);
      return apiRequest("DELETE", "/api/account");
    },
    onSuccess: () => {
      toast({
        title: t("settings.accountDeleted"),
        description: t("settings.accountDeletedDescription"),
      });
      window.location.href = "/";
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
        description: t("settings.couldNotDeleteAccount"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: ProfileFormValues) => {
    updateMutation.mutate({
      ...values,
      targetAudience,
      topics,
    });
  };

  if (authLoading || profileLoading) {
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
  const periodEnd = subscription?.currentPeriodEnd
    ? format(new Date(subscription.currentPeriodEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
          <p className="text-muted-foreground">{t("settings.subtitle")}</p>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <CardTitle>{t("settings.personalData")}</CardTitle>
                <CardDescription>{t("settings.personalDataDescription")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-16 h-16">
                <AvatarImage
                  src={user?.profileImageUrl ?? undefined}
                  alt={user?.firstName ?? "User"}
                  className="object-cover"
                />
                <AvatarFallback className="text-lg">
                  {user?.firstName?.[0] ?? user?.email?.[0] ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-muted-foreground" data-testid="text-user-email">
                  {user?.email}
                </p>
              </div>
            </div>
            
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit((values) => updateUserMutation.mutate(values))} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={userForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.firstName")}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t("settings.yourName")} data-testid="input-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.lastName")}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t("settings.yourSurname")} data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={userForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.phone")}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(11) 99999-9999" data-testid="input-phone" />
                        </FormControl>
                        <FormDescription>{t("settings.phoneDescription")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.location")}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="São Paulo, SP" data-testid="input-location" />
                        </FormControl>
                        <FormDescription>{t("settings.locationDescription")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateUserMutation.isPending}
                    data-testid="button-save-user-profile"
                  >
                    {updateUserMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        {t("common.saving")}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {t("common.save")}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <div>
                <CardTitle>{t("settings.subscription")}</CardTitle>
                <CardDescription>{t("settings.subscriptionDescription")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("settings.proPlan")}</p>
                <p className="text-sm text-muted-foreground">
                  {subscription?.status === "active" ? t("settings.active") : t("settings.inactive")}
                </p>
              </div>
              <Badge variant={subscription?.status === "active" ? "default" : "secondary"}>
                {subscription?.status === "active" ? t("settings.active") : t("settings.inactive")}
              </Badge>
            </div>

            <Separator />

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-posts-used">{postsUsed}/{postsLimit}</p>
                  <p className="text-sm text-muted-foreground">{t("settings.postsThisMonth")}</p>
                </div>
              </div>
              {periodEnd && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium" data-testid="text-period-end">{periodEnd}</p>
                    <p className="text-sm text-muted-foreground">{t("settings.nextRenewal")}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <CardTitle>{t("settings.contentProfile")}</CardTitle>
                <CardDescription>{t("settings.contentProfileDescription")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.language")}</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setLanguage(resolveLanguage(value));
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-language">
                              <SelectValue placeholder={t("settings.select")} />
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

                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {t("settings.timezone")}
                          </span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-timezone">
                              <SelectValue placeholder={t("settings.select")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIMEZONES.map((tz) => (
                              <SelectItem key={tz.id} value={tz.id}>
                                {tz.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t("settings.timezoneDescription")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.industry")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("settings.industryPlaceholder")} data-testid="input-industry" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="professionalDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.professionalDescription")}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={t("settings.professionalDescriptionPlaceholder")}
                          className="min-h-24 resize-none"
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/500 {t("common.characters")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel className="block mb-2">{t("settings.targetAudience")}</FormLabel>
                  <TagInput
                    tags={targetAudience}
                    onChange={setTargetAudience}
                    placeholder={t("settings.targetAudiencePlaceholder")}
                    max={10}
                    testId="input-audience"
                    addLabel={t("common.add")}
                    tagsLabel={t("common.tags")}
                  />
                </div>

                <div>
                  <FormLabel className="block mb-2">{t("settings.topics")}</FormLabel>
                  <TagInput
                    tags={topics}
                    onChange={setTopics}
                    placeholder={t("settings.topicsPlaceholder")}
                    max={15}
                    testId="input-topics"
                    addLabel={t("common.add")}
                    tagsLabel={t("common.tags")}
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.jobTitle")}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t("settings.jobTitlePlaceholder")} data-testid="input-job-title" />
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
                        <FormLabel>{t("settings.companyUrl")}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t("settings.companyUrlPlaceholder")} data-testid="input-company-url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>

                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="gap-2"
                  data-testid="button-save-profile"
                >
                  {updateMutation.isPending ? (
                    t("common.saving")
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {t("settings.saveChanges")}
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-destructive" />
              <div>
                <CardTitle className="text-destructive">{t("settings.dangerZone")}</CardTitle>
                <CardDescription>{t("settings.dangerZoneDescription")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t("settings.dangerZoneWarning")}
            </p>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              data-testid="button-delete-account"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("settings.deleteMyAccount")}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("settings.deleteConfirmDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              data-testid="button-cancel-delete"
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? t("settings.deleting") : t("settings.yesDeleteAccount")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
