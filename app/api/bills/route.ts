import { NextResponse } from "next/server";

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

function authHeaders() {
  return { Authorization: `Bearer ${DIRECTUS_TOKEN}` };
}

function jsonHeaders() {
  return { ...authHeaders(), "Content-Type": "application/json" };
}

function optionalString(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function optionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function relationId(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object" && "id" in value) {
    return String((value as { id?: unknown }).id ?? "");
  }
  return "";
}

function mapBill(item: any, itemCount = 0) {
  const customer = item.customer && typeof item.customer === "object" ? item.customer : null;
  return {
    id: String(item.id),
    billNumber: item.bill_number ?? "",
    customerId: relationId(item.customer),
    customerCode: customer?.customer_code ?? "",
    customerName: customer?.name ?? "",
    customerCategory: customer?.category ?? "",
    type: item.type ?? "Estimate",
    status: item.status ?? "Draft",
    billDate: item.bill_date ?? "",
    validUntil: item.valid_until ?? "",
    dueDate: item.due_date ?? "",
    currency: item.currency ?? "INR",
    subtotal: Number(item.subtotal ?? 0),
    discount: Number(item.discount ?? 0),
    tax: Number(item.tax ?? 0),
    total: Number(item.total ?? 0),
    notes: item.notes ?? "",
    terms: item.terms ?? "",
    itemCount,
  };
}

function mapBillItem(item: any) {
  return {
    id: String(item.id),
    billId: relationId(item.bill),
    lineType: item.line_type ?? "Manual",
    workItemId: relationId(item.work_item) || undefined,
    partId: relationId(item.part) || undefined,
    description: item.description ?? "",
    quantity: Number(item.quantity ?? 1),
    unitPrice: Number(item.unit_price ?? 0),
    discount: Number(item.discount ?? 0),
    tax: Number(item.tax ?? 0),
    amount: Number(item.amount ?? 0),
    billable: item.billable !== false,
    notes: item.notes ?? "",
  };
}

function lineAmount(item: any) {
  if (item.billable === false) return 0;
  const quantity = optionalNumber(item.quantity) ?? 1;
  const unitPrice = optionalNumber(item.unitPrice ?? item.unit_price) ?? 0;
  const discount = optionalNumber(item.discount) ?? 0;
  const tax = optionalNumber(item.tax) ?? 0;
  return Math.max(0, quantity * unitPrice - discount + tax);
}

async function generateBillNumber(type: string) {
  const prefix = type === "Invoice" ? "INV" : "EST";
  const year = new Date().getFullYear();
  const response = await fetch(
    `${DIRECTUS_URL}/items/garage_bills?fields=bill_number&id&filter[type][_eq]=${encodeURIComponent(
      type
    )}&sort=-id&limit=100`,
    { headers: authHeaders(), cache: "no-store" }
  );
  if (!response.ok) return `${prefix}-${year}-0001`;
  const result = await response.json();
  let highest = 0;
  for (const row of Array.isArray(result.data) ? result.data : []) {
    const match = String(row.bill_number ?? "").match(new RegExp(`^${prefix}-${year}-(\\d+)$`));
    if (match) highest = Math.max(highest, Number(match[1]) || 0);
  }
  return `${prefix}-${year}-${String(highest + 1).padStart(4, "0")}`;
}

async function createItems(billId: string, items: any[]) {
  const created = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const payload = {
      bill: billId,
      line_type: optionalString(item.lineType ?? item.line_type) ?? "Manual",
      work_item: optionalString(item.workItemId ?? item.work_item),
      part: optionalString(item.partId ?? item.part),
      description: optionalString(item.description) ?? "",
      quantity: optionalNumber(item.quantity) ?? 1,
      unit_price: optionalNumber(item.unitPrice ?? item.unit_price) ?? 0,
      discount: optionalNumber(item.discount) ?? 0,
      tax: optionalNumber(item.tax) ?? 0,
      amount: lineAmount(item),
      billable: item.billable !== false,
      notes: optionalString(item.notes),
      archived: false,
      sort: index + 1,
    };
    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_bill_items?fields=id,bill,line_type,work_item,part,description,quantity,unit_price,discount,tax,amount,billable,notes`,
      {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );
    const result = await response.json();
    if (!response.ok) throw new Error(result?.errors?.[0]?.message || "Unable to create bill item");
    created.push(mapBillItem(result.data));
  }
  return created;
}

async function deleteExistingItems(billId: string) {
  const response = await fetch(
    `${DIRECTUS_URL}/items/garage_bill_items?fields=id&filter[bill][_eq]=${encodeURIComponent(
      billId
    )}&limit=1000`,
    { headers: authHeaders(), cache: "no-store" }
  );
  if (!response.ok) throw new Error("Unable to load existing bill items");
  const result = await response.json();
  for (const row of Array.isArray(result.data) ? result.data : []) {
    const deleteResponse = await fetch(
      `${DIRECTUS_URL}/items/garage_bill_items/${encodeURIComponent(String(row.id))}`,
      { method: "DELETE", headers: authHeaders(), cache: "no-store" }
    );
    if (!deleteResponse.ok && deleteResponse.status !== 204) {
      throw new Error("Unable to replace bill items");
    }
  }
}

function headerPayload(body: any, items: any[], billNumber?: string) {
  const subtotal = items.reduce((sum, item) => sum + lineAmount(item), 0);
  const discount = optionalNumber(body.discount) ?? 0;
  const tax = optionalNumber(body.tax) ?? 0;
  return {
    ...(billNumber ? { bill_number: billNumber } : {}),
    customer: optionalString(body.customerId ?? body.customer),
    type: body.type === "Invoice" ? "Invoice" : "Estimate",
    status: optionalString(body.status) ?? "Draft",
    bill_date: optionalString(body.billDate ?? body.bill_date),
    valid_until: optionalString(body.validUntil ?? body.valid_until),
    due_date: optionalString(body.dueDate ?? body.due_date),
    currency: optionalString(body.currency) ?? "INR",
    subtotal,
    discount,
    tax,
    total: Math.max(0, subtotal - discount + tax),
    notes: optionalString(body.notes),
    terms: optionalString(body.terms),
    active: true,
    archived: false,
  };
}

export async function GET(request: Request) {
  try {
    if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
      return NextResponse.json({ error: "Directus is not configured" }, { status: 500 });
    }
    const url = new URL(request.url);
    const id = optionalString(url.searchParams.get("id"));
    const fields =
      "id,bill_number,customer.id,customer.customer_code,customer.name,customer.category,type,status,bill_date,valid_until,due_date,currency,subtotal,discount,tax,total,notes,terms,active,archived";

    if (id) {
      const [billResponse, itemsResponse] = await Promise.all([
        fetch(`${DIRECTUS_URL}/items/garage_bills/${encodeURIComponent(id)}?fields=${fields}`, {
          headers: authHeaders(), cache: "no-store",
        }),
        fetch(`${DIRECTUS_URL}/items/garage_bill_items?fields=id,bill,line_type,work_item,part,description,quantity,unit_price,discount,tax,amount,billable,notes&filter[bill][_eq]=${encodeURIComponent(id)}&filter[archived][_neq]=true&sort=sort,id&limit=1000`, {
          headers: authHeaders(), cache: "no-store",
        }),
      ]);
      const billResult = await billResponse.json();
      const itemsResult = await itemsResponse.json();
      if (!billResponse.ok) {
        return NextResponse.json({ error: billResult?.errors?.[0]?.message || "Unable to load bill" }, { status: billResponse.status });
      }
      if (!itemsResponse.ok) {
        return NextResponse.json({ error: itemsResult?.errors?.[0]?.message || "Unable to load bill items" }, { status: itemsResponse.status });
      }
      const items = (Array.isArray(itemsResult.data) ? itemsResult.data : []).map(mapBillItem);
      return NextResponse.json({ ...mapBill(billResult.data, items.length), items });
    }

    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_bills?fields=${fields}&filter[archived][_neq]=true&sort=-bill_date,-id&limit=1000`,
      { headers: authHeaders(), cache: "no-store" }
    );
    const result = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: result?.errors?.[0]?.message || "Unable to load bills" }, { status: response.status });
    }

    const countResponse = await fetch(
      `${DIRECTUS_URL}/items/garage_bill_items?fields=id,bill&filter[archived][_neq]=true&limit=10000`,
      { headers: authHeaders(), cache: "no-store" }
    );
    const countResult = await countResponse.json();
    const counts = new Map<string, number>();
    if (countResponse.ok) {
      for (const item of Array.isArray(countResult.data) ? countResult.data : []) {
        const billId = relationId(item.bill);
        counts.set(billId, (counts.get(billId) ?? 0) + 1);
      }
    }

    return NextResponse.json(
      (Array.isArray(result.data) ? result.data : []).map((item: any) =>
        mapBill(item, counts.get(String(item.id)) ?? 0)
      )
    );
  } catch (error) {
    console.error("Bills GET error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load bills" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
      return NextResponse.json({ error: "Directus is not configured" }, { status: 500 });
    }
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];
    const customer = optionalString(body.customerId ?? body.customer);
    if (!customer) return NextResponse.json({ error: "Customer is required" }, { status: 400 });
    if (items.length === 0) return NextResponse.json({ error: "Add at least one bill item" }, { status: 400 });

    const type = body.type === "Invoice" ? "Invoice" : "Estimate";
    const billNumber = await generateBillNumber(type);
    const payload = headerPayload(body, items, billNumber);
    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_bills?fields=id,bill_number,customer.id,customer.customer_code,customer.name,customer.category,type,status,bill_date,valid_until,due_date,currency,subtotal,discount,tax,total,notes,terms`,
      { method: "POST", headers: jsonHeaders(), body: JSON.stringify(payload), cache: "no-store" }
    );
    const result = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: result?.errors?.[0]?.message || "Unable to create bill" }, { status: response.status });
    }
    const createdItems = await createItems(String(result.data.id), items);
    return NextResponse.json({ ...mapBill(result.data, createdItems.length), items: createdItems }, { status: 201 });
  } catch (error) {
    console.error("Bills POST error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create bill" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
      return NextResponse.json({ error: "Directus is not configured" }, { status: 500 });
    }
    const body = await request.json();
    const id = optionalString(body.id);
    const items = Array.isArray(body.items) ? body.items : [];
    if (!id) return NextResponse.json({ error: "Bill ID is required" }, { status: 400 });
    if (!optionalString(body.customerId ?? body.customer)) {
      return NextResponse.json({ error: "Customer is required" }, { status: 400 });
    }
    if (items.length === 0) return NextResponse.json({ error: "Add at least one bill item" }, { status: 400 });

    const payload = headerPayload(body, items);
    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_bills/${encodeURIComponent(id)}?fields=id,bill_number,customer.id,customer.customer_code,customer.name,customer.category,type,status,bill_date,valid_until,due_date,currency,subtotal,discount,tax,total,notes,terms`,
      { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(payload), cache: "no-store" }
    );
    const result = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: result?.errors?.[0]?.message || "Unable to update bill" }, { status: response.status });
    }
    await deleteExistingItems(id);
    const createdItems = await createItems(id, items);
    return NextResponse.json({ ...mapBill(result.data, createdItems.length), items: createdItems });
  } catch (error) {
    console.error("Bills PATCH error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update bill" }, { status: 500 });
  }
}
