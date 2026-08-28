ClubStyle Garage AI web-enrichment update

Replace:
- app/api/ai-command/route.ts
- components/ai-dashboard.tsx
- lib/garage-ai.ts

Changes:
- AI mode gets a second checkbox: Search online for details & image
- That checkbox defaults ON whenever Use AI is enabled
- Standard parser never uses web research
- AI web research uses the OpenAI Responses API web_search tool
- Interpretation shows online research, details, sources, warnings and an image preview when a reliable image URL is found
- The structured command is enriched before existing Garage forms are opened
- Command textbox is reduced to 3 rows
- Clickable examples remain above the textbox
