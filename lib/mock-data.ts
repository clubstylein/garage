export type VehicleCustomer = {
  id: string;
  customerCode?: string;
  name: string;
  category: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  notes?: string;
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
  odometerUnit: "km" | "mi";
  purchaseDate?: string;
  purchasePrice?: number;
  currency?: string;
  location: string;
  notes?: string;
  ownershipStatus?: "Owned" | "Wishlist";
  customer?: VehicleCustomer | null;
  customerId?: string;
  customerCode?: string;
  customerName?: string;
  customerCategory?: string;
  coverImageId?: string;
  coverImage?: string;
};

export type WorkItem = {
  id: string;
  customerId?: string;
  customerCode?: string;
  customerName?: string;
  customerCategory?: string;
  vehicleId?: string;
  vehicleText?: string;
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

export type GaragePart = {
  id: string;
  partNumber?: string;
  name: string;
  brand?: string;
  description?: string;
  costPrice?: number;
  sellingPrice?: number;
  currency?: string;
  supplier?: string;
  supplierPartNumber?: string;
  stockQuantity?: number;
  reorderLevel?: number;
  notes?: string;
  active?: boolean;
};

export type WorkItemPart = {
  id: string;
  workItemId: string;
  partId: string;
  part?: GaragePart;
  quantityNeeded?: number;
  quantityUsed?: number;
  status?: string;
  unitCost?: number;
  unitPrice?: number;
  billable?: boolean;
  notes?: string;
};

export type Bill = {
  id: string;
  billNumber?: string;
  customerId: string;
  type: "Estimate" | "Invoice";
  status?: string;
  billDate?: string;
  validUntil?: string;
  dueDate?: string;
  currency?: string;
  subtotal?: number;
  discount?: number;
  tax?: number;
  total?: number;
  notes?: string;
  terms?: string;
};

export type BillItem = {
  id: string;
  billId: string;
  lineType: "Work" | "Part" | "Manual";
  workItemId?: string;
  partId?: string;
  description: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  tax?: number;
  amount?: number;
  billable?: boolean;
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
  items: SpecTemplateItem[];
};
