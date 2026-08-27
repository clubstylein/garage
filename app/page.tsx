import TopNav from "@/components/top-nav";
import GarageDashboard from "@/components/garage-dashboard";

import {
  getAllWorkItems,
  getVehicles,
} from "@/lib/directus";

export default async function GaragePage() {
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

      <GarageDashboard
        vehicles={vehicles}
        workItems={workItems}
      />
    </>
  );
}