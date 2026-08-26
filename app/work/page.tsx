import TopNav from "@/components/top-nav";
import WorkDashboard from "@/components/work-dashboard";
import {
  getAllWorkItems,
  getVehicles,
} from "@/lib/directus";

export default async function WorkPage() {
  const [
    workItems,
    vehicles,
  ] = await Promise.all([
    getAllWorkItems(),
    getVehicles(),
  ]);

  return (
    <>
      <TopNav />

      <WorkDashboard
        workItems={workItems}
        vehicles={vehicles}
      />
    </>
  );
}