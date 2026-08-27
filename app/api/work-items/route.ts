import { NextResponse } from "next/server";

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

function authHeaders() {
  return {
    Authorization: `Bearer ${DIRECTUS_TOKEN}`,
  };
}

function jsonHeaders() {
  return {
    ...authHeaders(),
    "Content-Type": "application/json",
  };
}

function optionalString(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function optionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
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


async function resolveCustomerFromVehicle(vehicleId: string) {
  const response = await fetch(
    `${DIRECTUS_URL}/items/garage_vehicles/${encodeURIComponent(
      vehicleId
    )}?fields=customer.id`,
    {
      headers: authHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) return null;

  const result = await response.json();
  return relationId(result?.data?.customer) || null;
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

function makePayload(body: any) {
  const customer = optionalString(body.customer);
  const vehicleMode = body.vehicle_mode === "free-text" ? "free-text" : "existing";
  const vehicle = vehicleMode === "existing" ? optionalString(body.vehicle) : null;
  const vehicleText =
    vehicleMode === "free-text" ? optionalString(body.vehicle_text) : null;

  return {
    customer,
    vehicle,
    vehicle_text: vehicleText,
    title: optionalString(body.title),
    category: optionalString(body.category),
    priority: optionalNumber(body.priority) ?? 3,
    status: optionalString(body.status) ?? "Planned",
    work_description: optionalString(body.work_description),
    odometer: optionalNumber(body.odometer),
    target_date: optionalString(body.target_date),
    started_date: optionalString(body.started_date),
    completed_date: optionalString(body.completed_date),
    estimated_cost: optionalNumber(body.estimated_cost),
    notes: optionalString(body.notes),
    archived: false,
  };
}

export async function GET(request: Request) {
  try {
    if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
      return NextResponse.json(
        { error: "Directus is not configured" },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const customer = url.searchParams.get("customer");
    const vehicle = url.searchParams.get("vehicle");

    const filters: string[] = ["filter[archived][_neq]=true"];

    if (id) {
      filters.push(`filter[id][_eq]=${encodeURIComponent(id)}`);
    }

    if (customer) {
      filters.push(`filter[customer][_eq]=${encodeURIComponent(customer)}`);
    }

    if (vehicle) {
      filters.push(`filter[vehicle][_eq]=${encodeURIComponent(vehicle)}`);
    }

    const fields =
      "id,customer.id,customer.customer_code,customer.name,customer.category,vehicle.id,vehicle_text,title,category,priority,status,work_description,odometer,target_date,started_date,completed_date,estimated_cost,notes,archived,sort";

    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_work_items?fields=${fields}&${filters.join(
        "&"
      )}&sort=priority,target_date,sort,title`,
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

    const items = Array.isArray(result.data) ? result.data.map(mapItem) : [];

    if (id) {
      return NextResponse.json(items[0] ?? null);
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error("Load work items error:", error);

    return NextResponse.json(
      { error: "Unable to load work items" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
      return NextResponse.json(
        { error: "Directus is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const payload = makePayload(body);

    if (!payload.customer && payload.vehicle) {
      payload.customer = await resolveCustomerFromVehicle(payload.vehicle);
    }

    if (!payload.customer) {
      return NextResponse.json(
        { error: "Customer is required" },
        { status: 400 }
      );
    }

    if (!payload.title) {
      return NextResponse.json(
        { error: "Work title is required" },
        { status: 400 }
      );
    }

    if (!payload.vehicle && !payload.vehicle_text) {
      return NextResponse.json(
        { error: "Select a vehicle or enter a free-text vehicle" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_work_items?fields=id,customer.id,customer.customer_code,customer.name,customer.category,vehicle.id,vehicle_text,title,category,priority,status,work_description,odometer,target_date,started_date,completed_date,estimated_cost,notes`,
      {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Create work item Directus error:", result);

      return NextResponse.json(
        {
          error:
            result?.errors?.[0]?.message || "Unable to create work item",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(mapItem(result.data), { status: 201 });
  } catch (error) {
    console.error("Create work item error:", error);

    return NextResponse.json(
      { error: "Unable to create work item" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
      return NextResponse.json(
        { error: "Directus is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const id = optionalString(body.id);
    const payload = makePayload(body);

    if (!payload.customer && payload.vehicle) {
      payload.customer = await resolveCustomerFromVehicle(payload.vehicle);
    }

    if (!id) {
      return NextResponse.json(
        { error: "Work item ID is required" },
        { status: 400 }
      );
    }

    if (!payload.customer) {
      return NextResponse.json(
        { error: "Customer is required" },
        { status: 400 }
      );
    }

    if (!payload.title) {
      return NextResponse.json(
        { error: "Work title is required" },
        { status: 400 }
      );
    }

    if (!payload.vehicle && !payload.vehicle_text) {
      return NextResponse.json(
        { error: "Select a vehicle or enter a free-text vehicle" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_work_items/${encodeURIComponent(
        id
      )}?fields=id,customer.id,customer.customer_code,customer.name,customer.category,vehicle.id,vehicle_text,title,category,priority,status,work_description,odometer,target_date,started_date,completed_date,estimated_cost,notes`,
      {
        method: "PATCH",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Update work item Directus error:", result);

      return NextResponse.json(
        {
          error:
            result?.errors?.[0]?.message || "Unable to update work item",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(mapItem(result.data));
  } catch (error) {
    console.error("Update work item error:", error);

    return NextResponse.json(
      { error: "Unable to update work item" },
      { status: 500 }
    );
  }
}
