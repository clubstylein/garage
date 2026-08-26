import { NextResponse } from "next/server";

const DIRECTUS_URL =
  process.env.DIRECTUS_URL;

const DIRECTUS_TOKEN =
  process.env.DIRECTUS_TOKEN;

function authHeaders() {
  return {
    Authorization:
      `Bearer ${DIRECTUS_TOKEN}`,
  };
}

function jsonHeaders() {
  return {
    Authorization:
      `Bearer ${DIRECTUS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

/*
 * GET ALL WORK ITEMS FOR VEHICLE
 */

export async function GET(
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

    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_work_items?filter[vehicle][_eq]=${encodeURIComponent(
        id
      )}&filter[archived][_neq]=true&sort=priority,sort`,
      {
        headers: authHeaders(),
        cache: "no-store",
      }
    );

    const result =
      await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            result?.errors?.[0]
              ?.message ||
            "Unable to load work items",
        },
        {
          status:
            response.status,
        }
      );
    }

    const items =
      result.data.map(
        (item: any) => ({
          id: item.id,

          vehicleId:
            typeof item.vehicle ===
            "string"
              ? item.vehicle
              : item.vehicle?.id ||
                id,

          title:
            item.title,

          category:
            item.category,

          priority:
            item.priority,

          status:
            item.status,

          workDescription:
            item.work_description,

          odometer:
            item.odometer,

          targetDate:
            item.target_date,

          startedDate:
            item.started_date,

          completedDate:
            item.completed_date,

          estimatedCost:
            item.estimated_cost,

          notes:
            item.notes,
        })
      );

    return NextResponse.json(
      items
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Unable to load work items",
      },
      { status: 500 }
    );
  }
}

/*
 * ADD WORK
 */

export async function POST(
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

    const { id } =
      await params;

    const body =
      await request.json();

    if (!body.title) {
      return NextResponse.json(
        {
          error:
            "Work title is required",
        },
        { status: 400 }
      );
    }

    const payload =
      makePayload(
        body,
        id
      );

    const response =
      await fetch(
        `${DIRECTUS_URL}/items/garage_work_items`,
        {
          method: "POST",
          headers:
            jsonHeaders(),
          body: JSON.stringify(
            payload
          ),
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      console.error(
        "Create work error:",
        result
      );

      return NextResponse.json(
        {
          error:
            result?.errors?.[0]
              ?.message ||
            "Unable to add work item",
        },
        {
          status:
            response.status,
        }
      );
    }

    return NextResponse.json(
      mapItem(
        result.data,
        id
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Unable to add work item",
      },
      { status: 500 }
    );
  }
}

/*
 * EDIT WORK
 */

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

    const { id } =
      await params;

    const body =
      await request.json();

    if (
      !body.id ||
      !body.title
    ) {
      return NextResponse.json(
        {
          error:
            "Work item ID and title are required",
        },
        { status: 400 }
      );
    }

    const payload =
      makePayload(
        body,
        id
      );

    const response =
      await fetch(
        `${DIRECTUS_URL}/items/garage_work_items/${encodeURIComponent(
          body.id
        )}`,
        {
          method: "PATCH",
          headers:
            jsonHeaders(),
          body: JSON.stringify(
            payload
          ),
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      console.error(
        "Update work error:",
        result
      );

      return NextResponse.json(
        {
          error:
            result?.errors?.[0]
              ?.message ||
            "Unable to update work item",
        },
        {
          status:
            response.status,
        }
      );
    }

    return NextResponse.json(
      mapItem(
        result.data,
        id
      )
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Unable to update work item",
      },
      { status: 500 }
    );
  }
}

function makePayload(
  body: any,
  vehicleId: string
) {
  return {
    vehicle: vehicleId,

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

    archived: false,
  };
}

function mapItem(
  item: any,
  vehicleId: string
) {
  return {
    id: item.id,

    vehicleId,

    title:
      item.title,

    category:
      item.category,

    priority:
      item.priority,

    status:
      item.status,

    workDescription:
      item.work_description,

    odometer:
      item.odometer,

    targetDate:
      item.target_date,

    startedDate:
      item.started_date,

    completedDate:
      item.completed_date,

    estimatedCost:
      item.estimated_cost,

    notes:
      item.notes,
  };
}