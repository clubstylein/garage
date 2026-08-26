  import {
    SpecTemplate,
    SpecificationRow,
    Vehicle,
    WorkItem,
  } from "@/lib/mock-data";

  const DIRECTUS_URL =
    process.env.DIRECTUS_URL;

  const DIRECTUS_TOKEN =
    process.env.DIRECTUS_TOKEN;

  if (!DIRECTUS_URL) {
    throw new Error(
      "DIRECTUS_URL is not configured"
    );
  }

  if (!DIRECTUS_TOKEN) {
    throw new Error(
      "DIRECTUS_TOKEN is not configured"
    );
  }

  const directusHeaders = {
    Authorization:
      `Bearer ${DIRECTUS_TOKEN}`,
  };

  type DirectusVehicle = {
    id: string;
    name: string;
    asset_type?: string;
    make: string;
    model: string;
    variant?: string;
    year: number;
    status: string;
    ownership_status?: string;
    registration_number?: string;
    vin?: string;
    engine_number?: string;
    engine_platform?: string;
    engine_cc?: number;
    odometer?: number;
    odometer_unit?: string;
    purchase_date?: string;
    purchase_price?: number;
    currency?: string;
    location?: string;
    notes?: string;
    cover_image?: string | null;
    archived?: boolean;
  };

type DirectusWorkItem = {
  id: string;

  vehicle?:
    | string
    | {
        id: string;
      }
    | null;

  title: string;
  category?: string;
  priority?: number;
  status?: string;
  work_description?: string;
  odometer?: number;
  target_date?: string;
  started_date?: string;
  completed_date?: string;
  estimated_cost?: number;
  notes?: string;
  archived?: boolean;
  sort?: number;
};

  type DirectusSpecTemplate = {
    id: string;
    name: string;
    asset_type?: string;
    description?: string;
    active?: boolean;
  };

  type DirectusSpecTemplateItem = {
    id: string;

    template:
      | string
      | { id: string };

    category: string;
    specification: string;
    default_unit?: string;
    sort?: number;
    required?: boolean;
  };

  type DirectusVehicleSpecification = {
    id: string;

    vehicle?:
      | string
      | { id: string };

    category?: string;
    specification: string;
    value?: string;
    unit?: string;
    notes?: string;
    sort?: number;
  };

  function mapVehicle(
    item: DirectusVehicle
  ): Vehicle {
    return {
      id: item.id,

      name: item.name,

      assetType:
        item.asset_type,

      make: item.make,

      model: item.model,

      variant:
        item.variant,

      year: item.year,

      status:
        item.status,
  
      ownershipStatus:
        item.ownership_status === "Wishlist"
          ? "Wishlist"
          : "Owned",

      registrationNumber:
        item.registration_number,

      vin:
        item.vin,

      engineNumber:
        item.engine_number,

      engine:
        item.engine_platform,

      engineCc:
        item.engine_cc,

      odometer:
        item.odometer ?? 0,

      odometerUnit:
        item.odometer_unit ===
        "mi"
          ? "mi"
          : "km",

      purchaseDate:
        item.purchase_date,

      purchasePrice:
        item.purchase_price,

      currency:
        item.currency,

      location:
        item.location ?? "",

      notes:
        item.notes,

      coverImageId:
        item.cover_image ??
        undefined,

      coverImage:
        item.cover_image
          ? `/api/files/${item.cover_image}`
          : undefined,
    };
  }

  
  export async function getAllWorkItems(): Promise<WorkItem[]> {
  const response = await fetch(
    `${DIRECTUS_URL}/items/garage_work_items?fields=id,vehicle.id,title,category,priority,status,work_description,odometer,target_date,started_date,completed_date,estimated_cost,notes,archived,sort&filter[archived][_neq]=true&sort=priority,target_date,title`,
    {
      headers: directusHeaders,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const error = await response.text();

    console.error(
      "Unable to load all work items:",
      response.status,
      error
    );

    throw new Error(
      `Unable to load work items from Directus: ${response.status}`
    );
  }

  const result = await response.json();

  return (
    result.data as DirectusWorkItem[]
  ).map((item) => {
    const vehicleId =
      typeof item.vehicle === "string"
        ? item.vehicle
        : item.vehicle?.id ?? "";

    return {
      id: item.id,

      vehicleId,

      title: item.title,

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
  });
}

  function mapWorkItem(
    item: DirectusWorkItem,
    fallbackVehicleId: string
  ): WorkItem {
    const vehicleId =
      typeof item.vehicle ===
      "string"
        ? item.vehicle
        : item.vehicle?.id ??
          fallbackVehicleId;

    return {
      id: item.id,

      vehicleId,

      title: item.title,

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

  /*
  * VEHICLES
  */

  export async function getVehicles(): Promise<
    Vehicle[]
  > {
    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_vehicles?filter[archived][_neq]=true&sort=sort,name`,
      {
        headers:
          directusHeaders,

        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Unable to load vehicles from Directus: ${response.status}`
      );
    }

    const result =
      await response.json();

    return (
      result.data as DirectusVehicle[]
    ).map(mapVehicle);
  }

  export async function getVehicle(
    id: string
  ): Promise<Vehicle | null> {
    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_vehicles/${encodeURIComponent(
        id
      )}`,
      {
        headers:
          directusHeaders,

        cache: "no-store",
      }
    );

    if (
      response.status === 404
    ) {
      return null;
    }

    if (!response.ok) {
      throw new Error(
        `Unable to load vehicle from Directus: ${response.status}`
      );
    }

    const result =
      await response.json();

    return mapVehicle(
      result.data
    );
  }

  /*
  * WORK ITEMS
  */

export async function getVehicleWorkItems(
  vehicleId: string
): Promise<WorkItem[]> {
  const response = await fetch(
    `${DIRECTUS_URL}/items/garage_work_items?fields=id,vehicle.id,title,category,priority,status,work_description,odometer,target_date,started_date,completed_date,estimated_cost,notes,archived,sort&filter[vehicle][_eq]=${encodeURIComponent(
      vehicleId
    )}&filter[archived][_neq]=true&sort=priority,sort`,
    {
      headers: directusHeaders,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const error = await response.text();

    console.error(
      "Unable to load vehicle work items:",
      response.status,
      error
    );

    throw new Error(
      `Unable to load work items from Directus: ${response.status}`
    );
  }

  const result = await response.json();

  return (
    result.data as DirectusWorkItem[]
  ).map((item) =>
    mapWorkItem(
      item,
      vehicleId
    )
  );
}

  /*
  * SPECIFICATION TEMPLATES
  */

  export async function getSpecTemplates(): Promise<
    SpecTemplate[]
  > {
    const templateResponse =
      await fetch(
        `${DIRECTUS_URL}/items/garage_spec_templates?filter[active][_eq]=true&sort=sort,name`,
        {
          headers:
            directusHeaders,

          cache: "no-store",
        }
      );

    if (
      !templateResponse.ok
    ) {
      throw new Error(
        `Unable to load specification templates: ${templateResponse.status}`
      );
    }

    const itemResponse =
      await fetch(
        `${DIRECTUS_URL}/items/garage_spec_template_items?sort=sort`,
        {
          headers:
            directusHeaders,

          cache: "no-store",
        }
      );

    if (!itemResponse.ok) {
      throw new Error(
        `Unable to load specification template items: ${itemResponse.status}`
      );
    }

    const templateResult =
      await templateResponse.json();

    const itemResult =
      await itemResponse.json();

    const templates =
      templateResult.data as DirectusSpecTemplate[];

    const items =
      itemResult.data as DirectusSpecTemplateItem[];

    return templates.map(
      (template) => {
        const templateId =
          String(template.id);

        return {
          id: templateId,

          name:
            template.name,

          assetType:
            template.asset_type,

          description:
            template.description,

          items: items
            .filter(
              (item) => {
                const itemTemplateId =
                  typeof item.template ===
                    "object" &&
                  item.template !==
                    null
                    ? String(
                        item.template
                          .id
                      )
                    : String(
                        item.template
                      );

                return (
                  itemTemplateId ===
                  templateId
                );
              }
            )

            .map(
              (item) => ({
                id: String(
                  item.id
                ),

                category:
                  item.category ??
                  "",

                specification:
                  item.specification ??
                  "",

                defaultUnit:
                  item.default_unit ??
                  "",

                sort:
                  item.sort,

                required:
                  item.required ??
                  false,
              })
            ),
        };
      }
    );
  }

  /*
  * VEHICLE SPECIFICATIONS
  */

  export async function getVehicleSpecifications(
    vehicleId: string
  ): Promise<
    SpecificationRow[]
  > {
    const response = await fetch(
      `${DIRECTUS_URL}/items/garage_vehicle_specifications?filter[vehicle][_eq]=${encodeURIComponent(
        vehicleId
      )}&sort=sort`,
      {
        headers:
          directusHeaders,

        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Unable to load vehicle specifications: ${response.status}`
      );
    }

    const result =
      await response.json();

    return (
      result.data as DirectusVehicleSpecification[]
    ).map((item) => ({
      category:
        item.category ?? "",

      specification:
        item.specification ??
        "",

      value:
        item.value ?? "",

      unit:
        item.unit ?? "",

      notes:
        item.notes ?? "",

      sort:
        item.sort,
    }));
  }