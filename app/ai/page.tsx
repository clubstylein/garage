import TopNav from "@/components/top-nav";
import AiDashboard from "@/components/ai-dashboard";
import {
  getCustomers,
  getVehicles,
} from "@/lib/directus";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

export default async function AIPage() {
  const [
    customers,
    vehicles,
  ] =
    await Promise.all([
      getCustomers(),
      getVehicles(),
    ]);

  return (
    <>
      <TopNav />

      <AiDashboard
        customers={customers}
        vehicles={vehicles}
      />
    </>
  );
}
