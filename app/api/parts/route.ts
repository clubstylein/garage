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

function mapPart(item: any) {
  return {
    id: String(item.id),
    partNumber: item.part_number ?? undefined,
    name: item.name ?? "",
    brand: item.brand ?? undefined,
    description: item.description ?? undefined,
    costPrice: item.cost_price ?? undefined,
    sellingPrice: item.selling_price ?? undefined,
    currency: item.currency ?? undefined,
    supplier: item.supplier ?? undefined,
    supplierPartNumber: item.supplier_part_number ?? undefined,
    stockQuantity: item.stock_quantity ?? undefined,
    reorderLevel: item.reorder_level ?? undefined,
    notes: item.notes ?? undefined,
    active: item.active !== false,
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
    const search = String(url.searchParams.get("search") ?? "")
      .trim()
      .toLowerCase();

    const fields =
      "id,part_number,name,brand,description,cost_price,selling_price,currency,supplier,supplier_part_number,stock_quantity,reorder_level,notes,active,archived";

    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_parts?fields=${fields}&filter[archived][_neq]=true&sort=name&limit=1000`,
      {
        headers: authHeaders(),
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: result?.errors?.[0]?.message || "Unable to load parts",
        },
        { status: response.status }
      );
    }

    const includeInactive = url.searchParams.get("include_inactive") === "1";

    let parts = (Array.isArray(result.data) ? result.data : [])
      .filter((item: any) => includeInactive || item.active !== false)
      .map(mapPart);

    if (search) {
      parts = parts.filter((part: any) => {
        const text = [
          part.partNumber,
          part.name,
          part.brand,
          part.description,
          part.supplier,
          part.supplierPartNumber,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(search);
      });
    }

    return NextResponse.json(parts.slice(0, 100));
  } catch (error) {
    console.error("Load garage parts error:", error);

    return NextResponse.json(
      { error: "Unable to load parts" },
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
    const name = optionalString(body.name);

    if (!name) {
      return NextResponse.json(
        { error: "Part name is required" },
        { status: 400 }
      );
    }

    const payload = {
      part_number: optionalString(body.part_number ?? body.partNumber),
      name,
      brand: optionalString(body.brand),
      description: optionalString(body.description),
      cost_price: optionalNumber(body.cost_price ?? body.costPrice),
      selling_price: optionalNumber(body.selling_price ?? body.sellingPrice),
      currency: optionalString(body.currency) ?? "INR",
      supplier: optionalString(body.supplier),
      supplier_part_number: optionalString(
        body.supplier_part_number ?? body.supplierPartNumber
      ),
      stock_quantity: optionalNumber(
        body.stock_quantity ?? body.stockQuantity
      ) ?? 0,
      reorder_level: optionalNumber(body.reorder_level ?? body.reorderLevel),
      notes: optionalString(body.notes),
      active: true,
      archived: false,
    };

    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_parts?fields=id,part_number,name,brand,description,cost_price,selling_price,currency,supplier,supplier_part_number,stock_quantity,reorder_level,notes,active`,
      {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Create garage part Directus error:", result);

      return NextResponse.json(
        {
          error: result?.errors?.[0]?.message || "Unable to create part",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(mapPart(result.data), { status: 201 });
  } catch (error) {
    console.error("Create garage part error:", error);

    return NextResponse.json(
      { error: "Unable to create part" },
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
    if (!id) {
      return NextResponse.json({ error: "Part ID is required" }, { status: 400 });
    }

    const payload = {
      part_number: optionalString(body.part_number ?? body.partNumber),
      name: optionalString(body.name),
      brand: optionalString(body.brand),
      description: optionalString(body.description),
      cost_price: optionalNumber(body.cost_price ?? body.costPrice),
      selling_price: optionalNumber(body.selling_price ?? body.sellingPrice),
      currency: optionalString(body.currency) ?? "INR",
      supplier: optionalString(body.supplier),
      supplier_part_number: optionalString(
        body.supplier_part_number ?? body.supplierPartNumber
      ),
      stock_quantity: optionalNumber(
        body.stock_quantity ?? body.stockQuantity
      ) ?? 0,
      reorder_level: optionalNumber(body.reorder_level ?? body.reorderLevel),
      notes: optionalString(body.notes),
      active: body.active !== false,
    };

    if (!payload.name) {
      return NextResponse.json({ error: "Part name is required" }, { status: 400 });
    }

    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_parts/${encodeURIComponent(id)}?fields=id,part_number,name,brand,description,cost_price,selling_price,currency,supplier,supplier_part_number,stock_quantity,reorder_level,notes,active`,
      {
        method: "PATCH",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const result = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: result?.errors?.[0]?.message || "Unable to update part" },
        { status: response.status }
      );
    }

    return NextResponse.json(mapPart(result.data));
  } catch (error) {
    console.error("Update garage part error:", error);
    return NextResponse.json({ error: "Unable to update part" }, { status: 500 });
  }
}
