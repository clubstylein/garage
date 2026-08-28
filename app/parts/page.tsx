import TopNav from "@/components/top-nav";
import PartsDashboard from "@/components/parts-dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function PartsPage() {
  return (
    <>
      <TopNav />
      <PartsDashboard />
    </>
  );
}
