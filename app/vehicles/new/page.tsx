import Link from "next/link";

import TopNav from "@/components/top-nav";

import AddVehicleForm from "@/components/add-vehicle-form";

import {
  getCustomers,
  getSpecTemplates,
} from "@/lib/directus";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

export default async function AddVehiclePage() {
  const [
    templates,
    customers,
  ] =
    await Promise.all([
      getSpecTemplates(),
      getCustomers(),
    ]);

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#1c2026]">
      <TopNav />

      <main>
        <header className="border-b border-[#e1e4e8] bg-white">
          <div className="px-5 py-5 lg:px-8">
            <Link
              href="/vehicles"
              className="mb-3 inline-block text-sm text-gray-500 hover:text-black"
            >
              ← Vehicles
            </Link>

            <h1 className="text-2xl font-semibold">
              Add Vehicle
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Add a self-owned, customer or wishlist vehicle
            </p>
          </div>
        </header>

        <div className="px-5 py-6 lg:px-8">
          <AddVehicleForm
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