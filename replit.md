# VIRALL - LinkedIn Viral Content SaaS

## Overview

VIRALL is a web-based SaaS platform that helps professionals create viral LinkedIn content through a guided 7-step workflow. The system uses AI (Claude API) to generate high-quality posts with predictable viral potential based on analysis of 318,842 real LinkedIn posts. The core value proposition is transforming any professional into a LinkedIn content creator in 10-15 minutes per post, with guaranteed content quality scores of ≥9/10.

**Key Features:**
- Guided content creation workflow (Content Studio)
- AI-powered post generation with quality scoring
- User profile/persona customization (Profile Studio)
- LinkedIn post scheduling and management
- Analytics dashboard for tracking performance

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with Vite for fast development and builds
- **Styling**: Tailwind CSS with custom design tokens (Plus Jakarta Sans font, LinkedIn-inspired blue brand colors, urgency orange, success green)
- **UI Pattern**: Chat-based interface for Content Studio (similar to LLM chat interfaces), with messages flowing continuously and context accumulating naturally
- **Layout Structure**: Three-column layout for Content Studio (sidebar menu, chat area, LinkedIn preview panel)
- **Component Library**: Lucide React for icons

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Design**: RESTful endpoints for authentication, content generation, and analytics
- **AI Integration**: Anthropic Claude API for content generation, with .md files injected as system prompts for frameworks (AIDA, BAB, FAB), viral hooks, and tone guidelines

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Entities**: Users, Posts, Personas, Analytics, Onboarding profiles

### Authentication & Authorization
- Email/Password signup with email verification
- Google OAuth login
- LinkedIn OAuth login
- Session management with 30-day duration
- JWT or Passport.js implementation

### User Journey Flow
1. **Landing Page**: Waitlist signup, pricing display (R$ 97/mês for 12 posts/month)
2. **Auth Pages**: Signup, login, password reset
3. **Onboarding (6 steps)**: Language, Industry, Professional Description, Target Audience, Topics, Qualification
4. **Profile Studio (optional)**: Personality questions, DISC/Big Five tests, profile visualization
5. **Dashboard**: Post management with cards showing hook preview, score badge, date, actions
6. **Content Studio**: 7-step guided chat workflow for post creation

### Content Generation Workflow
The 7-step process includes:
1. Smart topic suggestions based on user profile
2. Copy framework selection (PAS, AIDA, Contrarian, etc.)
3. Content type selection (How-to, Controversy, Behind-the-scenes, etc.)
4. Magnetic hook generation (3 options)
5. Full body creation with personalized tone of voice
6. CTA optimization for saves or leads
7. Score validation with automatic improvement if below 8/10

### Design System
- Primary Brand Color: #0A66C2 (LinkedIn Blue)
- Urgency Color: #FF6B35 (Orange for CTAs and alerts)
- Success Color: #00C853 (Green for social proof and guarantees)
- Premium Dark: #1E1E1E
- Custom animations: pulse-slow, bounce-subtle, slide-up, progress-bar-stripes

## External Dependencies

### Third-Party APIs
- **Anthropic Claude API**: AI content generation (Claude Opus 4.5)
- **LinkedIn OAuth**: Social login and future post publishing integration
- **Google OAuth**: Social login

### Frontend Dependencies
- React 19.x
- Vite for build tooling
- Tailwind CSS for styling
- Lucide React for icons
- React Big Calendar (planned for scheduling)
- Recharts (planned for analytics dashboard)

### Backend Dependencies
- Express.js for API server
- Anthropic SDK for Claude integration
- Passport.js or JWT for authentication
- Drizzle ORM for database operations

### External Services (Planned/Mock)
- LinkedIn API for post publishing (`POST /share`) and analytics (`GET /analytics`)
- Browser extension endpoint (`/api/external/stats`) for future data sync