ClubStyle Garage — Billing / Estimates / Invoices

This replacement set adds:
- /billing page matching the Work/Parts look and feel
- Estimates and Invoices in garage_bills
- Bill line items in garage_bill_items
- Customer quick search, detailed customer search and + Add Customer
- Add customer Work Items to a bill
- Add Parts already linked to customer Work Items
- Add any Part from Parts Master
- Add Manual billing lines
- Non-billable lines (visible, amount = 0)
- Decimal quantities
- Line discount/tax and bill-level discount/tax
- Responsive mobile billing UI
- Billing menu item in TopNav

No Directus schema changes are required beyond the garage_bills and garage_bill_items tables already created.

Required service-token permissions:
garage_bills: Read, Create, Update
garage_bill_items: Read, Create, Update, Delete
garage_customers: Read, Create
garage_work_items: Read
garage_work_item_parts: Read
garage_parts: Read

Install from repository root:
unzip -o ClubStyle_Garage_Billing_Invoicing.zip -d .
rm ClubStyle_Garage_Billing_Invoicing.zip
npm run build
