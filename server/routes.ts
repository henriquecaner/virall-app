import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  generateHooks,
  generateBody,
  generateCTAs,
  scorePost,
  regenerateHook,
  regenerateCTA,
  generateTopicSuggestions,
  refineContent,
  type ContentType,
} from "./anthropic";
import {
  insertContentProfileSchema,
  insertPostSchema,
  insertWaitlistLeadSchema,
  COPYWRITING_STRUCTURES,
  CONTENT_TYPES,
  CREATOR_ARCHETYPES,
  ANTI_VALUES,
  TONE_SLIDERS,
  profileStudioSchema,
  trafficSourceSchema,
} from "@shared/schema";
import { z } from "zod";

const POSTS_LIMIT_PER_MONTH = 8;

function calculateProfileCompleteness(profile: any): number {
  let score = 0;
  const fields = [
    profile.industry,
    profile.professionalDescription,
    profile.targetAudience?.length > 0,
    profile.topics?.length > 0,
    profile.jobTitle,
    profile.creatorArchetype,
    profile.antiValues && profile.antiValues.length > 0,
    profile.goldenRules,
  ];
  
  fields.forEach(field => {
    if (field) score += 12.5;
  });
  
  return Math.round(score);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  // Public waitlist endpoints (no auth required)
  app.get("/api/waitlist/count", async (req, res) => {
    try {
      const count = await storage.getWaitlistCount();
      res.json({ count, spotsRemaining: Math.max(0, 100 - count) });
    } catch (error) {
      console.error("Error getting waitlist count:", error);
      res.status(500).json({ message: "Failed to get waitlist count" });
    }
  });

  app.post("/api/waitlist", async (req, res) => {
    try {
      const validation = insertWaitlistLeadSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid email", 
          errors: validation.error.errors 
        });
      }

      // Check if email already exists
      const existing = await storage.getWaitlistLead(validation.data.email);
      if (existing) {
        return res.status(409).json({ 
          message: "Email already on waitlist",
          lead: existing
        });
      }

      const lead = await storage.addWaitlistLead(validation.data);
      const count = await storage.getWaitlistCount();
      
      res.status(201).json({ 
        success: true, 
        lead,
        count,
        spotsRemaining: Math.max(0, 100 - count)
      });
    } catch (error) {
      console.error("Error adding to waitlist:", error);
      res.status(500).json({ message: "Failed to join waitlist" });
    }
  });

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const profile = await storage.getContentProfile(userId);
      
      storage.updateUserLastAccess(userId).catch(console.error);
      
      res.json({ ...user, hasProfile: !!profile?.onboardingCompleted });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/user/traffic-source", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validation = trafficSourceSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid traffic source data", 
          errors: validation.error.errors 
        });
      }

      const user = await storage.updateUserTrafficSource(userId, validation.data);
      res.json({ success: true, user });
    } catch (error) {
      console.error("Error saving traffic source:", error);
      res.status(500).json({ message: "Failed to save traffic source" });
    }
  });

  const userProfileSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
  });

  app.patch("/api/user/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validation = userProfileSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid profile data", 
          errors: validation.error.errors 
        });
      }

      const user = await storage.updateUserProfile(userId, validation.data);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getContentProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  const completeProfileSchema = z.object({
    language: z.string().min(1),
    industry: z.string().min(1),
    professionalDescription: z.string().min(20).max(500),
    targetAudience: z.array(z.string()).min(1).max(10),
    topics: z.array(z.string()).min(1).max(15),
    goals: z.array(z.string()).min(1).max(3),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().min(10).max(15),
    jobTitle: z.string().min(1),
    companyUrl: z.string().url().optional().or(z.literal("")),
    onboardingCompleted: z.boolean().optional(),
  });

  app.post("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validation = completeProfileSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid profile data", 
          errors: validation.error.errors 
        });
      }

      const { firstName, lastName, phone, ...profileData } = validation.data;
      
      await storage.updateUserProfile(userId, {
        firstName,
        lastName,
        phone,
      });

      const existing = await storage.getContentProfile(userId);

      if (existing) {
        const updated = await storage.updateContentProfile(userId, {
          ...profileData,
          onboardingCompleted: true,
        });
        return res.json(updated);
      }

      const profile = await storage.createContentProfile({
        userId,
        ...profileData,
        onboardingCompleted: true,
      });
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating/updating profile:", error);
      res.status(500).json({ message: "Failed to save profile" });
    }
  });

  app.patch("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updated = await storage.updateContentProfile(userId, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.patch("/api/profile/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const existing = await storage.getContentProfile(userId);

      if (existing) {
        const updated = await storage.updateContentProfile(userId, req.body);
        return res.json(updated);
      }

      const profile = await storage.createContentProfile({
        userId,
        ...req.body,
        onboardingCompleted: false,
      });
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error saving onboarding progress:", error);
      res.status(500).json({ message: "Failed to save progress" });
    }
  });

  app.get("/api/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      
      // Optional limit, capped at 100 when provided
      const safeLimit = limit !== undefined ? Math.min(Math.max(1, limit), 100) : undefined;
      
      const posts = await storage.getPosts(userId, safeLimit);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const post = await storage.getPost(req.params.id, userId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post("/api/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Use monthly usage tracking (doesn't decrease when posts are deleted)
      const postsUsed = await storage.getPostsUsedThisMonth(userId);
      if (postsUsed >= POSTS_LIMIT_PER_MONTH) {
        return res.status(403).json({
          message: `Limite de ${POSTS_LIMIT_PER_MONTH} posts por mes atingido`,
        });
      }

      const profile = await storage.getContentProfile(userId);
      const profileSnapshot = profile
        ? {
            industry: profile.industry,
            jobTitle: profile.jobTitle,
            targetAudience: profile.targetAudience,
            topics: profile.topics,
          }
        : null;

      const post = await storage.createPost({
        userId,
        ...req.body,
        profileSnapshot,
      });

      // Increment monthly usage counter (permanent, doesn't reset on delete)
      try {
        await storage.incrementMonthlyUsage(userId);
      } catch (err) {
        console.error("Failed to increment monthly usage:", err);
      }

      try {
        await storage.incrementUserPostCount(userId);
      } catch (err) {
        console.error("Failed to increment post count:", err);
      }

      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // Update an existing post/session
  app.patch("/api/posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updated = await storage.updatePost(req.params.id, userId, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  // Get active session (post in progress)
  app.get("/api/session/active", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await storage.getActiveSession(userId);
      res.json(session || null);
    } catch (error) {
      console.error("Error fetching active session:", error);
      res.status(500).json({ message: "Failed to fetch active session" });
    }
  });

  app.delete("/api/posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deletePost(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  app.patch("/api/posts/:id/feedback", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { feedback } = req.body;
      
      if (feedback !== "up" && feedback !== "down" && feedback !== null) {
        return res.status(400).json({ message: "Invalid feedback value" });
      }
      
      const updated = await storage.updatePostFeedback(req.params.id, userId, feedback);
      if (!updated) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating post feedback:", error);
      res.status(500).json({ message: "Failed to update feedback" });
    }
  });

  app.post("/api/posts/:id/clone", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Use monthly usage tracking (consistent with create post endpoint)
      const postsUsed = await storage.getPostsUsedThisMonth(userId);
      if (postsUsed >= POSTS_LIMIT_PER_MONTH) {
        return res.status(403).json({
          message: `Limite de ${POSTS_LIMIT_PER_MONTH} posts por mes atingido`,
        });
      }

      const original = await storage.getPost(req.params.id, userId);
      if (!original) {
        return res.status(404).json({ message: "Post not found" });
      }

      const profile = await storage.getContentProfile(userId);
      const profileSnapshot = profile
        ? {
            industry: profile.industry,
            jobTitle: profile.jobTitle,
            targetAudience: profile.targetAudience,
            topics: profile.topics,
          }
        : null;

      const clonedPost = await storage.createPost({
        userId,
        hook: original.hook,
        body: original.body,
        cta: original.cta,
        fullContent: original.fullContent,
        structure: original.structure,
        contentType: original.contentType,
        score: original.score,
        hookScore: original.hookScore,
        structureScore: original.structureScore,
        dataScore: original.dataScore,
        ctaScore: original.ctaScore,
        algorithmScore: original.algorithmScore,
        top1Probability: original.top1Probability,
        top5Probability: original.top5Probability,
        bestPostingDay: original.bestPostingDay,
        bestPostingTime: original.bestPostingTime,
        profileSnapshot,
      });

      // Increment monthly usage counter (consistent with create post endpoint)
      try {
        await storage.incrementMonthlyUsage(userId);
      } catch (err) {
        console.error("Failed to increment monthly usage:", err);
      }

      try {
        await storage.incrementUserPostCount(userId);
      } catch (err) {
        console.error("Failed to increment post count:", err);
      }

      res.status(201).json(clonedPost);
    } catch (error) {
      console.error("Error cloning post:", error);
      res.status(500).json({ message: "Failed to clone post" });
    }
  });

  app.get("/api/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let subscription = await storage.getSubscription(userId);

      if (!subscription) {
        subscription = await storage.createSubscription({
          userId,
          status: "active",
          postsUsedThisMonth: 0,
          postsLimit: POSTS_LIMIT_PER_MONTH,
        });
      }

      // Use monthly usage tracking (doesn't decrease when posts are deleted)
      const postsUsed = await storage.getPostsUsedThisMonth(userId);

      res.json({
        ...subscription,
        postsUsedThisMonth: postsUsed,
        postsRemaining: Math.max(0, POSTS_LIMIT_PER_MONTH - postsUsed),
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Daily topic suggestions based on user profile and template
  app.get("/api/studio/suggestions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templateId = req.query.template as string || "";
      const profile = await storage.getContentProfile(userId);

      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Get today's date in user's timezone (default to Sao Paulo)
      const today = new Date().toISOString().split("T")[0];
      
      // Create cache key based on date and template
      const cacheKey = `${today}:${templateId}`;
      const cachedSuggestions = profile.topicSuggestions as { key?: string; data?: any[] } | any[];
      
      // Check if we have cached suggestions for this template today
      if (cachedSuggestions && typeof cachedSuggestions === 'object' && !Array.isArray(cachedSuggestions) && cachedSuggestions.key === cacheKey && cachedSuggestions.data) {
        return res.json({
          suggestions: cachedSuggestions.data,
          isNew: false,
          profileCompleteness: calculateProfileCompleteness(profile),
        });
      }

      // Generate new suggestions with template context
      const suggestions = await generateTopicSuggestions({
        industry: profile.industry || "",
        professionalDescription: profile.professionalDescription || "",
        targetAudience: profile.targetAudience || [],
        topics: profile.topics || [],
        jobTitle: profile.jobTitle || "",
        language: profile.language || "pt-BR",
        creatorArchetype: profile.creatorArchetype,
        antiValues: profile.antiValues || [],
        toneFormality: profile.toneFormality ?? 5,
        toneHumor: profile.toneHumor ?? 5,
        toneDepth: profile.toneDepth ?? 5,
        toneEmotion: profile.toneEmotion ?? 5,
        goldenRules: profile.goldenRules,
        templateId: templateId, // Pass template to customize suggestions
      });

      // Save suggestions to profile with template key
      await storage.updateContentProfile(userId, {
        topicSuggestions: { key: cacheKey, data: suggestions },
        suggestionsDate: today,
      });

      res.json({
        suggestions,
        isNew: true,
        profileCompleteness: calculateProfileCompleteness(profile),
      });
    } catch (error) {
      console.error("Error generating topic suggestions:", error);
      res.status(500).json({ message: "Failed to generate suggestions" });
    }
  });

  app.get("/api/studio/session", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await storage.getStudioSession(userId);
      res.json(session || null);
    } catch (error) {
      console.error("Error fetching studio session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  app.post("/api/studio/session", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      await storage.deleteStudioSession(userId);

      const session = await storage.createStudioSession({
        userId,
        currentStep: 1,
        isCompleted: false,
      });

      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating studio session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.patch("/api/studio/session", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updated = await storage.updateStudioSession(userId, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating studio session:", error);
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  app.delete("/api/studio/session", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteStudioSession(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting studio session:", error);
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  const generateSchema = z.object({
    step: z.number(),
    data: z.object({
      topic: z.string().optional(),
      objective: z.string().optional(),
      desiredFeeling: z.string().optional(),
      structure: z.string().optional(),
      contentType: z.string().optional(),
      hook: z.string().optional(),
      body: z.string().optional(),
      cta: z.string().optional(),
      profile: z.any().optional(),
      regenerate: z.boolean().optional(),
      previousHooks: z.array(z.string()).optional(),
      previousCTAs: z.array(z.string()).optional(),
    }),
  });

  app.post("/api/studio/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getContentProfile(userId);

      if (!profile?.onboardingCompleted) {
        return res.status(400).json({ message: "Profile not completed" });
      }

      const { step, data } = generateSchema.parse(req.body);
      const profileContext = {
        industry: profile.industry || "",
        professionalDescription: profile.professionalDescription || "",
        targetAudience: profile.targetAudience || [],
        topics: profile.topics || [],
        jobTitle: profile.jobTitle || "",
        language: profile.language || "pt-BR",
        creatorArchetype: profile.creatorArchetype,
        antiValues: profile.antiValues || [],
        toneFormality: profile.toneFormality ?? 5,
        toneHumor: profile.toneHumor ?? 5,
        toneDepth: profile.toneDepth ?? 5,
        toneEmotion: profile.toneEmotion ?? 5,
        goldenRules: profile.goldenRules,
      };

      let result: any = {};

      switch (step) {
        case 4: {
          const hooks = await generateHooks(
            profileContext,
            data.topic!,
            data.structure!,
            data.contentType!,
            data.objective,
            data.desiredFeeling
          );
          result = { hooks };
          break;
        }

        case 5: {
          const body = await generateBody(
            profileContext,
            data.topic!,
            data.structure!,
            data.contentType!,
            data.hook!,
            data.objective,
            data.desiredFeeling
          );
          result = { body };
          break;
        }

        case 6: {
          const ctas = await generateCTAs(
            profileContext,
            data.body!,
            data.hook!,
            data.objective,
            data.desiredFeeling
          );
          result = { ctas };
          break;
        }

        case 7: {
          const scoreResult = await scorePost(
            data.hook!,
            data.body!,
            data.cta!,
            data.structure!,
            data.contentType!
          );
          result = {
            score: scoreResult.score,
            scores: {
              hook: scoreResult.hookScore,
              structure: scoreResult.structureScore,
              data: scoreResult.dataScore,
              cta: scoreResult.ctaScore,
              algorithm: scoreResult.algorithmScore,
            },
            predictions: {
              top1: scoreResult.top1Probability,
              top5: scoreResult.top5Probability,
              bestDay: scoreResult.bestPostingDay,
              bestTime: scoreResult.bestPostingTime,
            },
          };
          break;
        }

        default:
          return res.status(400).json({ message: "Invalid step" });
      }

      res.json(result);
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ message: "Failed to generate content" });
    }
  });

  const refineSchema = z.object({
    contentType: z.enum(["hook", "body", "cta"]),
    currentContent: z.string(),
    instruction: z.string(),
    context: z.object({
      topic: z.string().optional(),
      hook: z.string().optional(),
      body: z.string().optional(),
    }).optional(),
  });

  app.post("/api/studio/refine", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getContentProfile(userId);

      if (!profile?.onboardingCompleted) {
        return res.status(400).json({ message: "Profile not completed" });
      }

      const { contentType, currentContent, instruction, context } = refineSchema.parse(req.body);
      const profileContext = {
        industry: profile.industry || "",
        professionalDescription: profile.professionalDescription || "",
        targetAudience: profile.targetAudience || [],
        topics: profile.topics || [],
        jobTitle: profile.jobTitle || "",
        language: profile.language || "pt-BR",
        creatorArchetype: profile.creatorArchetype,
        antiValues: profile.antiValues || [],
        toneFormality: profile.toneFormality ?? 5,
        toneHumor: profile.toneHumor ?? 5,
        toneDepth: profile.toneDepth ?? 5,
        toneEmotion: profile.toneEmotion ?? 5,
        goldenRules: profile.goldenRules,
      };

      const refinedContent = await refineContent(
        profileContext,
        contentType as ContentType,
        currentContent,
        instruction,
        context
      );

      res.json({ refinedContent });
    } catch (error) {
      console.error("Error refining content:", error);
      res.status(500).json({ message: "Failed to refine content" });
    }
  });

  app.delete("/api/account", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteUserAccount(userId);

      req.logout(() => {
        res.json({ success: true });
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Profile Studio endpoints
  app.get("/api/profile-studio", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getContentProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      res.json({
        creatorArchetype: profile.creatorArchetype,
        antiValues: profile.antiValues || [],
        toneFormality: profile.toneFormality ?? 5,
        toneHumor: profile.toneHumor ?? 5,
        toneDepth: profile.toneDepth ?? 5,
        toneEmotion: profile.toneEmotion ?? 5,
        goldenRules: profile.goldenRules || "",
        profileStudioCompleted: profile.profileStudioCompleted,
        profileStudioLastSection: profile.profileStudioLastSection ?? 0,
      });
    } catch (error) {
      console.error("Error fetching profile studio:", error);
      res.status(500).json({ message: "Failed to fetch profile studio" });
    }
  });

  app.put("/api/profile-studio", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validation = profileStudioSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: validation.error.errors 
        });
      }

      const data = validation.data;
      const updated = await storage.updateContentProfile(userId, {
        creatorArchetype: data.creatorArchetype,
        antiValues: data.antiValues,
        toneFormality: data.toneFormality,
        toneHumor: data.toneHumor,
        toneDepth: data.toneDepth,
        toneEmotion: data.toneEmotion,
        goldenRules: data.goldenRules,
        profileStudioCompleted: data.profileStudioCompleted,
      });

      if (!updated) {
        return res.status(404).json({ message: "Profile not found" });
      }

      res.json({ success: true, saved: true });
    } catch (error) {
      console.error("Error updating profile studio:", error);
      res.status(500).json({ message: "Failed to update profile studio" });
    }
  });

  app.patch("/api/profile-studio/section", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { section } = req.body;
      
      if (typeof section !== "number" || section < 0 || section > 3) {
        return res.status(400).json({ message: "Invalid section number" });
      }

      const updated = await storage.updateContentProfile(userId, {
        profileStudioLastSection: section,
      });

      if (!updated) {
        return res.status(404).json({ message: "Profile not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating profile studio section:", error);
      res.status(500).json({ message: "Failed to update section" });
    }
  });

  app.get("/api/constants", (req, res) => {
    res.json({
      structures: COPYWRITING_STRUCTURES,
      contentTypes: CONTENT_TYPES,
      postsLimit: POSTS_LIMIT_PER_MONTH,
      minScore: MIN_SCORE_TO_SAVE,
    });
  });

  app.get("/api/profile-studio/constants", (req, res) => {
    res.json({
      archetypes: CREATOR_ARCHETYPES,
      antiValues: ANTI_VALUES,
      toneSliders: TONE_SLIDERS,
    });
  });

  // Analytics configuration endpoint (public - no auth required)
  app.get("/api/analytics/config", (req, res) => {
    res.json({
      ga_measurement_id: process.env.VITE_GA_MEASUREMENT_ID || '',
      google_ads_id: process.env.VITE_GOOGLE_ADS_ID || '',
      meta_pixel_id: process.env.VITE_META_PIXEL_ID || '',
      google_ads_signup_label: process.env.VITE_GOOGLE_ADS_SIGNUP_LABEL || '',
      google_ads_content_label: process.env.VITE_GOOGLE_ADS_CONTENT_LABEL || '',
      google_ads_purchase_label: process.env.VITE_GOOGLE_ADS_PURCHASE_LABEL || '',
      google_ads_churn_label: process.env.VITE_GOOGLE_ADS_CHURN_LABEL || '',
    });
  });

  return httpServer;
}
