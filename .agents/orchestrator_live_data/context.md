# Context: Live Data Integration & GM Character Management

## Core Requirements
- R1. Live Data Integration: CampaignContext, DashboardPage, GMDashboard (no hardcoded demo data, use live Supabase data, fix newly created character traits fallback bug).
- R2. GM Character Management: Party and XP tabs in GM Dashboard, create/manage characters, distribute XP, and persist in Supabase characters table.

## Key Files to Check/Modify
- `src/contexts/CampaignContext.tsx`
- `src/pages/DashboardPage.tsx` or `src/components/dashboard/...`
- `src/components/gm/GMDashboard.tsx`
- `src/lib/types.ts`
- `schema.sql` (if any schema modifications or migrations needed)

## Environment
- OS: Windows
- Workspaces: `D:\DnD`
- Working Directory: `D:\DnD\.agents\orchestrator_live_data\`
- Network Mode: CODE_ONLY
