# LinkedIn Viral Content SaaS

## Overview

A web-based SaaS platform that helps professionals create viral LinkedIn content through a guided 7-step workflow. The system uses Claude AI to generate high-quality content with a minimum score of 9, transforming any professional into a LinkedIn content creator in 10-15 minutes per post.

**Core Value Proposition:** Data-driven viral content creation based on analysis of 318,842 real LinkedIn posts.

**Target Language:** Portuguese (Brazil) - Primary interface language is pt-BR

## Recent Changes (December 23, 2025)

### Typography System Update
New typography hierarchy implemented for neo-brutalist design:

**Font Stack:**
- **Satoshi** (via Fontshare CDN): All headings (H1-H6), display text, and bold text on colored backgrounds
- **Roboto** (via Google Fonts): Body text and general content

**CSS Implementation:**
- `.font-display` → Satoshi font family for display/heading text
- `.font-body` → Roboto font family for body text
- `.text-on-color` → Satoshi Bold for text on colored backgrounds (buttons, badges, numbered indicators)

**Usage Guidelines:**
- All CTAs and buttons with colored backgrounds use `text-on-color` class
- Headings use `font-display` class with appropriate weights
- Body text inherits Roboto from root element

## Previous Changes (December 22, 2025)

### Landing Page UI/UX Improvements
Comprehensive redesign maintaining flat design aesthetic with LinkedIn Blue branding:

**Hero Section:**
- Added scroll progress indicator (3px gradient bar at top)
- Implemented staggered fade-in animations for content elements
- Improved form styling with backdrop blur and enhanced shadows
- Reduced typography sizes for better mobile readability
- Optimized smooth scroll duration from 1200ms to 800ms

**Navbar:**
- Added CTA button ("Garantir Vaga") in desktop view
- Smooth slide-down animation for mobile menu
- Enhanced touch targets (44px minimum) for mobile
- Added CTA in mobile menu

**Pain Points Section:**
- Removed colored side borders for cleaner flat design
- Added hover lift effect with shadow transition
- Icon scale animation on card hover
- Improved spacing and typography for mobile

**Solution Section:**
- Minimalist timeline design with subtle gradient line
- Cleaner step indicators with smaller dimensions
- Improved icon styling with border-based approach
- Better spacing between steps

**Bonuses Section:**
- Converted to 2x3 grid layout for better desktop utilization
- Compact card design with inline value badges
- Hover lift effect with icon scaling
- Improved mobile responsiveness

**Comparison Cards (Social Proof):**
- Horizontal scroll carousel on mobile with snap points
- Hide scrollbar utility for cleaner look
- "Swipe to see all options" helper text on mobile

**Mobile Optimizations:**
- Safe-area support for iPhone notch (sticky CTA)
- Minimum 44px touch targets throughout
- Responsive typography adjustments
- Backdrop blur on sticky elements

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React with TypeScript
- **Routing:** Wouter (lightweight React router)
- **State Management:** TanStack React Query for server state
- **Styling:** Tailwind CSS with shadcn/ui component library
- **Build Tool:** Vite with hot module replacement
- **Theme:** Light/dark mode support with LinkedIn-inspired blue color scheme

### Backend Architecture
- **Runtime:** Node.js with Express
- **Language:** TypeScript with ESM modules
- **API Pattern:** RESTful endpoints under `/api/*`
- **Authentication:** Replit Auth with OpenID Connect, session-based with PostgreSQL session store
- **AI Integration:** Anthropic Claude API (claude-sonnet-4-5-20250514) for content generation

### Database Design
- **ORM:** Drizzle ORM with PostgreSQL
- **Schema Location:** `shared/schema.ts`
- **Key Tables:**
  - `users` - User accounts (Replit Auth integration)
  - `sessions` - Session storage for authentication
  - `contentProfiles` - User onboarding data (language, industry, audience, topics)
  - `posts` - Generated LinkedIn posts with scores
  - `subscriptions` - User subscription status
  - `studioSessions` - In-progress content creation sessions

### Application Flow
1. **Landing Page (/)** - Marketing page with pricing (R$ 97/month for 12 posts)
2. **Authentication** - Replit OAuth flow
3. **Onboarding (/onboarding)** - 6-step profile setup (required before app access)
4. **Dashboard (/dashboard)** - Post management with score badges
5. **Studio (/studio)** - 7-step AI-guided content creation workflow
6. **Settings (/settings)** - Profile and account management

### Content Generation Workflow
The studio implements a chat-like interface with 7 steps:
1. Briefing (template selection + topic input)
   - Step 0: Template selection (8 content types)
   - Step 1: Topic input (with AI-generated suggestions based on template)
   - Step 2: Objective and audience
   - Step 3: Desired feeling
2. Copywriting Structure selection
3. Content Type selection
4. Hook generation (3 options, regeneration available)
5. Body generation
6. CTA generation (3 options, regeneration available)
7. Validation and scoring (minimum score 9 required to save)

### Briefing Templates (BRIEFING_TEMPLATES in schema.ts)
Available content templates that guide AI suggestion generation:
- **lesson-career**: Lição de carreira (storytelling structure)
- **announce-achievement**: Conquista profissional (before-after-bridge structure)
- **failure-story**: História de fracasso/aprendizado (storytelling structure)
- **demystify**: Desmistificar mito do mercado (PAS structure)
- **practical-tip**: Dica prática acionável (FAB structure)
- **market-opinion**: Opinião sobre mercado (AIDA structure)
- **behind-scenes**: Bastidores do trabalho (HSO structure)
- **free-topic**: Tema livre (no constraints)

### LinkedIn Preview Component
Real-time post preview with LinkedIn-style UI including:
- Avatar with user initials
- Profile name and headline placeholder
- Character count and estimated read time
- Engagement buttons (like, comment, share, send)
- Score badge and best posting time predictions

### Design System
- **Typography:** Inter font family
- **Component Library:** shadcn/ui (New York style)
- **Design References:** Linear, Notion, Claude.ai, Stripe
- **Principles:** Professional credibility, clarity over decoration, progressive disclosure

## External Dependencies

### AI Services
- **Anthropic Claude API** - Content generation (hooks, body, CTAs, scoring)
  - Environment: `AI_INTEGRATIONS_ANTHROPIC_API_KEY`, `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`

### Database
- **PostgreSQL** - Primary data store
  - Environment: `DATABASE_URL`
  - Migrations managed via Drizzle Kit (`npm run db:push`)

### Authentication
- **Replit Auth (OpenID Connect)** - User authentication
  - Environment: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`

### Key NPM Packages
- `@anthropic-ai/sdk` - Claude AI integration
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `express-session` / `connect-pg-simple` - Session management
- `passport` / `openid-client` - Authentication
- `@tanstack/react-query` - Data fetching
- `react-hook-form` / `zod` - Form handling and validation

## Product Analytics System

### Overview
Comprehensive analytics tracking across GA4, Google Ads, and Meta Pixel with enriched context data for cohort retention analysis.

### Environment Variables
- `VITE_GA_MEASUREMENT_ID` - Google Analytics 4 Measurement ID (e.g., G-XXXXXXXXXX)
- `VITE_GOOGLE_ADS_ID` - Google Ads Conversion ID (e.g., AW-XXXXXXXXX)
- `VITE_META_PIXEL_ID` - Meta Pixel ID (e.g., XXXXXXXXXXXXXXXX)

### Enriched Data Collection
Every event includes:
- **User ID**: Persistent UUID stored in localStorage for cohort analysis
- **Session ID**: UUID per browser session in sessionStorage
- **Timestamp**: ISO 8601 format for each event
- **Geolocation**: Country, state, city, timezone (via ipapi.co HTTPS API)
- **Device**: Type (mobile/tablet/desktop), OS, browser, screen size, viewport, language, touch capability
- **Traffic Source**: UTM parameters, auto-detected source, first-touch attribution, landing page

### Event Queue System
Synchronous events (button clicks, copy actions) are queued until enriched context is ready:
1. `initAllAnalytics()` fetches geo/device/traffic data
2. `markContextReady()` flushes queued events with full context
3. Ensures NO events fire without complete enriched data

### Implementation Files
- `client/src/lib/analytics.ts` - Core analytics functions and context management
- `client/src/hooks/use-analytics.tsx` - React hook for automatic page tracking
- `client/src/App.tsx` - Analytics initialization and provider
- `client/env.d.ts` - TypeScript declarations for gtag and fbq

### Adding New Events
For synchronous events, use the queue/gating pattern:
```typescript
// Internal function (called when context is ready)
const trackMyEventInternal = (param: string) => {
  const context = getEnrichedContextSync();
  // GA4 and Meta Pixel tracking...
};

// Public function (queues if context not ready)
export const trackMyEvent = (param: string) => {
  if (contextReady) {
    trackMyEventInternal(param);
  } else {
    eventQueue.push({ type: 'my_event', args: [param] });
  }
};
```

## User Tracking System (Conversion API Integration)

### Overview
Server-side user tracking system for integration with Meta and Google Conversion APIs, capturing traffic source, ads identifiers, and user lifecycle data for LTV-based conversion optimization.

### Database Fields (users table)
Traffic Source (GA4 compliant):
- `trafficSource` - Source classification (direct, organic, social, referral, paid)
- `trafficMedium` - Medium type (organic, cpc, referral, social, email, etc.)
- `trafficCampaign` - Campaign name from utm_campaign
- `trafficContent` - Content variant from utm_content
- `trafficTerm` - Search term from utm_term

Ads Identifiers:
- `gclid` - Google Click ID for Google Ads attribution
- `fbclid` - Facebook Click ID for Meta Ads attribution

User Lifecycle:
- `createdAt` - Account creation timestamp
- `lastAccessAt` - Last login/access timestamp
- `totalPosts` - Total posts created (incremented on post creation)
- `totalRevenue` - Cumulative revenue from user (Stripe integration ready)
- `firstBillingAmount/Date` - First payment details
- `lastBillingAmount/Date` - Most recent payment details

User Profile:
- `phone` - Phone number for WhatsApp/SMS
- `location` - City/State/Country
- `company` - Company name

### Implementation Files
- `client/src/lib/trafficTracking.ts` - Frontend capture of UTMs and click IDs
- `server/storage.ts` - Backend methods for user data updates
- `server/routes.ts` - API endpoint `/api/user/traffic-source`
- `client/src/hooks/useAuth.ts` - Sends traffic data on authentication

### Traffic Capture Flow
1. User lands on site with UTM parameters or click IDs
2. `captureTrafficSource()` runs on first visit (App.tsx)
3. Data stored in localStorage with first-touch attribution
4. On user authentication, data sent to backend via POST `/api/user/traffic-source`
5. Backend only saves if user doesn't already have traffic source data

### Billing Updates (Stripe Ready)
When Stripe integration is added, call `storage.updateUserBilling()` with:
```typescript
await storage.updateUserBilling(userId, {
  amount: paymentAmount,
  date: new Date()
});
```
This automatically handles first vs. subsequent payments and accumulates totalRevenue.