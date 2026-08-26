import TopNav from "@/components/top-nav";
import { getVehicles } from "@/lib/directus";

export default async function Home() {
  const vehicles = await getVehicles();

  const stats = {
    vehicles: vehicles.length,

    running: vehicles.filter(
      (vehicle) => vehicle.status === "Running"
    ).length,

    repair: vehicles.filter(
      (vehicle) => vehicle.status === "Repair"
    ).length,

    projects: vehicles.filter(
      (vehicle) =>
        vehicle.status === "Custom Project"
    ).length,

    forParts: vehicles.filter(
      (vehicle) =>
        vehicle.status === "For Parts"
    ).length,
  };

  return (
    <>
      <TopNav />

      <main className="min-h-screen bg-[#f5f6f8] text-[#1d2228]">
        {/* HEADER */}
        <header className="border-b border-[#e1e4e8] bg-white">
          <div className="px-5 py-7 lg:px-8">
            <h1 className="text-2xl font-semibold tracking-tight">
              Garage
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Workshop overview and current activity
            </p>
          </div>
        </header>

        <div className="px-5 py-7 lg:px-8">
          {/* VEHICLE SUMMARY */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            <SummaryCard
              label="Vehicles"
              value={stats.vehicles}
            />

            <SummaryCard
              label="Running"
              value={stats.running}
            />

            <SummaryCard
              label="Repair"
              value={stats.repair}
            />

            <SummaryCard
              label="Projects"
              value={stats.projects}
            />

            <SummaryCard
              label="For Parts"
              value={stats.forParts}
            />
          </div>

          {/* NEXT GARAGE DASHBOARD SECTIONS */}
          <div className="mt-8">
            <div className="rounded-xl border border-[#dfe2e6] bg-white p-6">
              <h2 className="text-lg font-semibold">
                Garage Activity
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Work items, vehicles needing attention and upcoming
                maintenance will appear here.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-[#dfe2e6] bg-white px-5 py-5">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </div>

      <div className="mt-3 text-2xl font-semibold">
        {value}
      </div>
    </div>
  );
}