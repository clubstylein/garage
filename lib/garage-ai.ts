export type GarageAIAction =
  | "create_work"
  | "create_part"
  | "create_customer"
  | "create_vehicle"
  | "create_estimate"
  | "create_invoice"
  | "unknown";

export type GarageAICommand = {
  action: GarageAIAction;
  confidence: "high" | "medium" | "low";
  summary: string;

  customer?: string;
  vehicle?: string;

  title?: string;
  category?: string;
  description?: string;
  priority?: number;
  status?: string;
  notes?: string;

  partName?: string;
  partNumber?: string;
  brand?: string;
  supplier?: string;
  supplierPartNumber?: string;
  costPrice?: number;
  sellingPrice?: number;
  currency?: string;

  customerName?: string;
  customerCategory?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;

  vehicleName?: string;
  make?: string;
  model?: string;
  variant?: string;
  year?: number;
  registrationNumber?: string;
  vin?: string;
  enginePlatform?: string;
  engineCc?: number;
  odometer?: number;
  odometerUnit?: "km" | "mi";
  location?: string;

  warnings?: string[];
};

export type GarageAIContext = {
  customers: Array<{
    id: string;
    name: string;
    customerCode?: string;
  }>;
  vehicles: Array<{
    id: string;
    name: string;
    make: string;
    model: string;
    variant?: string;
    year: number;
    customerId?: string;
    customerName?: string;
  }>;
};

export type GarageAIInterpretation = {
  parser: "standard" | "ai";
  command: GarageAICommand;
};
