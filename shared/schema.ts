import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Waitlist leads table
export const waitlistLeads = pgTable("waitlist_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  batchNumber: integer("batch_number").default(1),
  trafficSource: varchar("traffic_source"),
  trafficMedium: varchar("traffic_medium"),
  trafficCampaign: varchar("traffic_campaign"),
  gclid: varchar("gclid"),
  fbclid: varchar("fbclid"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWaitlistLeadSchema = createInsertSchema(waitlistLeads).omit({
  id: true,
  batchNumber: true,
  createdAt: true,
});

export type InsertWaitlistLead = z.infer<typeof insertWaitlistLeadSchema>;
export type WaitlistLead = typeof waitlistLeads.$inferSelect;

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  
  // Traffic source data (GA4 standard)
  trafficSource: varchar("traffic_source"),
  trafficMedium: varchar("traffic_medium"),
  trafficCampaign: varchar("traffic_campaign"),
  trafficContent: varchar("traffic_content"),
  trafficTerm: varchar("traffic_term"),
  
  // Ads identifiers
  gclid: varchar("gclid"),
  fbclid: varchar("fbclid"),
  
  // Lifecycle data
  lastAccessAt: timestamp("last_access_at"),
  totalPosts: integer("total_posts").notNull().default(0),
  totalRevenue: real("total_revenue").notNull().default(0),
  firstBillingAmount: real("first_billing_amount"),
  firstBillingDate: timestamp("first_billing_date"),
  lastBillingAmount: real("last_billing_amount"),
  lastBillingDate: timestamp("last_billing_date"),
  
  // User profile data
  phone: varchar("phone"),
  location: varchar("location"),
  company: varchar("company"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content profile for onboarding data
export const contentProfiles = pgTable("content_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  language: varchar("language").default("pt-BR"),
  timezone: varchar("timezone").default("America/Sao_Paulo"),
  industry: varchar("industry"),
  professionalDescription: text("professional_description"),
  targetAudience: text("target_audience").array().default([]),
  topics: text("topics").array().default([]),
  goals: text("goals").array().default([]),
  jobTitle: varchar("job_title"),
  companyUrl: varchar("company_url"),
  onboardingStep: integer("onboarding_step").default(1),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  // Profile Studio fields
  creatorArchetype: varchar("creator_archetype"),
  antiValues: text("anti_values").array().default([]),
  toneFormality: integer("tone_formality").default(5),
  toneHumor: integer("tone_humor").default(5),
  toneDepth: integer("tone_depth").default(5),
  toneEmotion: integer("tone_emotion").default(5),
  goldenRules: text("golden_rules"),
  profileStudioCompleted: boolean("profile_studio_completed").notNull().default(false),
  profileStudioLastSection: integer("profile_studio_last_section").default(0),
  // Daily topic suggestions
  topicSuggestions: jsonb("topic_suggestions").$type<TopicSuggestion[]>().default([]),
  suggestionsDate: varchar("suggestions_date"),
  // Cache inteligente - preferências do usuário baseado no histórico
  preferredStructure: varchar("preferred_structure"),
  preferredContentType: varchar("preferred_content_type"),
  lastUsedTemplate: varchar("last_used_template"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Type for topic suggestions
export type TopicSuggestion = {
  id: string;
  title: string;
  angle: string;
  why: string;
};

// Chat message type for session history
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  options?: Array<{ id: string; label: string; description?: string }>;
  isLoading?: boolean;
};

// Posts created by users
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  hook: text("hook").notNull(),
  body: text("body"),
  cta: text("cta"),
  fullContent: text("full_content"),
  structure: varchar("structure").notNull(),
  contentType: varchar("content_type").notNull(),
  score: real("score"),
  hookScore: real("hook_score"),
  structureScore: real("structure_score"),
  dataScore: real("data_score"),
  ctaScore: real("cta_score"),
  algorithmScore: real("algorithm_score"),
  top1Probability: integer("top1_probability"),
  top5Probability: integer("top5_probability"),
  bestPostingDay: varchar("best_posting_day"),
  bestPostingTime: varchar("best_posting_time"),
  profileSnapshot: jsonb("profile_snapshot"),
  feedback: varchar("feedback"),
  // Session history fields
  sessionHistory: jsonb("session_history").$type<ChatMessage[]>().default([]),
  topic: text("topic"),
  objective: text("objective"),
  desiredFeeling: text("desired_feeling"),
  hookOptions: jsonb("hook_options").$type<string[]>().default([]),
  ctaOptions: jsonb("cta_options").$type<string[]>().default([]),
  status: varchar("status").notNull().default("in_progress"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscriptions for payment tracking
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  status: varchar("status").notNull().default("inactive"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  postsUsedThisMonth: integer("posts_used_this_month").notNull().default(0),
  postsLimit: integer("posts_limit").notNull().default(8),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Monthly usage tracking for post limits (doesn't decrease when posts are deleted)
export const monthlyUsage = pgTable("monthly_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  month: varchar("month").notNull(), // Format: "YYYY-MM"
  postsUsed: integer("posts_used").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_monthly_usage_user_month").on(table.userId, table.month),
  sql`CONSTRAINT monthly_usage_user_month_unique UNIQUE (user_id, month)`
]);

// Studio sessions for tracking 7-step workflow state
export const studioSessions = pgTable("studio_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  currentStep: integer("current_step").notNull().default(1),
  briefingData: jsonb("briefing_data"),
  selectedTemplate: varchar("selected_template"),
  selectedStructure: varchar("selected_structure"),
  selectedContentType: varchar("selected_content_type"),
  hooks: jsonb("hooks"),
  selectedHook: text("selected_hook"),
  bodyContent: text("body_content"),
  ctas: jsonb("ctas"),
  selectedCta: text("selected_cta"),
  score: real("score"),
  regenerationCounts: jsonb("regeneration_counts"),
  conversationHistory: jsonb("conversation_history"),
  isCompleted: boolean("is_completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  contentProfile: one(contentProfiles, {
    fields: [users.id],
    references: [contentProfiles.userId],
  }),
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
  posts: many(posts),
  studioSessions: many(studioSessions),
}));

export const contentProfilesRelations = relations(contentProfiles, ({ one }) => ({
  user: one(users, {
    fields: [contentProfiles.userId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const studioSessionsRelations = relations(studioSessions, ({ one }) => ({
  user: one(users, {
    fields: [studioSessions.userId],
    references: [users.id],
  }),
}));

export const monthlyUsageRelations = relations(monthlyUsage, ({ one }) => ({
  user: one(users, {
    fields: [monthlyUsage.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
  totalPosts: true,
  totalRevenue: true,
  firstBillingAmount: true,
  firstBillingDate: true,
  lastBillingAmount: true,
  lastBillingDate: true,
});

// Schema for traffic source data captured on frontend
export const trafficSourceSchema = z.object({
  trafficSource: z.string().optional(),
  trafficMedium: z.string().optional(),
  trafficCampaign: z.string().optional(),
  trafficContent: z.string().optional(),
  trafficTerm: z.string().optional(),
  gclid: z.string().optional(),
  fbclid: z.string().optional(),
}).refine(
  (data) => data.trafficSource || data.gclid || data.fbclid,
  { message: "At least trafficSource, gclid, or fbclid must be provided" }
);

export const insertContentProfileSchema = createInsertSchema(contentProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudioSessionSchema = createInsertSchema(studioSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMonthlyUsageSchema = createInsertSchema(monthlyUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type TrafficSource = z.infer<typeof trafficSourceSchema>;
export type InsertContentProfile = z.infer<typeof insertContentProfileSchema>;
export type ContentProfile = typeof contentProfiles.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertStudioSession = z.infer<typeof insertStudioSessionSchema>;
export type StudioSession = typeof studioSessions.$inferSelect;
export type InsertMonthlyUsage = z.infer<typeof insertMonthlyUsageSchema>;
export type MonthlyUsage = typeof monthlyUsage.$inferSelect;

// Validation schemas for frontend
export const onboardingStep1Schema = z.object({
  language: z.string().min(1, "Language is required"),
});

export const onboardingStep2Schema = z.object({
  industry: z.string().min(1, "Industry is required"),
});

export const onboardingStep3Schema = z.object({
  professionalDescription: z.string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description must be at most 500 characters"),
});

export const onboardingStep4Schema = z.object({
  targetAudience: z.array(z.string())
    .min(1, "At least 1 audience tag is required")
    .max(10, "Maximum 10 audience tags"),
});

export const onboardingStep5Schema = z.object({
  topics: z.array(z.string())
    .min(1, "At least 1 topic is required")
    .max(15, "Maximum 15 topics"),
});

export const onboardingStep6Schema = z.object({
  goals: z.array(z.string())
    .min(1, "Select at least 1 goal")
    .max(3, "Maximum 3 goals"),
});

export const onboardingStep7Schema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  phone: z.string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .max(15, "Telefone deve ter no máximo 15 dígitos"),
  jobTitle: z.string().min(1, "Cargo é obrigatório"),
  companyUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});

export const CONTENT_GOALS = [
  { id: "leads", name: "Generate Leads", description: "Attract potential customers and clients" },
  { id: "authority", name: "Build Authority", description: "Establish yourself as an industry expert" },
  { id: "networking", name: "Expand Network", description: "Connect with like-minded professionals" },
] as const;

// Content types for the studio
export const COPYWRITING_STRUCTURES = [
  { id: "pas", name: "PAS", fullName: "Problem-Agitation-Solution", useCase: "Posts educativos, resolver dor", guidance: "Ideal para educar sua audiência sobre um problema que ela enfrenta. Primeiro apresente o problema, depois amplifique a dor mostrando as consequências, e finalmente ofereça a solução. Use quando quiser criar conexão emocional e posicionar-se como autoridade." },
  { id: "aida", name: "AIDA", fullName: "Attention-Interest-Desire-Action", useCase: "Forte CTA, gerar ação imediata", guidance: "Perfeito para posts com objetivo de conversão. Capture atenção com um gancho forte, gere interesse com benefícios, crie desejo mostrando resultados, e finalize com um CTA claro. Use para lançamentos, ofertas ou quando quer que o leitor tome uma ação específica." },
  { id: "bab", name: "BAB", fullName: "Before-After-Bridge", useCase: "Mostrar transformação", guidance: "Excelente para cases de sucesso e depoimentos. Mostre o 'antes' (situação problemática), o 'depois' (resultado desejado) e a 'ponte' (como chegar lá). Ideal para demonstrar valor tangível e resultados mensuráveis." },
  { id: "fab", name: "FAB", fullName: "Features-Advantages-Benefits", useCase: "Apresentar produtos/serviços", guidance: "Ótimo para apresentar produtos, serviços ou metodologias. Liste características, explique as vantagens de cada uma, e traduza em benefícios reais para o leitor. Use quando precisa explicar algo técnico de forma acessível." },
  { id: "hso", name: "HSO", fullName: "Hook-Story-Offer", useCase: "Narrativas com oferta", guidance: "Combina storytelling com venda sutil. Comece com um gancho irresistível, conte uma história envolvente, e termine com uma oferta natural. Ideal quando quer vender sem parecer vendedor." },
  { id: "storytelling", name: "Storytelling", fullName: "Storytelling", useCase: "Narrativas emocionais", guidance: "Puro poder narrativo. Conte uma história com começo, meio e fim, gerando conexão emocional. Use para compartilhar aprendizados, vulnerabilidades ou momentos marcantes. Gera alto engajamento quando bem executado." },
] as const;

export const CONTENT_TYPES = [
  { id: "how-to", name: "How-to Post", description: "Passo a passo prático", guidance: "Ensine algo específico em passos claros. Ideal quando sua audiência busca resolver um problema prático. Posts how-to têm alta taxa de salvamento." },
  { id: "framework", name: "Framework", description: "Estrutura numerada", guidance: "Crie um modelo mental ou metodologia. Ex: '5 pilares de X'. Posiciona você como pensador original e gera compartilhamentos." },
  { id: "case-study", name: "Case Study", description: "Análise de caso real", guidance: "Analise um caso real com dados e aprendizados. Mostra autoridade e profundidade técnica. Use quando tem exemplos concretos." },
  { id: "story", name: "Story", description: "Narrativa pessoal", guidance: "Compartilhe uma experiência pessoal autêntica. Gera conexão emocional e humaniza sua marca pessoal. Alto engajamento em comentários." },
  { id: "contrarian", name: "Contrarian", description: "Opinião contrária", guidance: "Desafie o senso comum com argumentos sólidos. Gera debate e viralização. Use com cuidado e sempre embase sua opinião." },
  { id: "list", name: "List", description: "Lista de itens", guidance: "Listas são fáceis de consumir e salvar. Ideal para compilar recursos, dicas ou ferramentas. Alta taxa de salvamento." },
  { id: "data-research", name: "Data/Research", description: "Dados e pesquisa", guidance: "Apresente dados, estatísticas ou pesquisas. Posiciona você como fonte confiável. Use quando tem números que surpreendem." },
  { id: "question", name: "Question", description: "Post de pergunta", guidance: "Faça uma pergunta provocativa para gerar discussão. Excelente para aumentar comentários e entender sua audiência." },
  { id: "problem-solution", name: "Problem/Solution", description: "Problema e solução", guidance: "Identifique um problema comum e ofereça uma solução clara. Formato clássico que sempre funciona para conteúdo educativo." },
  { id: "comparison", name: "Comparison", description: "Comparação", guidance: "Compare duas abordagens, ferramentas ou ideias. Ajuda a audiência a tomar decisões. Use quando há dúvidas comuns no mercado." },
  { id: "behind-scenes", name: "Behind the Scenes", description: "Bastidores", guidance: "Mostre o que acontece por trás. Humaniza e gera curiosidade. Ideal para compartilhar processos, rotinas ou decisões." },
  { id: "personal-experience", name: "Personal Experience", description: "Experiência pessoal", guidance: "Compartilhe um aprendizado de vida ou carreira. Vulnerabilidade gera conexão. Use para momentos autênticos." },
  { id: "prediction", name: "Prediction/Trend", description: "Previsão ou tendência", guidance: "Faça previsões sobre o futuro do seu mercado. Posiciona você como visionário. Use quando tem insights únicos." },
  { id: "myth-busting", name: "Myth Busting", description: "Derrubando mitos", guidance: "Desminta crenças populares equivocadas. Gera engajamento e posiciona você como especialista. Use com evidências." },
  { id: "tool-review", name: "Tool Review", description: "Review de ferramenta", guidance: "Avalie uma ferramenta que você usa. Conteúdo útil e prático. Use quando tem experiência real para compartilhar." },
  { id: "lesson-learned", name: "Lesson Learned", description: "Lição aprendida", guidance: "Compartilhe uma lição de um erro ou acerto. Formato autêntico que gera identificação. Ideal para reflexões." },
] as const;

export const LANGUAGES = [
  { id: "pt-BR", name: "Português (Brasil)" },
  { id: "en-US", name: "English (US)" },
  { id: "es", name: "Español" },
] as const;

export const TIMEZONES = [
  { id: "America/Sao_Paulo", name: "Brasília (GMT-3)", offset: -3 },
  { id: "America/New_York", name: "New York (GMT-5)", offset: -5 },
  { id: "America/Los_Angeles", name: "Los Angeles (GMT-8)", offset: -8 },
  { id: "America/Chicago", name: "Chicago (GMT-6)", offset: -6 },
  { id: "Europe/London", name: "London (GMT+0)", offset: 0 },
  { id: "Europe/Paris", name: "Paris (GMT+1)", offset: 1 },
  { id: "Europe/Lisbon", name: "Lisboa (GMT+0)", offset: 0 },
  { id: "Asia/Tokyo", name: "Tokyo (GMT+9)", offset: 9 },
  { id: "Asia/Shanghai", name: "Shanghai (GMT+8)", offset: 8 },
  { id: "Asia/Dubai", name: "Dubai (GMT+4)", offset: 4 },
  { id: "Australia/Sydney", name: "Sydney (GMT+11)", offset: 11 },
  { id: "Pacific/Auckland", name: "Auckland (GMT+13)", offset: 13 },
] as const;

// Profile Studio constants
export const CREATOR_ARCHETYPES = [
  { id: "builder", name: "O Construtor", description: "Mão na massa. Zero PowerPoint, só execução." },
  { id: "thinker", name: "O Pensador", description: "Frameworks, análise profunda, conectando os pontos." },
  { id: "storyteller", name: "O Contador de Histórias", description: "Narrativas autênticas, vulnerabilidade, jornada pessoal." },
  { id: "educator", name: "O Educador", description: "Ensina de verdade, sem vender. Conteúdo denso e útil." },
  { id: "scientist", name: "O Cientista", description: "Dados, experimentos, evidências. Ceticismo saudável." },
  { id: "other", name: "Outro", description: "Defina seu próprio arquétipo." },
] as const;

export const ANTI_VALUES = [
  { id: "self-promotion", label: "Auto-promoção excessiva" },
  { id: "empty-content", label: "Conteúdo vazio / hacks mágicos" },
  { id: "corporate-jargon", label: "Jargão corporativo" },
  { id: "stage-gurus", label: "Gurus de palco vendendo cursos" },
  { id: "no-data", label: "Falta de dados reais" },
  { id: "fake-humility", label: "Falsa humildade" },
  { id: "unrealistic-promises", label: "Promessas irrealistas" },
] as const;

export const BRIEFING_TEMPLATES = [
  { 
    id: "lesson-career", 
    name: "Compartilhar uma lição de carreira", 
    icon: "graduation-cap",
    description: "Conte uma lição importante que você aprendeu na sua trajetória profissional",
    promptHint: "Foque em uma experiência real que gerou aprendizado significativo",
    suggestedFeeling: "reflexão",
    suggestedStructure: "storytelling",
  },
  { 
    id: "announce-achievement", 
    name: "Anunciar uma conquista profissional", 
    icon: "trophy",
    description: "Compartilhe uma vitória, resultado ou marco importante",
    promptHint: "Inclua números, contexto e o que essa conquista significa",
    suggestedFeeling: "inspiração",
    suggestedStructure: "bab",
  },
  { 
    id: "failure-story", 
    name: "Contar uma história de fracasso/aprendizado", 
    icon: "trending-down",
    description: "Seja vulnerável sobre um erro e o que ele te ensinou",
    promptHint: "A vulnerabilidade gera conexão - seja autêntico sobre o fracasso",
    suggestedFeeling: "identificação",
    suggestedStructure: "storytelling",
  },
  { 
    id: "demystify", 
    name: "Desmistificar algo do meu mercado", 
    icon: "lightbulb",
    description: "Quebre um mito ou crença comum da sua indústria",
    promptHint: "Use dados ou experiência para sustentar seu argumento",
    suggestedFeeling: "provocação",
    suggestedStructure: "pas",
  },
  { 
    id: "practical-tip", 
    name: "Dar uma dica prática sobre minha área", 
    icon: "wrench",
    description: "Ensine algo útil que seu público pode aplicar hoje",
    promptHint: "Seja específico e acionável - o leitor deve poder usar imediatamente",
    suggestedFeeling: "confiança",
    suggestedStructure: "fab",
  },
  { 
    id: "market-opinion", 
    name: "Dar minha opinião sobre o mercado", 
    icon: "message-circle",
    description: "Posicione-se sobre uma tendência ou tema relevante",
    promptHint: "Opiniões fortes geram engajamento - seja corajoso",
    suggestedFeeling: "reflexão",
    suggestedStructure: "aida",
  },
  { 
    id: "behind-scenes", 
    name: "Mostrar bastidores do meu trabalho", 
    icon: "eye",
    description: "Dê um glimpse autêntico do dia a dia da sua profissão",
    promptHint: "Humanize sua marca pessoal mostrando o que acontece por trás",
    suggestedFeeling: "curiosidade",
    suggestedStructure: "hso",
  },
  { 
    id: "free-topic", 
    name: "Escrever sobre outro tema", 
    icon: "pencil",
    description: "Escolha um tema livre para o seu post",
    promptHint: "",
    suggestedFeeling: "",
    suggestedStructure: "",
  },
] as const;

export const TONE_SLIDERS = [
  { id: "formality", name: "Formalidade", leftLabel: "Corporativo", rightLabel: "Casual", leftIcon: "suit", rightIcon: "casual" },
  { id: "humor", name: "Humor", leftLabel: "Sério", rightLabel: "Irônico", leftIcon: "serious", rightIcon: "ironic" },
  { id: "depth", name: "Profundidade", leftLabel: "Acessível", rightLabel: "Técnico", leftIcon: "accessible", rightIcon: "technical" },
  { id: "emotion", name: "Emoção", leftLabel: "Racional", rightLabel: "Vulnerável", leftIcon: "rational", rightIcon: "vulnerable" },
] as const;

// Profile Studio validation schema
export const profileStudioSchema = z.object({
  creatorArchetype: z.string().optional(),
  customArchetype: z.string().optional(),
  antiValues: z.array(z.string()).default([]),
  toneFormality: z.number().min(0).max(10).default(5),
  toneHumor: z.number().min(0).max(10).default(5),
  toneDepth: z.number().min(0).max(10).default(5),
  toneEmotion: z.number().min(0).max(10).default(5),
  goldenRules: z.string().max(300).optional(),
  profileStudioCompleted: z.boolean().default(false),
});

export type ProfileStudioData = z.infer<typeof profileStudioSchema>;
