import {
  SpecTemplate,
  SpecificationRow,
  Vehicle,
  VehicleCustomer,
  WorkItem,
} from "@/lib/mock-data";

/* =========================================================
   DIRECTUS CONFIG
   ========================================================= */

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

/* =========================================================
   DIRECTUS TYPES
   ========================================================= */

type DirectusCustomer = {
  id: string | number;

  customer_code?: string;

  name?: string;

  category?: string;

  phone?: string;

  email?: string;

  address?: string;

  city?: string;

  state?: string;

  pincode?: string;

  country?: string;

  notes?: string;

  active?: boolean;

  archived?: boolean;
};

type DirectusVehicle = {
  id: string | number;

  name: string;

  asset_type?: string;

  make: string;

  model: string;

  variant?: string;

  year: number;

  status: string;

  ownership_status?: string;

  customer?:
    | string
    | number
    | DirectusCustomer
    | null;

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

  cover_image?:
    | string
    | null;

  archived?: boolean;
};

type DirectusWorkItem = {
  id: string;

  customer?:
    | string
    | number
    | {
        id:
          | string
          | number;

        customer_code?: string;

        name?: string;

        category?: string;
      }
    | null;

  vehicle?:
    | string
    | number
    | {
        id:
          | string
          | number;
      }
    | null;

  vehicle_text?: string;

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
    | number
    | {
        id:
          | string
          | number;
      };

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
    | number
    | {
        id:
          | string
          | number;
      };

  category?: string;

  specification: string;

  value?: string;

  unit?: string;

  notes?: string;

  sort?: number;
};

/* =========================================================
   CUSTOMER MAPPING
   ========================================================= */

function mapCustomer(
  customer: DirectusCustomer
): VehicleCustomer {
  return {
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

    address:
      customer.address ??
      "",

    city:
      customer.city ??
      "",

    state:
      customer.state ??
      "",

    country:
      customer.country ??
      "",

    notes:
      customer.notes ??
      "",
  };
}

/* =========================================================
   VEHICLE CUSTOMER ID HELPER
   ========================================================= */

function getVehicleCustomerId(
  item: DirectusVehicle
): string | null {
  if (
    item.customer === null ||
    item.customer === undefined
  ) {
    return null;
  }

  if (
    typeof item.customer ===
      "string" ||
    typeof item.customer ===
      "number"
  ) {
    return String(
      item.customer
    );
  }

  if (
    typeof item.customer ===
      "object" &&
    item.customer.id !==
      undefined &&
    item.customer.id !==
      null
  ) {
    return String(
      item.customer.id
    );
  }

  return null;
}

/* =========================================================
   VEHICLE MAPPING
   ========================================================= */

function mapVehicle(
  item: DirectusVehicle,
  customer:
    | DirectusCustomer
    | null = null
): Vehicle {
  const mappedVehicle: Vehicle = {
    id:
      String(
        item.id
      ),

    name:
      item.name,

    assetType:
      item.asset_type,

    make:
      item.make,

    model:
      item.model,

    variant:
      item.variant,

    year:
      item.year,

    status:
      item.status,

    /*
     * Keep ownership status for
     * distinguishing Wishlist.
     */

    ownershipStatus:
      item.ownership_status ===
      "Wishlist"
        ? "Wishlist"
        : "Owned",

    /*
     * CUSTOMER
     */

    customer:
      customer
        ? mapCustomer(
            customer
          )
        : null,

    customerId:
      customer
        ? String(
            customer.id
          )
        : undefined,

    customerCode:
      customer
        ?.customer_code,

    customerName:
      customer
        ?.name,

    customerCategory:
      customer
        ?.category,

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
      item.odometer ??
      0,

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
      item.location ??
      "",

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

  return mappedVehicle;
}

/* =========================================================
   CUSTOMER LOADER - INTERNAL
   ========================================================= */

async function getDirectusCustomers(): Promise<
  DirectusCustomer[]
> {
  const response =
    await fetch(
      `${DIRECTUS_URL}/items/garage_customers?fields=id,customer_code,name,category,phone,email,address,city,state,pincode,country,notes,active,archived&filter[archived][_neq]=true&sort=name`,
      {
        headers:
          directusHeaders,

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    const error =
      await response.text();

    console.error(
      "Unable to load garage customers:",
      response.status,
      error
    );

    throw new Error(
      `Unable to load garage customers from Directus: ${response.status}`
    );
  }

  const result =
    await response.json();

  return (
    result.data as DirectusCustomer[]
  );
}

/* =========================================================
   CUSTOMERS - PUBLIC
   ========================================================= */

export async function getCustomers(): Promise<
  VehicleCustomer[]
> {
  const customers =
    await getDirectusCustomers();

  return customers
    .filter(
      (customer) =>
        customer.active !==
        false
    )
    .map(
      mapCustomer
    );
}

/* =========================================================
   ALL WORK ITEMS
   ========================================================= */

export async function getAllWorkItems(): Promise<
  WorkItem[]
> {
  const response =
    await fetch(
      `${DIRECTUS_URL}/items/garage_work_items?fields=id,customer.id,customer.customer_code,customer.name,customer.category,vehicle.id,vehicle_text,title,category,priority,status,work_description,odometer,target_date,started_date,completed_date,estimated_cost,notes,archived,sort&filter[archived][_neq]=true&sort=priority,target_date,title`,
      {
        headers:
          directusHeaders,

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    const error =
      await response.text();

    console.error(
      "Unable to load all work items:",
      response.status,
      error
    );

    throw new Error(
      `Unable to load work items from Directus: ${response.status}`
    );
  }

  const result =
    await response.json();

  return (
    result.data as DirectusWorkItem[]
  ).map((item) =>
    mapWorkItem(
      item,
      ""
    )
  );
}

/* =========================================================
   WORK ITEM MAPPING
   ========================================================= */

function relationId(
  value:
    | string
    | number
    | { id: string | number }
    | null
    | undefined
): string {
  if (
    typeof value ===
      "string" ||
    typeof value ===
      "number"
  ) {
    return String(value);
  }

  if (
    value &&
    typeof value ===
      "object" &&
    value.id !==
      undefined
  ) {
    return String(
      value.id
    );
  }

  return "";
}

function mapWorkItem(
  item:
    DirectusWorkItem,

  fallbackVehicleId:
    string
): WorkItem {
  const vehicleId =
    relationId(
      item.vehicle
    ) ||
    fallbackVehicleId;

  const customerId =
    relationId(
      item.customer
    );

  const customer =
    item.customer &&
    typeof item.customer ===
      "object"
      ? item.customer
      : null;

  return {
    id:
      String(
        item.id
      ),

    customerId:
      customerId ||
      undefined,

    customerCode:
      customer?.customer_code,

    customerName:
      customer?.name,

    customerCategory:
      customer?.category,

    vehicleId:
      vehicleId ||
      undefined,

    vehicleText:
      item.vehicle_text ??
      undefined,

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

/* =========================================================
   VEHICLES
   ========================================================= */

export async function getVehicles(): Promise<
  Vehicle[]
> {
  const [
    vehicleResponse,
    customers,
  ] =
    await Promise.all([
      fetch(
        `${DIRECTUS_URL}/items/garage_vehicles?filter[archived][_neq]=true&sort=sort,name`,
        {
          headers:
            directusHeaders,

          cache:
            "no-store",
        }
      ),

      getDirectusCustomers(),
    ]);

  if (!vehicleResponse.ok) {
    const error =
      await vehicleResponse.text();

    console.error(
      "Unable to load vehicles:",
      vehicleResponse.status,
      error
    );

    throw new Error(
      `Unable to load vehicles from Directus: ${vehicleResponse.status}`
    );
  }

  const vehicleResult =
    await vehicleResponse.json();

  const directusVehicles =
    vehicleResult.data as DirectusVehicle[];

  /*
   * CUSTOMER ID → CUSTOMER
   */

  const customerMap =
    new Map<
      string,
      DirectusCustomer
    >();

  for (
    const customer of
    customers
  ) {
    customerMap.set(
      String(
        customer.id
      ),
      customer
    );
  }

  /*
   * JOIN VEHICLE → CUSTOMER
   */

  return directusVehicles.map(
    (vehicle) => {
      const customerId =
        getVehicleCustomerId(
          vehicle
        );

      const customer =
        customerId
          ? customerMap.get(
              customerId
            ) ??
            null
          : null;

      return mapVehicle(
        vehicle,
        customer
      );
    }
  );
}

/* =========================================================
   SINGLE VEHICLE
   ========================================================= */

export async function getVehicle(
  id: string
): Promise<
  Vehicle | null
> {
  const vehicleResponse =
    await fetch(
      `${DIRECTUS_URL}/items/garage_vehicles/${encodeURIComponent(
        id
      )}`,
      {
        headers:
          directusHeaders,

        cache:
          "no-store",
      }
    );

  if (
    vehicleResponse.status ===
    404
  ) {
    return null;
  }

  if (!vehicleResponse.ok) {
    const error =
      await vehicleResponse.text();

    console.error(
      "Unable to load vehicle:",
      vehicleResponse.status,
      error
    );

    throw new Error(
      `Unable to load vehicle from Directus: ${vehicleResponse.status}`
    );
  }

  const vehicleResult =
    await vehicleResponse.json();

  const vehicle =
    vehicleResult.data as DirectusVehicle;

  const customerId =
    getVehicleCustomerId(
      vehicle
    );

  let customer:
    | DirectusCustomer
    | null =
      null;

  if (customerId) {
    const customerResponse =
      await fetch(
        `${DIRECTUS_URL}/items/garage_customers/${encodeURIComponent(
          customerId
        )}?fields=id,customer_code,name,category,phone,email,address,city,state,pincode,country,notes,active,archived`,
        {
          headers:
            directusHeaders,

          cache:
            "no-store",
        }
      );

    if (
      customerResponse.ok
    ) {
      const customerResult =
        await customerResponse.json();

      customer =
        customerResult.data as DirectusCustomer;
    } else {
      const error =
        await customerResponse.text();

      console.error(
        "Unable to load vehicle customer:",
        customerResponse.status,
        error
      );
    }
  }

  return mapVehicle(
    vehicle,
    customer
  );
}

/* =========================================================
   VEHICLE WORK ITEMS
   ========================================================= */

export async function getVehicleWorkItems(
  vehicleId:
    string
): Promise<
  WorkItem[]
> {
  const response =
    await fetch(
      `${DIRECTUS_URL}/items/garage_work_items?fields=id,customer.id,customer.customer_code,customer.name,customer.category,vehicle.id,vehicle_text,title,category,priority,status,work_description,odometer,target_date,started_date,completed_date,estimated_cost,notes,archived,sort&filter[vehicle][_eq]=${encodeURIComponent(
        vehicleId
      )}&filter[archived][_neq]=true&sort=priority,sort`,
      {
        headers:
          directusHeaders,

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    const error =
      await response.text();

    console.error(
      "Unable to load vehicle work items:",
      response.status,
      error
    );

    throw new Error(
      `Unable to load work items from Directus: ${response.status}`
    );
  }

  const result =
    await response.json();

  return (
    result.data as DirectusWorkItem[]
  ).map((item) =>
    mapWorkItem(
      item,
      vehicleId
    )
  );
}

/* =========================================================
   SPECIFICATION TEMPLATES
   ========================================================= */

export async function getSpecTemplates(): Promise<
  SpecTemplate[]
> {
  const templateResponse =
    await fetch(
      `${DIRECTUS_URL}/items/garage_spec_templates?filter[active][_eq]=true&sort=sort,name`,
      {
        headers:
          directusHeaders,

        cache:
          "no-store",
      }
    );

  if (
    !templateResponse.ok
  ) {
    const error =
      await templateResponse.text();

    console.error(
      "Unable to load specification templates:",
      templateResponse.status,
      error
    );

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

        cache:
          "no-store",
      }
    );

  if (
    !itemResponse.ok
  ) {
    const error =
      await itemResponse.text();

    console.error(
      "Unable to load specification template items:",
      itemResponse.status,
      error
    );

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
        String(
          template.id
        );

      return {
        id:
          templateId,

        name:
          template.name,

        assetType:
          template.asset_type,

        description:
          template.description,

        items:
          items
            .filter(
              (item) => {
                const itemTemplateId =
                  typeof item.template ===
                    "object" &&
                  item.template !==
                    null
                    ? String(
                        item.template.id
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
                id:
                  String(
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

/* =========================================================
   VEHICLE SPECIFICATIONS
   ========================================================= */

export async function getVehicleSpecifications(
  vehicleId:
    string
): Promise<
  SpecificationRow[]
> {
  const response =
    await fetch(
      `${DIRECTUS_URL}/items/garage_vehicle_specifications?filter[vehicle][_eq]=${encodeURIComponent(
        vehicleId
      )}&sort=sort`,
      {
        headers:
          directusHeaders,

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    const error =
      await response.text();

    console.error(
      "Unable to load vehicle specifications:",
      response.status,
      error
    );

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
      item.category ??
      "",

    specification:
      item.specification ??
      "",

    value:
      item.value ??
      "",

    unit:
      item.unit ??
      "",

    notes:
      item.notes ??
      "",

    sort:
      item.sort,
    }));
}