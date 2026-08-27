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
  value: unknown
) {
  const text =
    String(
      value ?? ""
    ).trim();

  return text || null;
}

async function generateCustomerCode() {
  const response =
    await fetch(
      `${DIRECTUS_URL}/items/garage_customers?fields=customer_code&limit=-1`,
      {
        headers: {
          Authorization:
            `Bearer ${DIRECTUS_TOKEN}`,
        },

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      "Unable to generate customer code"
    );
  }

  const result =
    await response.json();

  const rows =
    Array.isArray(
      result.data
    )
      ? result.data
      : [];

  let highest =
    0;

  for (
    const row of rows
  ) {
    const code =
      String(
        row.customer_code ??
          ""
      )
        .trim()
        .toUpperCase();

    const match =
      code.match(
        /^CUS(\d{6})$/
      );

    if (!match) {
      continue;
    }

    const number =
      Number(
        match[1]
      );

    if (
      Number.isFinite(
        number
      ) &&
      number >
        highest
    ) {
      highest =
        number;
    }
  }

  return `CUS${String(
    highest + 1
  ).padStart(
    6,
    "0"
  )}`;
}

/* =========================================================
   GET CUSTOMERS
   ========================================================= */

export async function GET() {
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

    const response =
      await fetch(
        `${DIRECTUS_URL}/items/garage_customers?fields=id,customer_code,name,category,phone,email,address,city,state,pincode,country,notes,active,archived&filter[archived][_neq]=true&sort=name`,
        {
          headers: {
            Authorization:
              `Bearer ${DIRECTUS_TOKEN}`,
          },

          cache:
            "no-store",
        }
      );

    const result =
      await response.json();

    if (
      !response.ok
    ) {
      return NextResponse.json(
        {
          error:
            result?.errors?.[0]
              ?.message ||
            "Unable to load customers",
        },
        {
          status:
            response.status,
        }
      );
    }

    const customers =
      (
        Array.isArray(
          result.data
        )
          ? result.data
          : []
      )
        .filter(
          (
            customer: {
              active?: boolean;
            }
          ) =>
            customer.active !==
            false
        )
        .map(
          (
            customer: {
              id:
                string |
                number;

              customer_code?:
                string;

              name?:
                string;

              category?:
                string;

              phone?:
                string;

              email?:
                string;

              pincode?:
                string;
            }
          ) => ({
            id:
              String(
                customer.id
              ),

            customerCode:
              customer.customer_code ??
              "",

            name:
              customer.name ??
              "",

            category:
              customer.category ??
              "",

            phone:
              customer.phone ??
              "",

            email:
              customer.email ??
              "",

            pincode:
              customer.pincode ??
              "",
          })
        );

    return NextResponse.json(
      customers
    );
  } catch (
    error
  ) {
    console.error(
      "Customer GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load customers",
      },
      {
        status:
          500,
      }
    );
  }
}

/* =========================================================
   CREATE CUSTOMER
   ========================================================= */

export async function POST(
  request:
    Request
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

    const body =
      await request.json();

    const name =
      optionalString(
        body.name
      );

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Customer name is required",
        },
        {
          status:
            400,
        }
      );
    }

    const category =
      String(
        body.category ??
          "general"
      )
        .trim()
        .toLowerCase();

    const allowedCategories =
      [
        "self-owned",
        "vip",
        "general",
      ];

    if (
      !allowedCategories.includes(
        category
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid customer category",
        },
        {
          status:
            400,
        }
      );
    }

    const customerCode =
      await generateCustomerCode();

    const payload = {
      customer_code:
        customerCode,

      name,

      category,

      phone:
        optionalString(
          body.phone
        ),

      email:
        optionalString(
          body.email
        ),

      address:
        optionalString(
          body.address
        ),

      city:
        optionalString(
          body.city
        ),

      state:
        optionalString(
          body.state
        ),

      pincode:
        optionalString(
          body.pincode
        ),

      country:
        optionalString(
          body.country
        ),

      notes:
        optionalString(
          body.notes
        ),

      active:
        true,

      archived:
        false,
    };

    const response =
      await fetch(
        `${DIRECTUS_URL}/items/garage_customers`,
        {
          method:
            "POST",

          headers,

          body:
            JSON.stringify(
              payload
            ),

          cache:
            "no-store",
        }
      );

    const result =
      await response.json();

    if (
      !response.ok
    ) {
      console.error(
        "Directus customer creation error:",
        result
      );

      return NextResponse.json(
        {
          error:
            result?.errors?.[0]
              ?.message ||
            "Unable to create customer",
        },
        {
          status:
            response.status,
        }
      );
    }

    const customer =
      result.data;

    return NextResponse.json(
      {
        id:
          String(
            customer.id
          ),

        customerCode:
          customer.customer_code ??
          customerCode,

        name:
          customer.name ??
          name,

        category:
          customer.category ??
          category,

        phone:
          customer.phone ??
          "",

        email:
          customer.email ??
          "",

        pincode:
          customer.pincode ??
          "",
      },
      {
        status:
          201,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Customer creation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to create customer",
      },
      {
        status:
          500,
      }
    );
  }
}