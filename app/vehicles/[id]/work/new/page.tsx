import { notFound } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/top-nav";
import AddWorkForm from "@/components/add-work-form";
import { getVehicle } from "@/lib/directus";

export default async function AddWorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const vehicle = await getVehicle(id);

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#1d2228]">
      <TopNav />

      <header className="border-b border-[#e1e4e8] bg-white">
        <div className="px-5 py-5 lg:px-8">
          <Link
            href={`/vehicles/${vehicle.id}`}
            className="mb-3 inline-block text-sm text-gray-500 hover:text-black"
          >
            ← {vehicle.name}
          </Link>

          <h1 className="text-2xl font-semibold">
            Add Work
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
        </div>
      </header>

      <main className="px-5 py-6 lg:px-8">
        <AddWorkForm vehicle={vehicle} />
      </main>
    </div>
  );
}