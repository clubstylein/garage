export type VehicleCustomer = {
  id: string;

  customerCode?: string;

  name: string;

  category: string;

  phone?: string;

  email?: string;

  pincode?: string;
};

export type Vehicle = {
  id: string;

  name: string;

  assetType?: string;

  make: string;

  model: string;

  variant?: string;

  year: number;

  status: string;

  registrationNumber?: string;

  vin?: string;

  engineNumber?: string;

  engine?: string;

  engineCc?: number;

  odometer: number;

  odometerUnit:
    | "km"
    | "mi";

  purchaseDate?: string;

  purchasePrice?: number;

  currency?: string;

  location: string;

  notes?: string;

  ownershipStatus?:
    | "Owned"
    | "Wishlist";

  customer?:
    | VehicleCustomer
    | null;

  customerId?: string;

  customerCode?: string;

  customerName?: string;

  customerCategory?: string;

  coverImageId?: string;

  coverImage?: string;
};

export type WorkItem = {
  id: string;

  vehicleId: string;

  title: string;

  category?: string;

  priority?: number;

  status?: string;

  workDescription?: string;

  odometer?: number;

  targetDate?: string;

  startedDate?: string;

  completedDate?: string;

  estimatedCost?: number;

  notes?: string;
};

export type SpecificationRow = {
  category: string;

  specification: string;

  value: string;

  unit?: string;

  notes?: string;

  sort?: number;
};

export type SpecTemplateItem = {
  id: string;

  category: string;

  specification: string;

  defaultUnit?: string;

  sort?: number;

  required?: boolean;
};

export type SpecTemplate = {
  id: string;

  name: string;

  assetType?: string;

  description?: string;

  items:
    SpecTemplateItem[];
};