import {
  users,
  contentProfiles,
  posts,
  subscriptions,
  studioSessions,
  monthlyUsage,
  waitlistLeads,
  type User,
  type UpsertUser,
  type ContentProfile,
  type InsertContentProfile,
  type Post,
  type InsertPost,
  type Subscription,
  type InsertSubscription,
  type StudioSession,
  type InsertStudioSession,
  type MonthlyUsage,
  type ProfileStudioData,
  type TrafficSource,
  type InsertWaitlistLead,
  type WaitlistLead,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

// Simple in-memory cache with TTL
class SimpleCache<T> {
  private cache = new Map<string, { value: T; expiry: number }>();
  
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    return item.value;
  }
  
  set(key: string, value: T, ttlMs: number = 30000): void {
    this.cache.set(key, { value, expiry: Date.now() + ttlMs });
  }
  
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}

const profileCache = new SimpleCache<ContentProfile>();
const userCache = new SimpleCache<User>();

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string; location?: string }): Promise<User | undefined>;
  updateUserTrafficSource(userId: string, trafficData: TrafficSource): Promise<User | undefined>;
  updateUserLastAccess(userId: string): Promise<void>;
  incrementUserPostCount(userId: string): Promise<void>;
  updateUserBilling(userId: string, amount: number): Promise<void>;

  getContentProfile(userId: string): Promise<ContentProfile | undefined>;
  createContentProfile(profile: InsertContentProfile): Promise<ContentProfile>;
  updateContentProfile(userId: string, data: Partial<InsertContentProfile>): Promise<ContentProfile | undefined>;

  getPosts(userId: string, limit?: number): Promise<Post[]>;
  getPost(id: string, userId: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, userId: string, data: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: string, userId: string): Promise<boolean>;
  updatePostFeedback(id: string, userId: string, feedback: string | null): Promise<Post | undefined>;
  getPostCountThisMonth(userId: string): Promise<number>;
  getActiveSession(userId: string): Promise<Post | undefined>;

  getSubscription(userId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(userId: string, data: Partial<InsertSubscription>): Promise<Subscription | undefined>;

  getStudioSession(userId: string): Promise<StudioSession | undefined>;
  createStudioSession(session: InsertStudioSession): Promise<StudioSession>;
  updateStudioSession(userId: string, data: Partial<InsertStudioSession>): Promise<StudioSession | undefined>;
  deleteStudioSession(userId: string): Promise<boolean>;

  deleteUserAccount(userId: string): Promise<boolean>;

  // Monthly usage methods
  getMonthlyUsage(userId: string, month: string): Promise<MonthlyUsage | undefined>;
  incrementMonthlyUsage(userId: string): Promise<number>;
  getPostsUsedThisMonth(userId: string): Promise<number>;

  // Waitlist methods
  addWaitlistLead(lead: InsertWaitlistLead): Promise<WaitlistLead>;
  getWaitlistCount(): Promise<number>;
  getWaitlistLead(email: string): Promise<WaitlistLead | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    // Check cache first
    const cached = userCache.get(id);
    if (cached) return cached;
    
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (user) {
      userCache.set(id, user, 60000); // Cache for 1 minute
    }
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    userCache.set(userData.id, user, 60000);
    return user;
  }

  async updateUserProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string; location?: string }): Promise<User | undefined> {
    const updateData: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };
    
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.location !== undefined) updateData.location = data.location;
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    if (user) {
      userCache.set(userId, user, 60000);
    }
    return user;
  }

  async updateUserTrafficSource(userId: string, trafficData: TrafficSource): Promise<User | undefined> {
    const [existingUser] = await db.select().from(users).where(eq(users.id, userId));
    if (!existingUser) return undefined;
    
    if (existingUser.trafficSource) {
      return existingUser;
    }

    userCache.invalidate(userId);
    
    const [updated] = await db
      .update(users)
      .set({
        trafficSource: trafficData.trafficSource,
        trafficMedium: trafficData.trafficMedium,
        trafficCampaign: trafficData.trafficCampaign,
        trafficContent: trafficData.trafficContent,
        trafficTerm: trafficData.trafficTerm,
        gclid: trafficData.gclid,
        fbclid: trafficData.fbclid,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (updated) {
      userCache.set(userId, updated, 60000);
    }
    return updated;
  }

  async updateUserLastAccess(userId: string): Promise<void> {
    userCache.invalidate(userId);
    await db
      .update(users)
      .set({
        lastAccessAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async incrementUserPostCount(userId: string): Promise<void> {
    userCache.invalidate(userId);
    await db
      .update(users)
      .set({
        totalPosts: sql`${users.totalPosts} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserBilling(userId: string, amount: number): Promise<void> {
    userCache.invalidate(userId);
    const user = await this.getUser(userId);
    if (!user) return;

    const now = new Date();
    const updateData: Partial<User> = {
      totalRevenue: (user.totalRevenue || 0) + amount,
      lastBillingAmount: amount,
      lastBillingDate: now,
      updatedAt: now,
    };

    if (!user.firstBillingDate) {
      updateData.firstBillingAmount = amount;
      updateData.firstBillingDate = now;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));
  }

  async getContentProfile(userId: string): Promise<ContentProfile | undefined> {
    // Check cache first
    const cached = profileCache.get(userId);
    if (cached) return cached;
    
    const [profile] = await db
      .select()
      .from(contentProfiles)
      .where(eq(contentProfiles.userId, userId));
    
    if (profile) {
      profileCache.set(userId, profile, 60000); // Cache for 1 minute
    }
    return profile;
  }

  async createContentProfile(profile: InsertContentProfile): Promise<ContentProfile> {
    const [created] = await db
      .insert(contentProfiles)
      .values(profile)
      .returning();
    profileCache.set(profile.userId, created, 60000);
    return created;
  }

  async updateContentProfile(userId: string, data: Partial<InsertContentProfile>): Promise<ContentProfile | undefined> {
    profileCache.invalidate(userId); // Invalidate cache on update
    const [updated] = await db
      .update(contentProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contentProfiles.userId, userId))
      .returning();
    if (updated) {
      profileCache.set(userId, updated, 60000);
    }
    return updated;
  }

  async getPosts(userId: string, limit?: number): Promise<Post[]> {
    // If limit is provided, cap the results; otherwise return all (backward compatible)
    const query = db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
    
    if (limit !== undefined) {
      return query.limit(limit);
    }
    
    return query;
  }

  async getPost(id: string, userId: string): Promise<Post | undefined> {
    const [post] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, id), eq(posts.userId, userId)));
    return post;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [created] = await db
      .insert(posts)
      .values(post)
      .returning();
    return created;
  }

  async updatePost(id: string, userId: string, data: Partial<InsertPost>): Promise<Post | undefined> {
    const [updated] = await db
      .update(posts)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(posts.id, id), eq(posts.userId, userId)))
      .returning();
    return updated;
  }

  async deletePost(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(posts)
      .where(and(eq(posts.id, id), eq(posts.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async updatePostFeedback(id: string, userId: string, feedback: string | null): Promise<Post | undefined> {
    const [updated] = await db
      .update(posts)
      .set({ feedback })
      .where(and(eq(posts.id, id), eq(posts.userId, userId)))
      .returning();
    return updated;
  }

  async getPostCountThisMonth(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(
        and(
          eq(posts.userId, userId),
          gte(posts.createdAt, startOfMonth)
        )
      );
    return result[0]?.count ?? 0;
  }

  async getActiveSession(userId: string): Promise<Post | undefined> {
    const [session] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.userId, userId), eq(posts.status, "in_progress")))
      .orderBy(desc(posts.createdAt));
    return session;
  }

  async getSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    return subscription;
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [created] = await db
      .insert(subscriptions)
      .values(subscription)
      .returning();
    return created;
  }

  async updateSubscription(userId: string, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updated] = await db
      .update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.userId, userId))
      .returning();
    return updated;
  }

  async getStudioSession(userId: string): Promise<StudioSession | undefined> {
    const [session] = await db
      .select()
      .from(studioSessions)
      .where(and(eq(studioSessions.userId, userId), eq(studioSessions.isCompleted, false)))
      .orderBy(desc(studioSessions.createdAt));
    return session;
  }

  async createStudioSession(session: InsertStudioSession): Promise<StudioSession> {
    const [created] = await db
      .insert(studioSessions)
      .values(session)
      .returning();
    return created;
  }

  async updateStudioSession(userId: string, data: Partial<InsertStudioSession>): Promise<StudioSession | undefined> {
    const session = await this.getStudioSession(userId);
    if (!session) return undefined;
    
    const [updated] = await db
      .update(studioSessions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(studioSessions.id, session.id))
      .returning();
    return updated;
  }

  async deleteStudioSession(userId: string): Promise<boolean> {
    const session = await this.getStudioSession(userId);
    if (!session) return false;
    
    const result = await db
      .delete(studioSessions)
      .where(eq(studioSessions.id, session.id))
      .returning();
    return result.length > 0;
  }

  async deleteUserAccount(userId: string): Promise<boolean> {
    // Invalidate caches before deletion
    userCache.invalidate(userId);
    profileCache.invalidate(userId);
    
    const result = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();
    return result.length > 0;
  }

  // Monthly usage methods
  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  async getMonthlyUsage(userId: string, month: string): Promise<MonthlyUsage | undefined> {
    const [usage] = await db
      .select()
      .from(monthlyUsage)
      .where(and(eq(monthlyUsage.userId, userId), eq(monthlyUsage.month, month)));
    return usage;
  }

  async incrementMonthlyUsage(userId: string): Promise<number> {
    const month = this.getCurrentMonth();
    
    // Use atomic UPSERT to handle concurrency safely
    // If record exists, increment postsUsed; otherwise create with postsUsed = 1
    const result = await db.execute(sql`
      INSERT INTO monthly_usage (id, user_id, month, posts_used, created_at, updated_at)
      VALUES (gen_random_uuid(), ${userId}, ${month}, 1, NOW(), NOW())
      ON CONFLICT (user_id, month) 
      DO UPDATE SET posts_used = monthly_usage.posts_used + 1, updated_at = NOW()
      RETURNING posts_used
    `);
    
    return (result.rows[0] as { posts_used: number })?.posts_used ?? 1;
  }

  async getPostsUsedThisMonth(userId: string): Promise<number> {
    const month = this.getCurrentMonth();
    const usage = await this.getMonthlyUsage(userId, month);
    return usage?.postsUsed ?? 0;
  }

  // Waitlist methods
  async addWaitlistLead(lead: InsertWaitlistLead): Promise<WaitlistLead> {
    // Determine batch number based on current count
    const count = await this.getWaitlistCount();
    let batchNumber = 1;
    if (count >= 10) batchNumber = 2;
    if (count >= 30) batchNumber = 3;
    if (count >= 60) batchNumber = 4;
    
    const [created] = await db
      .insert(waitlistLeads)
      .values({ ...lead, batchNumber })
      .returning();
    return created;
  }

  async getWaitlistCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(waitlistLeads);
    return result[0]?.count ?? 0;
  }

  async getWaitlistLead(email: string): Promise<WaitlistLead | undefined> {
    const [lead] = await db
      .select()
      .from(waitlistLeads)
      .where(eq(waitlistLeads.email, email));
    return lead;
  }
}

export const storage = new DatabaseStorage();
