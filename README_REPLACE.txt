ClubStyle Garage — Work Parts Integration

Replace these files at the repository root:

app/api/parts/route.ts
app/api/work-items/[id]/parts/route.ts
components/part-picker-modal.tsx
components/work-item-parts-panel.tsx
components/vehicle-work-modal.tsx
lib/mock-data.ts

This set deliberately does NOT replace top-nav.tsx, work-dashboard.tsx or globals.css.
It preserves the current desktop layout and only adds Parts to the Work modal.

Directus service role permissions required:

Garage Parts (garage_parts)
- Read
- Create
Fields used:
id, part_number, name, brand, description, cost_price, selling_price, currency,
supplier, supplier_part_number, stock_quantity, reorder_level, notes, active, archived

Garage Work Item Parts (garage_work_item_parts)
- Read
- Create
- Update
- Delete
Fields used:
id, work_item, part, quantity_needed, quantity_used, status, unit_cost,
unit_price, billable, notes, archived

Relations also need readable access to garage_parts for the nested part fields.

Behavior:
- New Work: save Work first; Parts section becomes active immediately after save.
- Edit Work: linked parts load automatically.
- + Add Part searches the parts master.
- + New Part can create a master part and attach it to the work item.
- Quantity fields use decimals (step 0.001).
- Unit cost/unit price are snapshotted into garage_work_item_parts.
- Billable can be turned off without removing the part.
