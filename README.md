# AI Job Sniper

A precision-first, user-controlled job acquisition platform built with Next.js, Supabase, OpenAI, and Anthropic.

## Included in this repo

### Completed V1
- Jobs V2 Sniper UI with filter rail, command bar, detail drawer, fit scoring, compact/card/table views, and saved search profile shell
- Pipeline dashboard with stages, overdue items, top-fit shortlist, recent packages, and daily actions
- Cover letter engine upgrade with factual, ATS-safe generation and export-ready output
- Follow-up automation v1 with editable templates, default 3-day scheduling, and reminder states
- Brain dashboard with search profile, model mode, automation switches, sniper status, and daily run summary
- Resume builder with OpenAI primary drafting, Anthropic refinement fallback, and DOCX/PDF export
- Interview prep engine
- Package store and tracker

### V2 scaffolds included
- Auto apply preparation shell with compliance-first routing
- Google Calendar scheduling route shell and UI hooks
- Analytics dashboard with conversion metrics and CV version performance
- Mock interview foundation inside Interviews page

## Design principles
- Factual only
- User controlled
- No fabricated claims
- Natural professional tone
- ATS-safe without gimmicks
- Quiet automation, visible user approval

## Setup
1. Copy `.env.example` to `.env.local`
2. Add your keys and Supabase values
3. Run `npm install`
4. Run `npm run dev`
5. Execute `sql/setup.sql` in Supabase

## Notes
- Official APIs should always be preferred for job application submission
- Browser automation must be user-approved and compliant with site terms
- This repo stores application assets and workflow metadata, not hidden user behavior
