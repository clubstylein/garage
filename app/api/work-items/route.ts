import { NextResponse } from "next/server";

const DIRECTUS_URL =
  process.env.DIRECTUS_URL;

const DIRECTUS_TOKEN =
  process.env.DIRECTUS_TOKEN;

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
        { status: 500 }
      );
    }

    const body =
      await request.json();

    if (
      !body.vehicle ||
      !body.title
    ) {
      return NextResponse.json(
        {
          error:
            "Vehicle and work title are required",
        },
        { status: 400 }
      );
    }

    const payload = {
      vehicle:
        body.vehicle,

      title:
        body.title,

      category:
        body.category ||
        null,

      priority:
        body.priority
          ? Number(
              body.priority
            )
          : 3,

      status:
        body.status ||
        "Planned",

      work_description:
        body.work_description ||
        null,

      odometer:
        body.odometer
          ? Number(
              body.odometer
            )
          : null,

      target_date:
        body.target_date ||
        null,

      started_date:
        body.started_date ||
        null,

      completed_date:
        body.completed_date ||
        null,

      estimated_cost:
        body.estimated_cost
          ? Number(
              body.estimated_cost
            )
          : null,

      notes:
        body.notes ||
        null,

      archived:
        false,
    };

    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_work_items`,
      {
        method: "POST",

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
      }
    );

    const result =
      await response.json();

    if (!response.ok) {
      console.error(
        "Directus work item error:",
        result
      );

      return NextResponse.json(
        {
          error:
            result?.errors?.[0]
              ?.message ||
            "Unable to create work item",
        },
        {
          status:
            response.status,
        }
      );
    }

    return NextResponse.json(
      result.data,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create work item error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create work item",
      },
      { status: 500 }
    );
  }
}