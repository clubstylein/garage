import {
  NextResponse,
} from "next/server";

const DIRECTUS_URL =
  process.env.DIRECTUS_URL;

const DIRECTUS_TOKEN =
  process.env.DIRECTUS_TOKEN;

/* =========================================================
   HELPERS
   ========================================================= */

function optionalString(
  value: unknown
) {
  const text =
    String(
      value ?? ""
    ).trim();

  return text || null;
}

function optionalNumber(
  value: unknown
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : null;
}

/* =========================================================
   CREATE VEHICLE
   ========================================================= */

export async function POST(
  request: Request
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
          status: 500,
        }
      );
    }

    const body =
      await request.json();

    /* =====================================================
       REQUIRED VEHICLE FIELDS
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
          status: 400,
        }
      );
    }

    /* =====================================================
       OWNERSHIP
       ===================================================== */

    const ownershipStatus =
      body.ownership_status ===
      "Wishlist"
        ? "Wishlist"
        : "Owned";

    /*
     * Wishlist never belongs
     * to a customer.
     */

    const customerId =
      ownershipStatus ===
      "Wishlist"
        ? null
        : optionalString(
            body.customer
          );

    /*
     * Every garage/customer vehicle
     * must belong to a customer.
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
          status: 400,
        }
      );
    }

    /* =====================================================
       VEHICLE PAYLOAD
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
       * NEW CUSTOMER RELATION
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

      cover_image:
        optionalString(
          body.cover_image
        ),

      archived:
        false,
    };

    console.log(
      "Creating vehicle:",
      {
        name:
          payload.name,

        ownership_status:
          payload.ownership_status,

        customer:
          payload.customer,

        cover_image:
          payload.cover_image,
      }
    );

    /* =====================================================
       CREATE VEHICLE IN DIRECTUS
       ===================================================== */

    const response =
      await fetch(
        `${DIRECTUS_URL}/items/garage_vehicles`,
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${DIRECTUS_TOKEN}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              payload
            ),

          cache:
            "no-store",
        }
      );

    let result;

    try {
      result =
        await response.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid response from Directus while creating vehicle",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !response.ok
    ) {
      console.error(
        "Directus vehicle error:",
        result
      );

      return NextResponse.json(
        {
          error:
            result?.errors?.[0]
              ?.message ||
            "Unable to create vehicle",
        },
        {
          status:
            response.status,
        }
      );
    }

    const vehicleId =
      result?.data?.id;

    if (
      vehicleId ===
        null ||
      vehicleId ===
        undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Vehicle was created but Directus did not return an ID",
        },
        {
          status: 500,
        }
      );
    }

    /* =====================================================
       SAVE VEHICLE SPECIFICATIONS
       ===================================================== */

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

              index: number
            ) => ({
              vehicle:
                vehicleId,

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
        const specificationResponse =
          await fetch(
            `${DIRECTUS_URL}/items/garage_vehicle_specifications`,
            {
              method:
                "POST",

              headers: {
                Authorization:
                  `Bearer ${DIRECTUS_TOKEN}`,

                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  specificationPayload
                ),

              cache:
                "no-store",
            }
          );

        if (
          !specificationResponse.ok
        ) {
          let specificationError;

          try {
            specificationError =
              await specificationResponse.json();
          } catch {
            specificationError =
              null;
          }

          console.error(
            "Specification save error:",
            specificationError
          );

          return NextResponse.json(
            {
              error:
                "Vehicle was created, but specifications could not be saved.",

              vehicleId:
                String(
                  vehicleId
                ),
            },
            {
              status: 500,
            }
          );
        }
      }
    }

    /* =====================================================
       SUCCESS
       ===================================================== */

    return NextResponse.json(
      {
        ...result.data,

        id:
          String(
            vehicleId
          ),
      },
      {
        status: 201,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Vehicle creation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to create vehicle",
      },
      {
        status: 500,
      }
    );
  }
}