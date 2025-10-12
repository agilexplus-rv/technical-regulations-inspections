# Technical Regulations Inspections

A production-ready inspection app for technical regulations compliance, built with Next.js 14, Supabase, and optimized for Android tablets.

## Features

- **Mobile-First, Tablet-Optimized**: Designed specifically for Android tablets with large touch targets and intuitive navigation
- **Offline-Capable PWA**: Works offline with background sync for evidence uploads
- **Hierarchical RBAC**: Role-based access control with Inspector < Officer < Manager < Admin permissions
- **Secure Authentication**: Supabase email/password with email OTP 2FA
- **AI-Powered Compliance**: Automated compliance checking with multiple AI agents
- **Multi-Language Support**: Bilingual EN/MT with configurable templates
- **GDPR Compliant**: Built-in data retention policies and audit trails

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **PWA**: Service Worker, Offline Cache, Background Sync
- **Email**: Resend for transactional emails
- **Maps**: Google Maps API (optional)
- **AI**: Custom compliance agents for Safety Gate, REACH, CLP, etc.
- **Deployment**: Vercel with Supabase EU region

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Vercel account (for deployment)
- Resend account (for emails)
- Google Maps API key (optional)

### 1. Clone and Install

\`\`\`bash
git clone <repository-url>
cd technical-regulations-inspections
npm install
\`\`\`

### 2. Environment Setup

Copy \`env.example\` to \`.env.local\` and configure:

\`\`\`bash
cp env.example .env.local
\`\`\`

Required environment variables:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email Configuration (Resend)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=triapp@mccaa.org.mt

# Admin Configuration
ADMIN_EMAIL=rudvel@gmail.com

# Optional Integrations
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
SAFETY_GATE_ENABLED=true
SENTIMENT_AI_ENABLED=true
\`\`\`

### 3. Database Setup

Run the Supabase migrations and seed data:

\`\`\`bash
# Apply migrations
supabase db push

# Seed initial data
supabase db seed
\`\`\`

Or manually apply the SQL files in \`supabase/migrations/\` and \`supabase/seed/\`.

### 4. Create Admin User

1. Sign up in Supabase Auth with the admin email
2. Update the user ID in \`supabase/seed/001_initial_data.sql\`
3. Run the seed script again

### 5. Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit \`http://localhost:3000\` and sign in with your admin credentials.

## Project Structure

\`\`\`
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Role-specific dashboards
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── layout/           # Layout components
│   ├── forms/            # Form components
│   ├── inspection/       # Inspection-specific components
│   └── admin/            # Admin console components
├── lib/                  # Utility libraries
│   ├── auth/            # Authentication utilities
│   ├── database/        # Database client and queries
│   ├── integrations/    # External service integrations
│   └── ai/              # AI agent implementations
├── types/               # TypeScript type definitions
└── hooks/               # Custom React hooks

supabase/
├── migrations/          # Database migrations
└── seed/               # Seed data

public/
├── brand/              # Brand assets (logo, etc.)
├── manifest.json       # PWA manifest
├── sw.js              # Service worker
└── offline.html       # Offline page
\`\`\`

## Core Features

### Inspection Flow

1. **Pre-Start Requirements**:
   - GPS location capture and reverse geocoding
   - VAT number verification or "No VAT" checkbox
   - ID document photos (front/back)
   - Facade photo (minimum 1)

2. **Checklist Execution**:
   - Dynamic checklist runner with validation
   - Photo capture with annotation and redaction
   - Barcode/QR scanning (EAN/UPC/GS1/UDI)
   - OCR for product information

3. **AI Compliance Agents**:
   - Label Compliance Agent (GPSR, LVD, EMC, RED, Toys, PPE)
   - Chemicals/Ingredients Agent (REACH Annex XVII, Detergents, CLP)
   - Safety Gate Recall Agent (live recall checking)

4. **Findings & Notices**:
   - Draft findings with severity levels
   - Officer approval workflow
   - Manager signature for notices
   - PDF generation with legal disclaimers

### Role-Based Access Control

- **Inspector**: Own inspections, checklist execution, evidence capture
- **Officer**: Team scope, AI scheduling, checklist creation, notice drafting
- **Manager**: Organization scope, checklist approval, notice signing
- **Admin**: Full system access, user management, integrations, retention policies

### Offline Capabilities

- Service worker with intelligent caching
- Background sync for form submissions
- Offline-first architecture
- Progressive enhancement

### Security & Compliance

- Row Level Security (RLS) policies
- Field-level encryption for PII
- Audit logging for all actions
- GDPR-compliant data retention
- Dual-control for sensitive operations

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Supabase Setup

1. Create new Supabase project in EU region
2. Enable Row Level Security
3. Run migrations and seed data
4. Configure storage buckets for evidence, reports, feedback

### Domain & SSL

- Configure custom domain in Vercel
- SSL certificates are automatically provisioned
- Update \`NEXT_PUBLIC_APP_URL\` environment variable

## Configuration

### Brand Customization

Upload your logo to \`public/brand/logo.png\` and configure brand colors in \`tailwind.config.ts\`.

### Integration Toggles

Configure integrations in the Admin console:

- **Email**: Resend integration for OTP and notifications
- **Google Maps**: Reverse geocoding and location services
- **Safety Gate**: Live recall checking
- **NANDO**: Cached database lookups
- **ICSMS**: Export-only integration
- **Sentiment AI**: Feedback analysis

### Working Days Calendar

Configure Malta public holidays in the Admin console for accurate deadline calculations.

## Testing

### Unit Tests

\`\`\`bash
npm run test
\`\`\`

### Integration Tests

\`\`\`bash
npm run test:integration
\`\`\`

### E2E Tests (Playwright)

\`\`\`bash
npm run test:e2e
\`\`\`

## Monitoring & Analytics

- **Error Tracking**: Sentry integration (optional)
- **Analytics**: Vercel Analytics
- **Performance**: Core Web Vitals monitoring
- **Audit Logs**: Comprehensive action logging

## Support

For technical support or questions:

- Email: triapp@mccaa.org.mt
- Admin: rudvel@gmail.com

## License

Proprietary - Government of Malta Market Surveillance Authority

---

**Built with ❤️ for the Government of Malta Market Surveillance Authority**