import { NextResponse } from "next/server";

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

function authHeaders() {
  return {
    Authorization: `Bearer ${DIRECTUS_TOKEN}`,
  };
}

function relationId(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (
    value &&
    typeof value === "object" &&
    "id" in value &&
    (value as { id?: unknown }).id !== undefined
  ) {
    return String((value as { id: unknown }).id);
  }

  return "";
}

function mapItem(item: any) {
  const customer =
    item.customer && typeof item.customer === "object"
      ? item.customer
      : null;

  return {
    id: String(item.id),
    customerId: relationId(item.customer) || undefined,
    customerCode: customer?.customer_code ?? undefined,
    customerName: customer?.name ?? undefined,
    customerCategory: customer?.category ?? undefined,
    vehicleId: relationId(item.vehicle) || undefined,
    vehicleText: item.vehicle_text ?? undefined,
    title: item.title,
    category: item.category ?? undefined,
    priority: item.priority ?? undefined,
    status: item.status ?? undefined,
    workDescription: item.work_description ?? undefined,
    odometer: item.odometer ?? undefined,
    targetDate: item.target_date ?? undefined,
    startedDate: item.started_date ?? undefined,
    completedDate: item.completed_date ?? undefined,
    estimatedCost: item.estimated_cost ?? undefined,
    notes: item.notes ?? undefined,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
      return NextResponse.json(
        { error: "Directus is not configured" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const fields =
      "id,customer.id,customer.customer_code,customer.name,customer.category,vehicle.id,vehicle_text,title,category,priority,status,work_description,odometer,target_date,started_date,completed_date,estimated_cost,notes,archived,sort";

    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_work_items?fields=${fields}&filter[vehicle][_eq]=${encodeURIComponent(
        id
      )}&filter[archived][_neq]=true&sort=priority,sort,title`,
      {
        headers: authHeaders(),
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            result?.errors?.[0]?.message || "Unable to load work items",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(
      Array.isArray(result.data) ? result.data.map(mapItem) : []
    );
  } catch (error) {
    console.error("Vehicle work GET error:", error);

    return NextResponse.json(
      { error: "Unable to load work items" },
      { status: 500 }
    );
  }
}
