import { NextResponse } from "next/server";

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

function authHeaders() {
  return { Authorization: `Bearer ${DIRECTUS_TOKEN}` };
}

function relationId(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object" && "id" in value) {
    return String((value as { id?: unknown }).id ?? "");
  }
  return "";
}

export async function GET(request: Request) {
  try {
    if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
      return NextResponse.json({ error: "Directus is not configured" }, { status: 500 });
    }
    const url = new URL(request.url);
    const customer = String(url.searchParams.get("customer") ?? "").trim();
    if (!customer) return NextResponse.json({ error: "Customer is required" }, { status: 400 });

    const [workResponse, partsResponse, workPartsResponse] = await Promise.all([
      fetch(
        `${DIRECTUS_URL}/items/garage_work_items?fields=id,title,category,status,estimated_cost,vehicle.id,vehicle.name,vehicle_text&filter[customer][_eq]=${encodeURIComponent(customer)}&filter[archived][_neq]=true&filter[status][_neq]=Cancelled&sort=-id&limit=1000`,
        { headers: authHeaders(), cache: "no-store" }
      ),
      fetch(
        `${DIRECTUS_URL}/items/garage_parts?fields=id,part_number,name,brand,selling_price,currency,stock_quantity&filter[archived][_neq]=true&filter[active][_neq]=false&sort=name&limit=1000`,
        { headers: authHeaders(), cache: "no-store" }
      ),
      fetch(
        `${DIRECTUS_URL}/items/garage_work_item_parts?fields=id,work_item.id,work_item.title,part.id,part.part_number,part.name,part.brand,part.selling_price,quantity_needed,quantity_used,status,unit_price,billable,notes&filter[archived][_neq]=true&sort=-id&limit=5000`,
        { headers: authHeaders(), cache: "no-store" }
      ),
    ]);

    const [workResult, partsResult, workPartsResult] = await Promise.all([
      workResponse.json(), partsResponse.json(), workPartsResponse.json(),
    ]);

    if (!workResponse.ok) return NextResponse.json({ error: workResult?.errors?.[0]?.message || "Unable to load customer work" }, { status: workResponse.status });
    if (!partsResponse.ok) return NextResponse.json({ error: partsResult?.errors?.[0]?.message || "Unable to load parts" }, { status: partsResponse.status });
    if (!workPartsResponse.ok) return NextResponse.json({ error: workPartsResult?.errors?.[0]?.message || "Unable to load work parts" }, { status: workPartsResponse.status });

    const workItems = (Array.isArray(workResult.data) ? workResult.data : []).map((item: any) => ({
      id: String(item.id),
      title: item.title ?? "",
      category: item.category ?? "",
      status: item.status ?? "",
      vehicle: item.vehicle?.name ?? item.vehicle_text ?? "",
      estimatedCost: Number(item.estimated_cost ?? 0),
    }));

    const parts = (Array.isArray(partsResult.data) ? partsResult.data : []).map((item: any) => ({
      id: String(item.id),
      partNumber: item.part_number ?? "",
      name: item.name ?? "",
      brand: item.brand ?? "",
      sellingPrice: Number(item.selling_price ?? 0),
      currency: item.currency ?? "INR",
      stockQuantity: Number(item.stock_quantity ?? 0),
    }));

    const customerWorkIds = new Set(workItems.map((item: any) => String(item.id)));

    const jobParts = (Array.isArray(workPartsResult.data) ? workPartsResult.data : [])
      .filter((item: any) => customerWorkIds.has(relationId(item.work_item)))
      .map((item: any) => ({
        id: String(item.id),
        workItemId: relationId(item.work_item),
        workTitle: item.work_item?.title ?? "",
        partId: relationId(item.part),
        partNumber: item.part?.part_number ?? "",
        name: item.part?.name ?? "",
        brand: item.part?.brand ?? "",
        quantity: Number(item.quantity_used ?? 0) > 0 ? Number(item.quantity_used) : Number(item.quantity_needed ?? 1),
        unitPrice: Number(item.unit_price ?? item.part?.selling_price ?? 0),
        billable: item.billable !== false,
        status: item.status ?? "",
        notes: item.notes ?? "",
      }));

    return NextResponse.json({ workItems, parts, jobParts });
  } catch (error) {
    console.error("Billing source error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load billing source" }, { status: 500 });
  }
}
