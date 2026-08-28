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
  if (value === "" || value === null || value === undefined) return null;
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

function mapPart(part: any) {
  if (!part || typeof part !== "object") return undefined;

  return {
    id: String(part.id),
    partNumber: part.part_number ?? undefined,
    name: part.name ?? "",
    brand: part.brand ?? undefined,
    description: part.description ?? undefined,
    costPrice: part.cost_price ?? undefined,
    sellingPrice: part.selling_price ?? undefined,
    currency: part.currency ?? undefined,
    supplier: part.supplier ?? undefined,
    supplierPartNumber: part.supplier_part_number ?? undefined,
    stockQuantity: part.stock_quantity ?? undefined,
    reorderLevel: part.reorder_level ?? undefined,
    notes: part.notes ?? undefined,
    active: part.active !== false,
  };
}

function mapItem(item: any) {
  return {
    id: String(item.id),
    workItemId: relationId(item.work_item),
    partId: relationId(item.part),
    part: mapPart(item.part),
    quantityNeeded: item.quantity_needed ?? undefined,
    quantityUsed: item.quantity_used ?? undefined,
    status: item.status ?? undefined,
    unitCost: item.unit_cost ?? undefined,
    unitPrice: item.unit_price ?? undefined,
    billable: item.billable !== false,
    notes: item.notes ?? undefined,
  };
}

async function getPart(partId: string) {
  const response = await fetch(
    `${DIRECTUS_URL}/items/garage_parts/${encodeURIComponent(
      partId
    )}?fields=id,cost_price,selling_price`,
    {
      headers: authHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) return null;
  const result = await response.json();
  return result?.data ?? null;
}

const fields =
  "id,work_item,part.id,part.part_number,part.name,part.brand,part.description,part.cost_price,part.selling_price,part.currency,part.supplier,part.supplier_part_number,part.stock_quantity,part.reorder_level,part.notes,part.active,quantity_needed,quantity_used,status,unit_cost,unit_price,billable,notes,archived";

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

    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_work_item_parts?fields=${fields}&filter[work_item][_eq]=${encodeURIComponent(
        id
      )}&filter[archived][_neq]=true&sort=id`,
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
            result?.errors?.[0]?.message || "Unable to load work item parts",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(
      (Array.isArray(result.data) ? result.data : []).map(mapItem)
    );
  } catch (error) {
    console.error("Load work item parts error:", error);

    return NextResponse.json(
      { error: "Unable to load work item parts" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const body = await request.json();
    const partId = optionalString(body.part ?? body.partId);

    if (!partId) {
      return NextResponse.json(
        { error: "Part is required" },
        { status: 400 }
      );
    }

    const masterPart = await getPart(partId);

    const payload = {
      work_item: id,
      part: partId,
      quantity_needed: optionalNumber(body.quantity_needed ?? body.quantityNeeded),
      quantity_used: optionalNumber(body.quantity_used ?? body.quantityUsed),
      status: optionalString(body.status) ?? "Needed",
      unit_cost:
        optionalNumber(body.unit_cost ?? body.unitCost) ??
        optionalNumber(masterPart?.cost_price),
      unit_price:
        optionalNumber(body.unit_price ?? body.unitPrice) ??
        optionalNumber(masterPart?.selling_price),
      billable: body.billable !== false,
      notes: optionalString(body.notes),
      archived: false,
    };

    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_work_item_parts?fields=${fields}`,
      {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Create work item part Directus error:", result);

      return NextResponse.json(
        {
          error:
            result?.errors?.[0]?.message || "Unable to add part to work item",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(mapItem(result.data), { status: 201 });
  } catch (error) {
    console.error("Create work item part error:", error);

    return NextResponse.json(
      { error: "Unable to add part to work item" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const { id: workItemId } = await params;
    const body = await request.json();
    const id = optionalString(body.id);

    if (!id) {
      return NextResponse.json(
        { error: "Work item part ID is required" },
        { status: 400 }
      );
    }

    const payload = {
      quantity_needed: optionalNumber(body.quantity_needed ?? body.quantityNeeded),
      quantity_used: optionalNumber(body.quantity_used ?? body.quantityUsed),
      status: optionalString(body.status) ?? "Needed",
      unit_cost: optionalNumber(body.unit_cost ?? body.unitCost),
      unit_price: optionalNumber(body.unit_price ?? body.unitPrice),
      billable: body.billable !== false,
      notes: optionalString(body.notes),
    };

    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_work_item_parts/${encodeURIComponent(
        id
      )}?fields=${fields}`,
      {
        method: "PATCH",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Update work item part Directus error:", result);

      return NextResponse.json(
        {
          error:
            result?.errors?.[0]?.message || "Unable to update work item part",
        },
        { status: response.status }
      );
    }

    const mapped = mapItem(result.data);

    if (mapped.workItemId && mapped.workItemId !== String(workItemId)) {
      return NextResponse.json(
        { error: "Part does not belong to this work item" },
        { status: 400 }
      );
    }

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Update work item part error:", error);

    return NextResponse.json(
      { error: "Unable to update work item part" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const body = await request.json();
    const id = optionalString(body.id);

    if (!id) {
      return NextResponse.json(
        { error: "Work item part ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_work_item_parts/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: authHeaders(),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const result = await response.json().catch(() => null);

      return NextResponse.json(
        {
          error:
            result?.errors?.[0]?.message || "Unable to remove work item part",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete work item part error:", error);

    return NextResponse.json(
      { error: "Unable to remove work item part" },
      { status: 500 }
    );
  }
}
