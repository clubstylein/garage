import {
  NextResponse,
} from "next/server";

const DIRECTUS_URL =
  process.env.DIRECTUS_URL;

const DIRECTUS_TOKEN =
  process.env.DIRECTUS_TOKEN;

const headers = {
  Authorization:
    `Bearer ${DIRECTUS_TOKEN}`,

  "Content-Type":
    "application/json",
};

/* =========================================================
   HELPERS
   ========================================================= */

function optionalString(
  value:
    unknown
) {
  const text =
    String(
      value ??
        ""
    ).trim();

  return text ||
    null;
}

function optionalNumber(
  value:
    unknown
) {
  if (
    value ===
      undefined ||
    value ===
      null ||
    value ===
      ""
  ) {
    return null;
  }

  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : null;
}

/* =========================================================
   UPDATE VEHICLE
   ========================================================= */

export async function PATCH(
  request:
    Request,

  {
    params,
  }: {
    params:
      Promise<{
        id: string;
      }>;
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
        {
          status:
            500,
        }
      );
    }

    const {
      id,
    } =
      await params;

    const body =
      await request.json();

    /* =====================================================
       REQUIRED FIELDS
       ===================================================== */

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
        {
          status:
            400,
        }
      );
    }

    /* =====================================================
       OWNERSHIP / CUSTOMER
       ===================================================== */

    const ownershipStatus =
      body.ownership_status ===
      "Wishlist"
        ? "Wishlist"
        : "Owned";

    /*
     * Wishlist vehicles never
     * belong to a customer.
     */

    const customerId =
      ownershipStatus ===
      "Wishlist"
        ? null
        : optionalString(
            body.customer
          );

    /*
     * Every non-Wishlist garage
     * vehicle must have a customer.
     */

    if (
      ownershipStatus !==
        "Wishlist" &&
      !customerId
    ) {
      return NextResponse.json(
        {
          error:
            "Customer is required for non-Wishlist vehicles",
        },
        {
          status:
            400,
        }
      );
    }

    /* =====================================================
       UPDATE VEHICLE
       ===================================================== */

    const payload = {
      name:
        String(
          body.name
        ).trim(),

      asset_type:
        optionalString(
          body.asset_type
        ) ??
        "Motorcycle",

      ownership_status:
        ownershipStatus,

      /*
       * CUSTOMER RELATION
       */

      customer:
        customerId,

      make:
        String(
          body.make
        ).trim(),

      model:
        String(
          body.model
        ).trim(),

      variant:
        optionalString(
          body.variant
        ),

      year:
        Number(
          body.year
        ),

      status:
        optionalString(
          body.status
        ) ??
        "Running",

      registration_number:
        optionalString(
          body.registration_number
        ),

      vin:
        optionalString(
          body.vin
        ),

      engine_number:
        optionalString(
          body.engine_number
        ),

      engine_platform:
        optionalString(
          body.engine_platform
        ),

      engine_cc:
        optionalNumber(
          body.engine_cc
        ),

      odometer:
        optionalNumber(
          body.odometer
        ) ??
        0,

      odometer_unit:
        body.odometer_unit ===
        "mi"
          ? "mi"
          : "km",

      purchase_date:
        optionalString(
          body.purchase_date
        ),

      purchase_price:
        optionalNumber(
          body.purchase_price
        ),

      currency:
        optionalString(
          body.currency
        ),

      location:
        optionalString(
          body.location
        ),

      notes:
        optionalString(
          body.notes
        ),

      /*
       * IMPORTANT:
       *
       * null removes the current
       * Directus image relation.
       */

      cover_image:
        body.cover_image ===
          null
          ? null
          : optionalString(
              body.cover_image
            ),
    };

    const vehicleResponse =
      await fetch(
        `${DIRECTUS_URL}/items/garage_vehicles/${encodeURIComponent(
          id
        )}`,
        {
          method:
            "PATCH",

          headers,

          body:
            JSON.stringify(
              payload
            ),

          cache:
            "no-store",
        }
      );

    let vehicleResult;

    try {
      vehicleResult =
        await vehicleResponse.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid response from Directus while updating vehicle",
        },
        {
          status:
            500,
        }
      );
    }

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

    /* =====================================================
       GET EXISTING SPECIFICATIONS
       ===================================================== */

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

          cache:
            "no-store",
        }
      );

    if (
      !existingResponse.ok
    ) {
      const error =
        await existingResponse.text();

      console.error(
        "Unable to read existing specifications:",
        existingResponse.status,
        error
      );

      return NextResponse.json(
        {
          error:
            "Vehicle was updated, but existing specifications could not be read.",
        },
        {
          status:
            500,
        }
      );
    }

    const existingResult =
      await existingResponse.json();

    const existingIds:
      string[] =
      (
        existingResult.data ??
        []
      ).map(
        (
          item: {
            id:
              string |
              number;
          }
        ) =>
          String(
            item.id
          )
      );

    /* =====================================================
       DELETE OLD SPECIFICATIONS
       ===================================================== */

    if (
      existingIds.length >
      0
    ) {
      const deleteResponse =
        await fetch(
          `${DIRECTUS_URL}/items/garage_vehicle_specifications`,
          {
            method:
              "DELETE",

            headers,

            body:
              JSON.stringify(
                existingIds
              ),

            cache:
              "no-store",
          }
        );

      if (
        !deleteResponse.ok
      ) {
        let deleteError;

        try {
          deleteError =
            await deleteResponse.json();
        } catch {
          deleteError =
            null;
        }

        console.error(
          "Specification delete error:",
          deleteError
        );

        return NextResponse.json(
          {
            error:
              "Vehicle was updated, but existing specifications could not be replaced.",
          },
          {
            status:
              500,
          }
        );
      }
    }

    /* =====================================================
       CREATE UPDATED SPECIFICATIONS
       ===================================================== */

    const specifications =
      Array.isArray(
        body.specifications
      )
        ? body.specifications
        : [];

    const specificationPayload =
      specifications
        .filter(
          (
            specification: {
              specification?: string;
              value?: string;
            }
          ) =>
            String(
              specification
                .specification ??
                ""
            ).trim() !==
              "" &&
            String(
              specification
                .value ??
                ""
            ).trim() !==
              ""
        )
        .map(
          (
            specification: {
              category?: string;
              specification?: string;
              value?: string;
              unit?: string;
              notes?: string;
              sort?: number;
            },

            index:
              number
          ) => ({
            vehicle:
              id,

            category:
              optionalString(
                specification.category
              ),

            specification:
              optionalString(
                specification.specification
              ),

            value:
              optionalString(
                specification.value
              ),

            unit:
              optionalString(
                specification.unit
              ),

            notes:
              optionalString(
                specification.notes
              ),

            sort:
              specification.sort ??
              index +
                1,
          })
        );

    if (
      specificationPayload.length >
      0
    ) {
      const createResponse =
        await fetch(
          `${DIRECTUS_URL}/items/garage_vehicle_specifications`,
          {
            method:
              "POST",

            headers,

            body:
              JSON.stringify(
                specificationPayload
              ),

            cache:
              "no-store",
          }
        );

      if (
        !createResponse.ok
      ) {
        let createError;

        try {
          createError =
            await createResponse.json();
        } catch {
          createError =
            null;
        }

        console.error(
          "Specification create error:",
          createError
        );

        return NextResponse.json(
          {
            error:
              "Vehicle was updated, but specifications could not be saved.",
          },
          {
            status:
              500,
          }
        );
      }
    }

    /* =====================================================
       SUCCESS
       ===================================================== */

    return NextResponse.json(
      vehicleResult.data
    );
  } catch (
    error
  ) {
    console.error(
      "Vehicle update error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to update vehicle",
      },
      {
        status:
          500,
      }
    );
  }
}