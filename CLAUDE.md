# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JANDI is a multi-agent AI marketplace platform implementing the **UCP (Uniform Commerce Protocol) v2026-01-11** with **A2A (Agent-to-Agent) communication**. It consists of a React frontend, a consumer agent (jandi_agent), and business agents (business_agent).

## Repository Structure

```
JANDI_app/
├── chat-client/       # React 19 + Vite + TypeScript frontend
├── business_agent/    # Python agent representing a single business (Google ADK)
├── jandi_agent/       # Python agent representing a single consumer (Google ADK)
└── documentation/     # Architecture and setup docs
```

## Commands

### Frontend (chat-client/)
```bash
npm install       # Install dependencies
npm run dev       # Dev server on port 3000
npm run build     # Production build
npm run preview   # Preview production build
```

### Business Agent (business_agent/)
```bash
uv sync                                                        # Install dependencies
uv run business_agent                                          # Run agent
python -m business_agent.main --business-id <id> --port <port> # Run with args
```

### Consumer Agent (jandi_agent/)
```bash
pip install -e .
python -m jandi_agent.main --user-id <id> --port <port>
```

No test suite exists in this codebase.

## Architecture

### System Flow
```
Browser (React) → Supabase Auth (Google OAuth PKCE)
                → JANDI Agent (jandi_agent, ports 20000+)
                    ↕ A2A Protocol
                  Business Agents (business_agent, ports 10000+)
                    ↕
                  Supabase (PostgreSQL with RLS)
```

Each user and each business gets its own agent process on a dedicated port.

### Frontend Architecture

- **Entry**: `chat-client/index.tsx` → `App.tsx`
- **Auth**: `contexts/AuthContext.tsx` wraps all routes; uses Supabase PKCE flow
- **Key contexts**: `AuthContext`, `ConversationContext`, `CartContext`, `OnboardingContext`
- **Services**: `services/supabase.ts` (client init), `auth.service.ts`, `onboarding.service.ts`, `business.service.ts`
- **Routes**:
  - `/` – Landing page (Three.js PlasmaOrb + GSAP animations)
  - `/login`, `/register` – Auth forms
  - `/auth/callback` – OAuth callback (`AuthCallbackSimple.tsx`)
  - `/onboarding` – 5-step user setup (identity → shopping context → preferences → autonomy → payment)
  - `/chat` – Main shopping chat interface
  - `/business` – Business registration portal (6-step flow)
  - `/business/dashboard/:id` – Business dashboard
- **Components organized by domain**: `Auth/`, `Onboarding/`, `Business/`, `Cart/`, `Shared/`, `ChatHome/`, `VoiceHome/`

### Backend Architecture

**business_agent** (one instance per business):
- `agent.py` – Creates ADK agent with 6 UCP tools
- `tools/ucp_tools.py` – UCP protocol tools (catalog, validate, order, pay, etc.)
- `config_loader.py` – Loads business config from Supabase
- `payment_processor.py` – Payment handling (Mercado Pago mockup in dev)
- `prompt.py` – System prompt for the business agent

**jandi_agent** (one instance per user):
- `agent.py` – Creates ADK agent for consumer
- `user_config_loader.py` – Loads user preferences (autonomy level, priority: price/speed/quality)
- `tools/business_discovery.py` – Finds available business agents
- `tools/a2a_client.py` – A2A protocol communication with business agents
- `prompt.py` – System prompt reflecting user's preferences

### Database

Supabase (PostgreSQL) with Row Level Security enabled on all 11 tables. Schema: `documentation/SUPABASE_SCHEMA.sql`.

## Environment Variables

### Frontend (`chat-client/.env.local`)
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_GOOGLE_CLIENT_ID
VITE_APP_URL            # http://localhost:5173
VITE_API_URL            # http://localhost:10999
VITE_MP_PUBLIC_KEY      # Mercado Pago (mockup in dev)
VITE_ENABLE_BUSINESS_REGISTRATION
VITE_ENABLE_GOOGLE_AUTH
```

### Backend (`business_agent/.env`)
```
SUPABASE_URL
SUPABASE_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_URL
GOOGLE_API_KEY
GOOGLE_PROJECT_ID
UCP_VERSION             # 2026-01-11
APP_ENV                 # development/production
API_PORT
SESSION_DB_URL
```

## Key Tech

- **Frontend**: React 19, Vite 6, TypeScript 5.8, React Router 7, Tailwind CSS, Three.js/R3F, Framer Motion, GSAP, Supabase.js
- **Backend**: Python 3.10+, Google ADK (`google-adk[a2a]`), LiteLLM, Starlette/Uvicorn, Supabase-py, Pydantic 2, `uv` package manager
- **Auth**: Supabase Auth with Google OAuth 2.0 PKCE
- **Deploy**: Frontend → Vercel; Backend → Cloud Run (see `vercel.json`, `documentation/DEPLOY_VERCEL.md`)

## Vite Dev Proxy

`vite.config.ts` proxies `/api` → `localhost:10999` in development, so frontend API calls go to the local business agent without CORS issues.
