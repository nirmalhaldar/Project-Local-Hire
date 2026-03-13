# LocalHire

![LocalHire Logo](./logo.png =120x)

# LocalHire – AI-Powered Hyperlocal Job-Matching Platform for Blue-Collar Workers

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=vercel)](https://the-local-hire.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](https://github.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6?style=for-the-badge&logo=typescript)](#)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)](#)

---

## 📋 Table of Contents

- [About](#about)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
  - [Worker Features](#worker-features)
  - [Employer Features](#employer-features)
  - [Admin Features](#admin-features)
  - [AI Features](#ai-features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [Database Schema](#database-schema)
- [Job Categories](#job-categories)
- [API Integration](#api-integration)
- [Deployment](#deployment)
- [Supabase Configuration](#supabase-configuration)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

---

## About

**LocalHire** is a hyperlocal, AI-powered job-matching platform specifically designed for blue-collar workers and local employers. The platform bridges the gap between skilled and semi-skilled workers (construction laborers, drivers, electricians, plumbers, factory workers, delivery personnel, helpers) and nearby hiring businesses using intelligent recommendation systems and location-based matching.

Unlike traditional job portals that primarily focus on white-collar employment, LocalHire simplifies hiring through skill-based profiles instead of traditional resumes, emphasizing accessibility, simplicity, and regional adaptability.

---

## Problem Statement

Blue-collar workers struggle to find nearby job opportunities due to:
- Lack of digital literacy
- Absence of structured resumes
- Dependency on middlemen and contractors
- Limited access to transparent salary information

Employers face difficulties in:
- Finding verified and available local workers quickly
- Filtering candidates based on skills and location
- Managing bulk hiring efficiently

---

## Solution

LocalHire provides a hyperlocal AI-based job-matching engine that:
- Connects workers and employers within a defined geographic radius (5-10 km)
- Uses AI to recommend suitable jobs to workers
- Matches employers with top candidates based on skills, experience, and location
- Detects fraudulent listings through AI fraud detection
- Suggests skill improvements for better job opportunities
- Supports resume-free application process for accessibility

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 18.3, TypeScript 5.8+, Vite 5.4 |
| **Styling** | Tailwind CSS 3.4, shadcn/ui |
| **State Management** | React Context API, TanStack Query |
| **Routing** | React Router DOM 6.30 |
| **Authentication** | Supabase Auth (Google Auth) |
| **Database** | PostgreSQL (Supabase) |
| **Maps** | Leaflet, React-Leaflet |
| **Charts** | Recharts |
| **Forms** | React Hook Form, Zod |
| **Animations** | Framer Motion 12 |
| **HTTP Client** | Native fetch with TanStack Query |
| **Testing** | Vitest, Testing Library |
| **Deployment** | Vercel |

---

## Key Features

### Worker Features

| Feature | Description |
|---------|-------------|
| **Smart Profile Builder** | Skill tagging, experience level, expected salary, availability toggle, document upload |
| **AI Job Recommendation** | Personalized job suggestions with match percentage scoring |
| **Hyperlocal Job Discovery** | GPS-based matching, distance sorting, map view, travel time estimation |
| **One-Click Apply** | Quick application without resume requirement |
| **Job Alerts** | SMS, WhatsApp, and in-app notifications |
| **Rating & Safety** | Employer ratings, fraud reporting, verified employer badges |
| **In-App Messaging** | Direct communication with employers |

### Employer Features

| Feature | Description |
|---------|-------------|
| **Quick Job Posting** | Post jobs in under 2 minutes with category, salary, location, vacancies |
| **AI Candidate Matching** | Auto-ranked candidate list with match percentage |
| **Worker Filtering** | Distance, experience, skills, verified badge filters |
| **Direct Communication** | In-app chat and privacy-protected calling |
| **Bulk Hiring** | Multi-vacancy job posting, candidate shortlist export |
| **Hiring Analytics** | Job views, application count, hiring conversion metrics |
| **Worker Ratings** | Rate workers after job completion |

### Admin Features

| Feature | Description |
|---------|-------------|
| **User Management** | View, approve, suspend, verify user accounts |
| **Job Post Moderation** | Approve, edit, remove suspicious listings |
| **Fraud Monitoring** | AI-assisted detection and review system |
| **Review Moderation** | Monitor and remove inappropriate reviews |
| **Verification Management** | Approve worker verification requests |
| **Analytics Dashboard** | Platform performance tracking |
| **Notification Control** | System-wide announcements |

### AI Features

| Feature | Description |
|---------|-------------|
| **Fraud Detection** | Detects suspicious salary listings, duplicate postings, scam patterns |
| **Recommendation Engine** | Personalized job/candidate suggestions with behavior learning |
| **Smart Salary Estimator** | Fair wage recommendations based on location, experience, market demand |
| **Skill Gap Analysis** | Suggests training/certifications for better opportunities |

---

## Project Structure

```
├── public/                    # Static assets
│   ├── logo.png              # Application logo
│   └── logo-favicon.png      # Favicon
├── src/
│   ├── components/
│   │   ├── admin/           # Admin dashboard components
│   │   ├── employer/        # Employer dashboard components
│   │   ├── shared/          # Shared components (PlacesAutocomplete)
│   │   ├── ui/              # shadcn/ui components
│   │   ├── worker/          # Worker dashboard components
│   │   ├── CategoriesSection.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── HeroSection.tsx
│   │   ├── HowItWorksSection.tsx
│   │   ├── NavLink.tsx
│   │   └── TrustSection.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication context
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── integrations/
│   │   └── supabase/        # Supabase client & types
│   ├── lib/
│   │   └── utils.ts         # Utility functions
│   ├── pages/
│   │   ├── AdminDashboard.tsx
│   │   ├── AuthPage.tsx
│   │   ├── BrowseJobs.tsx
│   │   ├── EmployerDashboard.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── Index.tsx        # Homepage
│   │   ├── NotFound.tsx
│   │   ├── ResetPasswordPage.tsx
│   │   ├── RoleSelectionPage.tsx
│   │   └── WorkerDashboard.tsx
│   ├── test/                # Test files
│   ├── App.css
│   ├── App.tsx              # Main application component
│   ├── index.css            # Global styles
│   ├── main.tsx             # Application entry point
│   └── vite-env.d.ts
├── supabase/
│   ├── config.toml          # Supabase project config
│   ├── functions/           # Edge functions
│   │   ├── ai-job-description/
│   │   ├── job-recommendations/
│   │   ├── seed-data/
│   │   └── seed-interactions/
│   └── migrations/          # Database migrations
├── .env.example             # Environment variables template
├── components.json          # shadcn/ui config
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v18+) - [Download](https://nodejs.org/)
- **npm** or **bun** - Package managers
- **Git** - Version control
- **Supabase Account** - [Sign up](https://supabase.com/)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd build-my-web-app

# Install dependencies using npm
npm install

# OR using bun (faster)
bun install
```

### Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```env
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_URL=https://your-project.supabase.co

# Google Maps API (optional - for map features)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Running the Application

```bash
# Development server (port 8080)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint
```

---

## Database Schema

The application uses PostgreSQL with the following core tables:

| Table | Description |
|-------|-------------|
| `users` | Base user information (Worker/Employer/Admin) |
| `worker_profiles` | Worker-specific data (skills, experience, location) |
| `employer_profiles` | Employer-specific data (company, contact) |
| `categories` | Job categories (Construction, Driving, etc.) |
| `roles` | Job roles within categories |
| `skills` | Skills associated with roles |
| `worker_skills` | Many-to-many worker-skill mapping |
| `jobs` | Job listings |
| `job_skills` | Many-to-many job-skill mapping |
| `applications` | Job applications |
| `job_recommendations` | AI-generated job recommendations |
| `candidate_recommendations` | AI-generated candidate recommendations |
| `reviews` | Worker/Employer ratings |
| `conversations` | Messaging conversations |
| `messages` | Chat messages |
| `notifications` | User notifications |
| `fraud_flags` | AI-detected fraud flags |

### Key Schema Design Principles

- **UUID Primary Keys** - Security through non-sequential identifiers
- **Spatial Indexing** - Fast location-based queries using latitude/longitude
- **Row-Level Security (RLS)** - Database-level access control
- **JSONB Fields** - AI-ready data structures for explainability
- **Composite Indexes** - Optimized query performance

---

## Job Categories

LocalHire supports **11 major blue-collar job categories**:

1. **Construction & Infrastructure** - Mason, Carpenter, Electrician, Plumber, Painter, Welder
2. **Transportation & Driving** - Delivery Driver, Heavy Vehicle Driver, Auto/Taxi Driver, Forklift Operator
3. **Manufacturing & Factory** - Machine Operator, Assembly Line Worker, CNC Operator, Quality Inspector
4. **Maintenance & Repair** - AC Technician, Mobile Repair, Appliance Repair, Mechanic
5. **Home & Personal Services** - Housekeeper, Cook, Babysitter, Security Guard
6. **Hospitality & Retail** - Waiter, Cashier, Store Assistant
7. **Agriculture & Farming** - Farm Worker, Dairy Worker, Tractor Operator
8. **Logistics & Warehouse** - Warehouse Worker, Picker/Packer, Inventory Supervisor
9. **Gig & On-Demand** - On-Call Electrician, Plumber, Cleaner, Technician
10. **Healthcare Support** - Nursing Assistant, Ward Attendant, Lab Assistant
11. **Construction Equipment** - Crane Operator, Scaffolding Worker, Road Construction Worker

---

## API Integration

### Supabase Auth

The application uses Supabase for authentication with the following providers:

- **Email/Password** - Traditional authentication
- **Google OAuth** - Social login

### Supabase Edge Functions

| Function | Purpose |
|----------|---------|
| `ai-job-description` | AI-powered job description generation |
| `job-recommendations` | Personalized job matching algorithm |
| `seed-data` | Initial data population |
| `seed-interactions` | Interaction data seeding |

### External APIs

- **Google Maps** - Location services, map visualization
- **Leaflet** - Open-source map library

---

## Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Supabase Configuration

Add the following redirect URLs in your **Supabase Dashboard** under **Authentication > URL Configuration**:

```
# Production URLs
https://the-local-hire.vercel.app
https://the-local-hire.vercel.app/auth?mode=login
https://the-local-hire.vercel.app/reset-password
https://the-local-hire.vercel.app/role-selection
https://the-local-hire.vercel.app/dashboard/worker
https://the-local-hire.vercel.app/dashboard/employer
https://the-local-hire.vercel.app/dashboard/admin

# Development URLs
http://localhost:5173
http://localhost:5173/auth?mode=login
http://localhost:5173/reset-password
http://localhost:5173/role-selection
http://localhost:5173/dashboard/worker
http://localhost:5173/dashboard/employer
http://localhost:5173/dashboard/admin
```

---

## Future Enhancements

- **Gig-Based Daily Wage Section** - Short-term and daily job opportunities
- **Digital Contract Signing** - E-contracts for formal agreements
- **Worker Attendance Management** - Time tracking features
- **Micro-Insurance Integration** - Insurance products for workers
- **Government Skill Scheme Integration** - Partner with government programs
- **Digital Wage Payment System** - In-app payment processing
- **Voice-Based Search** - Voice commands for low-literacy users
- **Multilingual Support** - Regional language interfaces

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

## Acknowledgments

- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Next-generation build tool

---

**LocalHire** – Connecting Blue-Collar Workers with Local Opportunities 🚀
