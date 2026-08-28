ClubStyle Garage — Work Tabs + Compact Parts Master

Replace these files:

components/vehicle-work-modal.tsx
components/work-item-parts-panel.tsx
components/part-form-modal.tsx

Changes:
- Add/Edit Work now has Main and Parts tabs.
- Main contains Customer/Vehicle/Work fields through Notes.
- Parts tab contains the linked-parts grid only.
- Clicking +Part from the Work page continues to open the Work item directly on Parts and opens Add Part.
- New unsaved Work items show a save-first message on the Parts tab.
- Parts page Add/Edit popup is compact and edits only garage_parts master data.
- Work-specific quantity/status/pricing/billable values remain in garage_work_item_parts and are edited from the Work item Parts tab.
