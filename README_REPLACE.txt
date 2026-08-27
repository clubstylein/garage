ClubStyle Garage - Corrected Replacement Set

This ZIP is intentionally structured with app/, components/, and lib/ at the ZIP root.
Extract it in the repository root with:

  unzip -o ClubStyle_Garage_Corrected_Replacements.zip -d .

Files included:
  app/globals.css
  app/api/customers/route.ts
  app/api/work-items/route.ts
  components/top-nav.tsx
  components/add-customer-modal.tsx
  components/customer-search-modal.tsx
  components/vehicle-work-modal.tsx
  components/work-dashboard.tsx
  lib/directus.ts
  lib/mock-data.ts

This set restores the previous desktop layout while retaining:
- quick customer search
- detailed customer search popup
- add customer popup and auto-select
- existing/free-text vehicle mode
- garage_work_items.customer
- garage_work_items.vehicle_text
- customer/free-text work editing
- compact Work modal
- desktop Work filters in one row at XL widths
- existing one-row top navigation
- mobile stacking only where needed

Directus service role permissions required for garage_work_items:
  Read/Create/Update: customer, vehicle_text
and existing permissions for garage_customers and garage_vehicles.customer.
