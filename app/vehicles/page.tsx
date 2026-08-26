import VehiclesDashboard from "@/components/vehicles-dashboard";
import TopNav from "@/components/top-nav";
import { getVehicles } from "@/lib/directus";

export default async function VehiclesPage() {
  const vehicles = await getVehicles();

  return (
    <>
      <TopNav />
      <VehiclesDashboard vehicles={vehicles} />
    </>
  );
}