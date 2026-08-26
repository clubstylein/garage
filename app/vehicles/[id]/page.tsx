import { notFound } from "next/navigation";
import VehicleDashboard from "@/components/vehicle-dashboard";
import {
  getVehicle,
  getVehicleWorkItems,
} from "@/lib/directus";

export default async function VehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const vehicle = await getVehicle(id);

  if (!vehicle) {
    notFound();
  }

  const workItems = await getVehicleWorkItems(id);

  return (
    <VehicleDashboard
      vehicle={vehicle}
      workItems={workItems}
    />
  );
}