import {
  notFound,
} from "next/navigation";

import Link from "next/link";

import TopNav from "@/components/top-nav";

import EditVehicleForm from "@/components/edit-vehicle-form";

import {
  getCustomers,
  getSpecTemplates,
  getVehicle,
  getVehicleSpecifications,
} from "@/lib/directus";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

export default async function EditVehiclePage({
  params,
}: {
  params:
    Promise<{
      id: string;
    }>;
}) {
  const {
    id,
  } =
    await params;

  const [
    vehicle,
    specifications,
    templates,
    customers,
  ] =
    await Promise.all([
      getVehicle(
        id
      ),

      getVehicleSpecifications(
        id
      ),

      getSpecTemplates(),

      getCustomers(),
    ]);

  if (
    !vehicle
  ) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#1c2026]">
      <TopNav />

      <main>
        <header className="border-b border-[#e1e4e8] bg-white">
          <div className="px-5 py-5 lg:px-8">
            <Link
              href={`/vehicles/${vehicle.id}`}
              className="mb-3 inline-block text-sm text-gray-500 hover:text-black"
            >
              ← Vehicle Dashboard
            </Link>

            <h1 className="text-2xl font-semibold">
              Edit{" "}
              {
                vehicle.name
              }
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Update vehicle details, customer, image and specifications
            </p>
          </div>
        </header>

        <div className="px-5 py-6 lg:px-8">
          <EditVehicleForm
            vehicle={
              vehicle
            }
            initialSpecifications={
              specifications
            }
            templates={
              templates
            }
            customers={
              customers
            }
          />
        </div>
      </main>
    </div>
  );
}