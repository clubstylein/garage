import TopNav from "@/components/top-nav";
import VehiclesDashboard from "@/components/vehicles-dashboard";

import {
  getAllWorkItems,
  getVehicles,
} from "@/lib/directus";

export default async function VehiclesPage() {
  const [
    vehicles,
    workItems,
  ] = await Promise.all([
    getVehicles(),
    getAllWorkItems(),
  ]);

  return (
    <>
      <TopNav />

      <VehiclesDashboard
        vehicles={vehicles}
        workItems={workItems}
      />
    </>
  );
}