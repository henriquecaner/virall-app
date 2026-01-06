# VIRALL - Design System Guidelines

## Overview

VIRALL is a LinkedIn content creation SaaS targeting Brazilian B2B professionals. This design system ensures visual consistency across all interfaces.

---

## Typography

**Primary Font:** Plus Jakarta Sans (Google Fonts)
```
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
```

**Font Weights:**
- Light: 300 (subtle text, captions)
- Regular: 400 (body text)
- Medium: 500 (labels, secondary headings)
- Semi-Bold: 600 (subheadings, buttons)
- Bold: 700 (headings)
- Extra-Bold: 800 (hero headlines, impactful text)

**Hierarchy:**
- **Hero Headlines:** text-4xl md:text-6xl lg:text-7xl, font-extrabold, tracking-tighter, uppercase
- **Section Headers:** text-3xl md:text-5xl, font-extrabold, tracking-tight
- **Card Titles:** text-xl md:text-2xl, font-bold
- **Body Large:** text-lg md:text-xl, font-normal
- **Body Regular:** text-base, font-normal
- **Body Small:** text-sm, font-medium
- **Caption:** text-xs, font-medium, uppercase, tracking-wide

---

## Color Palette

### Brand (LinkedIn Blue)
Primary brand color for identity, links, and main CTAs.

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| brand-50 | 206 68% 96% | #eef6fc | Subtle backgrounds |
| brand-100 | 214 95% 93% | #dbeafe | Light backgrounds |
| brand-200 | 213 97% 87% | #bfdbfe | Borders, dividers |
| brand-300 | 212 96% 78% | #93c5fd | Secondary accents |
| brand-400 | 213 94% 68% | #60a5fa | Interactive hover |
| brand-500 | 217 91% 60% | #3b82f6 | Button hover |
| **brand-600** | **210 88% 40%** | **#0A66C2** | **PRIMARY - LinkedIn Blue** |
| brand-700 | 224 76% 48% | #1d4ed8 | Active states |
| brand-800 | 226 71% 40% | #1e40af | Dark accents |
| brand-900 | 224 64% 33% | #1e3a8a | Darkest brand |

### Urgency (Orange)
For scarcity indicators, alerts, and high-conversion CTAs.

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| urgency-400 | 17 100% 65% | #FF8F61 | Light accent |
| **urgency-500** | **17 100% 60%** | **#FF6B35** | **Primary CTA buttons** |
| urgency-600 | 17 80% 55% | #e85d2e | Button hover |

### Success (Green)
For social proof, guarantees, checkmarks, and positive feedback.

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| success-50 | 142 76% 97% | #f0fdf4 | Light backgrounds |
| success-100 | 141 84% 93% | #dcfce7 | Badges background |
| success-400 | 142 71% 45% | #22c55e | Light accent |
| **success-500** | **145 100% 39%** | **#00C853** | **Primary success color** |
| success-600 | 145 100% 33% | #00a844 | Hover state |
| success-700 | 142 72% 29% | #15803d | Dark accent |

### Dark (Premium Black)
For headings, hero backgrounds, and high-contrast elements.

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| **dark-900** | **0 0% 12%** | **#1E1E1E** | **Hero backgrounds, headings** |
| dark-800 | 0 0% 20% | #333333 | Secondary dark |

---

## Animations

Custom animations for smooth, professional interactions:

| Class | Description | Duration |
|-------|-------------|----------|
| `animate-pulse-slow` | Slow pulsation for attention (non-intrusive) | 3s |
| `animate-bounce-subtle` | Gentle bounce for arrows/indicators | 2s |
| `animate-slide-up` | Slide up entrance (Sticky CTA) | 0.3s |

**Progress Bar Stripes:**
```css
animation: progress-bar-stripes 1s linear infinite;
```

---

## Component Guidelines

### Buttons
- Use shadcn Button component with variants (default, outline, ghost)
- Custom backgrounds allowed with matching border colors
- Never implement custom hover/active states (built-in elevations handle this)

**Primary CTA (Brand):**
```jsx
<Button className="bg-brand-600 text-white border-brand-border">
  Entrar na Lista
</Button>
```

**Urgency CTA:**
```jsx
<Button className="bg-urgency-500 text-white border-urgency-border">
  GARANTIR VAGA
</Button>
```

### Cards
- Use shadcn Card component
- Never nest Card inside Card
- Consistent padding: p-6 to p-8
- Border radius: rounded-xl

### Forms
- Use shadcn Form with useForm/zodResolver
- Use shadcn Input wrapped in FormField/FormControl
- Consistent styling with focus-visible:ring states

### Badges
- Use small size for non-interactive badges
- Color-coded by purpose:
  - Success badges: bg-success-100 text-success-700
  - Urgency badges: bg-urgency-500 text-white
  - Brand badges: bg-brand-100 text-brand-700

---

## Layout System

**Spacing Primitives:** 2, 4, 6, 8, 12, 16, 20, 24 (Tailwind units)

**Section Spacing:**
- Landing sections: py-16 md:py-24
- Component gaps: gap-4, gap-6, gap-8
- Container: container mx-auto px-4

**Container Widths:**
- Landing hero: max-w-5xl
- Form containers: max-w-2xl
- FAQ sections: max-w-3xl

---

## Dark Mode

Colors are configured for both light and dark modes. Dark mode uses:
- Elevated brand colors for visibility
- Adjusted success/urgency for better contrast
- Background: 0 0% 6% (near-black)

---

## Accessibility

- Focus states: Visible ring on all interactive elements
- Color contrast: Minimum 4.5:1 for text
- Interactive elements: hover-elevate utility class
- Form validation: FormMessage for error feedback

---

## References

**Design Influences:**
- Linear: Clean typography, subtle interactions
- Notion: Intuitive workspace feel
- Stripe: Trust-building elements
- LinkedIn: Professional B2B aesthetic

**Core Principles:**
1. Professional credibility (targeting LinkedIn professionals)
2. Clarity over decoration (productivity tool)
3. Progressive disclosure (complex workflow made simple)
4. Trust indicators (318,842+ posts analyzed)
