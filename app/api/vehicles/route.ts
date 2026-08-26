import { NextResponse } from "next/server";

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

export async function POST(request: Request) {
  try {
    if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
      return NextResponse.json(
        { error: "Directus is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();

    if (!body.name || !body.make || !body.model || !body.year) {
      return NextResponse.json(
        {
          error: "Name, make, model and year are required",
        },
        { status: 400 }
      );
    }

    const payload = {
      name: body.name,
      asset_type: body.asset_type || "Motorcycle",
      ownership_status:
  body.ownership_status ||
  "Owned",
  
      make: body.make,
      model: body.model,
      variant: body.variant || null,
      year: Number(body.year),
      status: body.status || "Running",

      registration_number: body.registration_number || null,
      vin: body.vin || null,
      engine_number: body.engine_number || null,
      engine_platform: body.engine_platform || null,

      engine_cc: body.engine_cc
        ? Number(body.engine_cc)
        : null,

      odometer: body.odometer
        ? Number(body.odometer)
        : 0,

      odometer_unit: body.odometer_unit || "km",

      purchase_date: body.purchase_date || null,

      purchase_price: body.purchase_price
        ? Number(body.purchase_price)
        : null,

      currency: body.currency || null,
      location: body.location || null,
      notes: body.notes || null,

      cover_image: body.cover_image || null,

      archived: false,
    };

    console.log(
      "Cover image received by vehicle API:",
      body.cover_image
    );

    // Create vehicle
    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_vehicles`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DIRECTUS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Directus vehicle error:", result);

      return NextResponse.json(
        {
          error:
            result?.errors?.[0]?.message ||
            "Unable to create vehicle",
        },
        { status: response.status }
      );
    }

    const vehicleId = result.data.id;

    // Save vehicle specifications
    const specifications = Array.isArray(body.specifications)
      ? body.specifications
      : [];

    if (specifications.length > 0) {
      const specificationPayload = specifications.map(
        (
          specification: {
            category?: string;
            specification?: string;
            value?: string;
            unit?: string;
            notes?: string;
            sort?: number;
          },
          index: number
        ) => ({
          vehicle: vehicleId,
          category: specification.category || null,
          specification: specification.specification,
          value: specification.value,
          unit: specification.unit || null,
          notes: specification.notes || null,
          sort: specification.sort ?? index + 1,
        })
      );

      const specificationResponse = await fetch(
        `${DIRECTUS_URL}/items/garage_vehicle_specifications`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${DIRECTUS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(specificationPayload),
        }
      );

      if (!specificationResponse.ok) {
        const specificationError =
          await specificationResponse.json();

        console.error(
          "Specification save error:",
          specificationError
        );

        return NextResponse.json(
          {
            error:
              "Vehicle was created, but specifications could not be saved.",
            vehicleId,
          },
          { status: 500 }
        );
      }
    }

    // Everything succeeded
    return NextResponse.json(result.data, {
      status: 201,
    });
  } catch (error) {
    console.error("Vehicle creation error:", error);

    return NextResponse.json(
      { error: "Unable to create vehicle" },
      { status: 500 }
    );
  }
}