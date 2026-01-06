CREATE TABLE "content_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"language" varchar DEFAULT 'pt-BR',
	"timezone" varchar DEFAULT 'America/Sao_Paulo',
	"industry" varchar,
	"professional_description" text,
	"target_audience" text[] DEFAULT '{}',
	"topics" text[] DEFAULT '{}',
	"goals" text[] DEFAULT '{}',
	"job_title" varchar,
	"company_url" varchar,
	"whatsapp" varchar,
	"onboarding_step" integer DEFAULT 1,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"creator_archetype" varchar,
	"anti_values" text[] DEFAULT '{}',
	"tone_formality" integer DEFAULT 5,
	"tone_humor" integer DEFAULT 5,
	"tone_depth" integer DEFAULT 5,
	"tone_emotion" integer DEFAULT 5,
	"golden_rules" text,
	"profile_studio_completed" boolean DEFAULT false NOT NULL,
	"profile_studio_last_section" integer DEFAULT 0,
	"topic_suggestions" jsonb DEFAULT '[]'::jsonb,
	"suggestions_date" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"hook" text NOT NULL,
	"body" text,
	"cta" text,
	"full_content" text,
	"structure" varchar NOT NULL,
	"content_type" varchar NOT NULL,
	"score" real,
	"hook_score" real,
	"structure_score" real,
	"data_score" real,
	"cta_score" real,
	"algorithm_score" real,
	"top1_probability" integer,
	"top5_probability" integer,
	"best_posting_day" varchar,
	"best_posting_time" varchar,
	"profile_snapshot" jsonb,
	"feedback" varchar,
	"session_history" jsonb DEFAULT '[]'::jsonb,
	"topic" text,
	"objective" text,
	"desired_feeling" text,
	"hook_options" jsonb DEFAULT '[]'::jsonb,
	"cta_options" jsonb DEFAULT '[]'::jsonb,
	"status" varchar DEFAULT 'in_progress' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"current_step" integer DEFAULT 1 NOT NULL,
	"briefing_data" jsonb,
	"selected_structure" varchar,
	"selected_content_type" varchar,
	"hooks" jsonb,
	"selected_hook" text,
	"body_content" text,
	"ctas" jsonb,
	"selected_cta" text,
	"score" real,
	"regeneration_counts" jsonb,
	"conversation_history" jsonb,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"status" varchar DEFAULT 'inactive' NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"posts_used_this_month" integer DEFAULT 0 NOT NULL,
	"posts_limit" integer DEFAULT 8 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"traffic_source" varchar,
	"traffic_medium" varchar,
	"traffic_campaign" varchar,
	"traffic_content" varchar,
	"traffic_term" varchar,
	"gclid" varchar,
	"fbclid" varchar,
	"last_access_at" timestamp,
	"total_posts" integer DEFAULT 0 NOT NULL,
	"total_revenue" real DEFAULT 0 NOT NULL,
	"first_billing_amount" real,
	"first_billing_date" timestamp,
	"last_billing_amount" real,
	"last_billing_date" timestamp,
	"phone" varchar,
	"location" varchar,
	"company" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "content_profiles" ADD CONSTRAINT "content_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_sessions" ADD CONSTRAINT "studio_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");