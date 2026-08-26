import { NextResponse } from "next/server";

const DIRECTUS_URL =
  process.env.DIRECTUS_URL;

const DIRECTUS_TOKEN =
  process.env.DIRECTUS_TOKEN;

const headers = {
  Authorization: `Bearer ${DIRECTUS_TOKEN}`,
  "Content-Type": "application/json",
};

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    if (
      !DIRECTUS_URL ||
      !DIRECTUS_TOKEN
    ) {
      return NextResponse.json(
        {
          error:
            "Directus is not configured",
        },
        { status: 500 }
      );
    }

    const { id } = await params;

    const body =
      await request.json();

    if (
      !body.name ||
      !body.make ||
      !body.model ||
      !body.year
    ) {
      return NextResponse.json(
        {
          error:
            "Name, make, model and year are required",
        },
        { status: 400 }
      );
    }

    /*
     * UPDATE VEHICLE
     */

    const payload = {
      name: body.name,

      asset_type:
        body.asset_type ||
        "Motorcycle",

      make: body.make,
      model: body.model,

      variant:
        body.variant || null,

      year:
        Number(body.year),

      status:
        body.status ||
        "Running",

      registration_number:
        body.registration_number ||
        null,

      vin:
        body.vin || null,

      engine_number:
        body.engine_number ||
        null,

      engine_platform:
        body.engine_platform ||
        null,

      engine_cc:
        body.engine_cc
          ? Number(
              body.engine_cc
            )
          : null,

      odometer:
        body.odometer
          ? Number(
              body.odometer
            )
          : 0,

      odometer_unit:
        body.odometer_unit ||
        "km",

      purchase_date:
        body.purchase_date ||
        null,

      purchase_price:
        body.purchase_price
          ? Number(
              body.purchase_price
            )
          : null,

      currency:
        body.currency || null,

      location:
        body.location || null,

      notes:
        body.notes || null,

      cover_image:
        body.cover_image ||
        null,
    };

    const vehicleResponse =
      await fetch(
        `${DIRECTUS_URL}/items/garage_vehicles/${encodeURIComponent(
          id
        )}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify(
            payload
          ),
        }
      );

    const vehicleResult =
      await vehicleResponse.json();

    if (
      !vehicleResponse.ok
    ) {
      console.error(
        "Vehicle update error:",
        vehicleResult
      );

      return NextResponse.json(
        {
          error:
            vehicleResult
              ?.errors?.[0]
              ?.message ||
            "Unable to update vehicle",
        },
        {
          status:
            vehicleResponse.status,
        }
      );
    }

    /*
     * GET EXISTING SPECS
     */

    const existingResponse =
      await fetch(
        `${DIRECTUS_URL}/items/garage_vehicle_specifications?filter[vehicle][_eq]=${encodeURIComponent(
          id
        )}&fields=id`,
        {
          headers: {
            Authorization:
              `Bearer ${DIRECTUS_TOKEN}`,
          },

          cache: "no-store",
        }
      );

    if (
      !existingResponse.ok
    ) {
      return NextResponse.json(
        {
          error:
            "Vehicle was updated, but existing specifications could not be read.",
        },
        { status: 500 }
      );
    }

    const existingResult =
      await existingResponse.json();

    const existingIds:
      string[] =
      existingResult.data.map(
        (item: {
          id: string;
        }) => item.id
      );

    /*
     * DELETE OLD SPECS
     */

    if (
      existingIds.length > 0
    ) {
      const deleteResponse =
        await fetch(
          `${DIRECTUS_URL}/items/garage_vehicle_specifications`,
          {
            method: "DELETE",

            headers,

            body: JSON.stringify(
              existingIds
            ),
          }
        );

      if (
        !deleteResponse.ok
      ) {
        const deleteError =
          await deleteResponse.json();

        console.error(
          "Specification delete error:",
          deleteError
        );

        return NextResponse.json(
          {
            error:
              "Vehicle was updated, but existing specifications could not be replaced.",
          },
          { status: 500 }
        );
      }
    }

    /*
     * CREATE UPDATED SPECS
     */

    const specifications =
      Array.isArray(
        body.specifications
      )
        ? body.specifications
        : [];

    if (
      specifications.length >
      0
    ) {
      const specificationPayload =
        specifications.map(
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
            vehicle: id,

            category:
              specification.category ||
              null,

            specification:
              specification.specification,

            value:
              specification.value,

            unit:
              specification.unit ||
              null,

            notes:
              specification.notes ||
              null,

            sort:
              specification.sort ??
              index + 1,
          })
        );

      const createResponse =
        await fetch(
          `${DIRECTUS_URL}/items/garage_vehicle_specifications`,
          {
            method: "POST",

            headers,

            body: JSON.stringify(
              specificationPayload
            ),
          }
        );

      if (
        !createResponse.ok
      ) {
        const createError =
          await createResponse.json();

        console.error(
          "Specification create error:",
          createError
        );

        return NextResponse.json(
          {
            error:
              "Vehicle was updated, but specifications could not be saved.",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      vehicleResult.data
    );
  } catch (error) {
    console.error(
      "Vehicle update error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update vehicle",
      },
      { status: 500 }
    );
  }
}