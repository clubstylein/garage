import TopNav from "@/components/top-nav";
import BillingDashboard from "@/components/billing-dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function BillingPage() {
  return (
    <>
      <TopNav />
      <BillingDashboard />
    </>
  );
}
