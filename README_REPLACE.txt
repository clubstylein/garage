ClubStyle Garage AI Assistant

Adds:
- /ai page
- Standard parser and optional AI parser
- Interpretation preview before any form opens
- Create Work
- Create Part
- Create Customer
- Create Vehicle
- Create Estimate
- Create Invoice

Replaces/extends existing components only to accept optional prefill values:
- top-nav.tsx
- add-customer-modal.tsx
- part-form-modal.tsx
- vehicle-work-modal.tsx
- bill-form-modal.tsx

New files:
- app/ai/page.tsx
- app/api/ai-command/route.ts
- components/ai-dashboard.tsx
- components/ai-vehicle-modal.tsx
- lib/garage-ai.ts

AI setup:
The project already uses the OpenAI SDK for vehicle lookup.
The same OPENAI_API_KEY is used.
Optional env:
OPENAI_AI_COMMAND_MODEL=gpt-5.6-luna

Behavior:
- Use AI unchecked -> deterministic standard parser.
- Use AI checked -> OpenAI structured interpretation.
- Both modes display the same Interpretation area.
- Nothing is written to Directus from the interpretation step.
- The user must click Open ... Form, review the normal popup, then save.

Recommended test commands:
1. new part order crashbar
2. clubstyle panamerica create work seating stitching
3. add customer Rajesh Kumar vip phone 9876543210
4. create vehicle for clubstyle 2021 Yamaha Tenere 700
5. create estimate for clubstyle
6. create invoice for clubstyle
