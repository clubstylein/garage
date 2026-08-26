"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Vehicle } from "@/lib/mock-data";
import VehicleWorkModal from "@/components/vehicle-work-modal";

export default function GarageDashboard({
  vehicles,
}: {
  vehicles: Vehicle[];
}) {
  const [search, setSearch] = useState("");
  const [ownership, setOwnership] = useState("All");
  const [status, setStatus] = useState("All");
  const [location, setLocation] = useState("All");

  const [workVehicle, setWorkVehicle] =
    useState<Vehicle | null>(null);

  /*
   * HELPERS
   */

  function isWishlistVehicle(
    vehicle: Vehicle
  ) {
    return (
      String(
        vehicle.ownershipStatus || ""
      )
        .trim()
        .toLowerCase() ===
      "wishlist"
    );
  }

  /*
   * BASE OWNED / WISHLIST
   */

  const ownedVehicles = useMemo(
    () =>
      vehicles.filter(
        (vehicle) =>
          !isWishlistVehicle(vehicle)
      ),
    [vehicles]
  );

  const wishlistVehicles = useMemo(
    () =>
      vehicles.filter((vehicle) =>
        isWishlistVehicle(vehicle)
      ),
    [vehicles]
  );

  /*
   * LOCATIONS
   */

  const locations = useMemo(() => {
    return Array.from(
      new Set(
        vehicles
          .map(
            (vehicle) =>
              vehicle.location
          )
          .filter(Boolean)
      )
    ).sort();
  }, [vehicles]);

  /*
   * FILTER FUNCTION
   */

  function vehicleMatchesFilters(
    vehicle: Vehicle
  ) {
    const query = search
      .trim()
      .toLowerCase();

    const wishlist =
      isWishlistVehicle(vehicle);

    const matchesSearch =
      !query ||
      vehicle.name
        ?.toLowerCase()
        .includes(query) ||
      vehicle.make
        ?.toLowerCase()
        .includes(query) ||
      vehicle.model
        ?.toLowerCase()
        .includes(query) ||
      vehicle.variant
        ?.toLowerCase()
        .includes(query) ||
      vehicle.registrationNumber
        ?.toLowerCase()
        .includes(query);

    const matchesOwnership =
      ownership === "All" ||
      (ownership === "Wishlist" &&
        wishlist) ||
      (ownership === "Owned" &&
        !wishlist);

    const matchesStatus =
      status === "All" ||
      vehicle.status === status;

    const matchesLocation =
      location === "All" ||
      vehicle.location === location;

    return (
      matchesSearch &&
      matchesOwnership &&
      matchesStatus &&
      matchesLocation
    );
  }

  /*
   * FILTERED SECTIONS
   */

  const filteredOwned =
    useMemo(() => {
      return ownedVehicles.filter(
        vehicleMatchesFilters
      );
    }, [
      ownedVehicles,
      search,
      ownership,
      status,
      location,
    ]);

  const filteredWishlist =
    useMemo(() => {
      return wishlistVehicles.filter(
        vehicleMatchesFilters
      );
    }, [
      wishlistVehicles,
      search,
      ownership,
      status,
      location,
    ]);

  /*
   * STATS
   *
   * Running / Repair / Projects /
   * For Parts count OWNED vehicles only.
   */

  const stats = {
    all: vehicles.length,

    owned:
      ownedVehicles.length,

    wishlist:
      wishlistVehicles.length,

    running:
      ownedVehicles.filter(
        (vehicle) =>
          vehicle.status ===
          "Running"
      ).length,

    repair:
      ownedVehicles.filter(
        (vehicle) =>
          vehicle.status ===
          "Repair"
      ).length,

    projects:
      ownedVehicles.filter(
        (vehicle) =>
          vehicle.status ===
          "Custom Project"
      ).length,

    forParts:
      ownedVehicles.filter(
        (vehicle) =>
          vehicle.status ===
          "For Parts"
      ).length,
  };

  const totalShown =
    filteredOwned.length +
    filteredWishlist.length;

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#1d2228]">
      {/* HEADER */}

      <div className="border-b border-[#e1e4e8] bg-white">
        <div className="flex items-center justify-between px-5 py-7 lg:px-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Vehicles
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Owned vehicles and wishlist
            </p>
          </div>

          <Link
            href="/vehicles/new"
            className="rounded-lg bg-[#1d2228] px-5 py-3 text-sm font-medium text-white hover:bg-black"
          >
            + Add Vehicle
          </Link>
        </div>
      </div>

      <div className="px-5 py-7 lg:px-8">
        {/* SUMMARY */}

<div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
            <SummaryCard
            label="All"
            value={stats.all}
          />

          <SummaryCard
            label="Owned"
            value={stats.owned}
          />

          <SummaryCard
            label="Wishlist"
            value={
              stats.wishlist
            }
            wishlist
          />

          <SummaryCard
            label="Running"
            value={
              stats.running
            }
          />

          <SummaryCard
            label="Repair"
            value={
              stats.repair
            }
          />

          <SummaryCard
            label="Projects"
            value={
              stats.projects
            }
          />

          <SummaryCard
            label="For Parts"
            value={
              stats.forParts
            }
          />
        </div>

        {/* FILTER BAR */}

        <section className="mt-8">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Vehicles
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {totalShown}{" "}
                {totalShown === 1
                  ? "vehicle"
                  : "vehicles"}{" "}
                shown
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* SEARCH */}

              <input
                type="search"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search vehicles..."
                className="w-72 rounded-lg border border-[#d8dce1] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]"
              />

              {/* OWNERSHIP */}

              <select
                value={ownership}
                onChange={(e) =>
                  setOwnership(
                    e.target.value
                  )
                }
                className="rounded-lg border border-[#d8dce1] bg-white px-4 py-2.5 text-sm outline-none"
              >
                <option value="All">
                  Owned + Wishlist
                </option>

                <option value="Owned">
                  Owned
                </option>

                <option value="Wishlist">
                  Wishlist
                </option>
              </select>

              {/* STATUS */}

              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value
                  )
                }
                className="rounded-lg border border-[#d8dce1] bg-white px-4 py-2.5 text-sm outline-none"
              >
                <option value="All">
                  All Status
                </option>

                <option value="Running">
                  Running
                </option>

                <option value="Repair">
                  Repair
                </option>

                <option value="Custom Project">
                  Custom Project
                </option>

                <option value="For Parts">
                  For Parts
                </option>

                <option value="Stored">
                  Stored
                </option>

                <option value="Sold">
                  Sold
                </option>
              </select>

              {/* LOCATION */}

              <select
                value={location}
                onChange={(e) =>
                  setLocation(
                    e.target.value
                  )
                }
                className="rounded-lg border border-[#d8dce1] bg-white px-4 py-2.5 text-sm outline-none"
              >
                <option value="All">
                  All Locations
                </option>

                {locations.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* OWNED SECTION */}

          {ownership !==
            "Wishlist" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Owned Vehicles
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {
                      filteredOwned.length
                    }{" "}
                    {filteredOwned.length ===
                    1
                      ? "vehicle"
                      : "vehicles"}
                  </p>
                </div>
              </div>

              {filteredOwned.length >
              0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {filteredOwned.map(
                    (vehicle) => (
                      <VehicleCard
                        key={
                          vehicle.id
                        }
                        vehicle={
                          vehicle
                        }
                        onWork={() =>
                          setWorkVehicle(
                            vehicle
                          )
                        }
                      />
                    )
                  )}
                </div>
              ) : (
                <EmptySection text="No owned vehicles match the selected filters." />
              )}
            </div>
          )}

          {/* WISHLIST SECTION */}

          {ownership !==
            "Owned" && (
            <div
              className={
                ownership ===
                "Wishlist"
                  ? ""
                  : "mt-10"
              }
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">
                      Wishlist
                    </h2>

                    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      ★
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    {
                      filteredWishlist.length
                    }{" "}
                    {filteredWishlist.length ===
                    1
                      ? "vehicle"
                      : "vehicles"}
                  </p>
                </div>
              </div>

              {filteredWishlist.length >
              0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {filteredWishlist.map(
                    (vehicle) => (
                      <VehicleCard
                        key={
                          vehicle.id
                        }
                        vehicle={
                          vehicle
                        }
                        wishlist
                        onWork={() =>
                          setWorkVehicle(
                            vehicle
                          )
                        }
                      />
                    )
                  )}
                </div>
              ) : (
                <EmptySection text="No wishlist vehicles match the selected filters." />
              )}
            </div>
          )}
        </section>
      </div>

      {/* WORK POPUP */}

      {workVehicle && (
        <VehicleWorkModal
          vehicle={
            workVehicle
          }
          onClose={() =>
            setWorkVehicle(
              null
            )
          }
        />
      )}
    </main>
  );
}

/*
 * VEHICLE CARD
 */

function VehicleCard({
  vehicle,
  wishlist = false,
  onWork,
}: {
  vehicle: Vehicle;
  wishlist?: boolean;
  onWork: () => void;
}) {
  return (
    <div
      className={`group min-w-0 overflow-hidden rounded-xl border transition hover:shadow-sm ${
        wishlist
          ? "border-amber-300 bg-amber-50 hover:border-amber-400"
          : "border-[#dfe2e6] bg-white hover:border-[#bfc4ca]"
      }`}
    >
      {/* IMAGE */}

      <div
        className={`relative h-44 w-full overflow-hidden ${
          wishlist
            ? "bg-amber-100/60"
            : "bg-[#e9ebee]"
        }`}
      >
        {vehicle.coverImage ? (
          <img
            src={
              vehicle.coverImage
            }
            alt={
              vehicle.name
            }
            className="block h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
            Vehicle Photo
          </div>
        )}

        {/* BADGES */}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {wishlist && (
            <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 shadow-sm">
              ★ Wishlist
            </span>
          )}

          {!wishlist && (
            <StatusBadge
              status={
                vehicle.status
              }
            />
          )}
        </div>

        {/* ACTIONS */}

        <div className="absolute right-3 top-3 flex gap-1.5">
          {/* VIEW */}

          <Link
            href={`/vehicles/${vehicle.id}`}
            title="View vehicle details"
            aria-label="View vehicle details"
            className={
              iconButtonClass
            }
          >
            <EyeIcon />
          </Link>

          {/* EDIT */}

          <Link
            href={`/vehicles/${vehicle.id}/edit`}
            title="Edit vehicle"
            aria-label="Edit vehicle"
            className={
              iconButtonClass
            }
          >
            <EditIcon />
          </Link>

          {/* WORK */}

          <button
            type="button"
            onClick={onWork}
            title="View, edit or add work items"
            aria-label="View, edit or add work items"
            className={
              iconButtonClass
            }
          >
            <WorkIcon />
          </button>
        </div>
      </div>

      {/* DETAILS */}

      <Link
        href={`/vehicles/${vehicle.id}`}
        className="block p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 truncate text-base font-semibold">
            {vehicle.name}
          </h3>

          {wishlist && (
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
              Wishlist
            </span>
          )}
        </div>

        <p className="mt-1 truncate text-sm text-gray-500">
          {vehicle.year} ·{" "}
          {vehicle.make}
        </p>

        <div
          className={`my-4 border-t ${
            wishlist
              ? "border-amber-200"
              : "border-[#e7e8ea]"
          }`}
        />

        {/* OWNED DETAILS */}

        {!wishlist ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Odometer
              </p>

              <p className="mt-1 truncate text-sm">
                {formatNumber(
                  vehicle.odometer
                )}{" "}
                {vehicle.odometerUnit ||
                  "km"}
              </p>
            </div>

            <div className="min-w-0 text-right">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Location
              </p>

              <p className="mt-1 truncate text-sm">
                {vehicle.location ||
                  "—"}
              </p>
            </div>
          </div>
        ) : (
          /* WISHLIST DETAILS */

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700/70">
                Model
              </p>

              <p className="mt-1 truncate text-sm">
                {vehicle.model ||
                  "—"}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700/70">
                Variant
              </p>

              <p className="mt-1 truncate text-sm">
                {vehicle.variant ||
                  "—"}
              </p>
            </div>
          </div>
        )}

        {/* ENGINE */}

        <div
          className={`mt-4 truncate text-xs ${
            wishlist
              ? "text-amber-700/70"
              : "text-gray-400"
          }`}
        >
          {vehicle.engine
            ? vehicle.engine
            : vehicle.engineCc
              ? `${vehicle.engineCc} cc`
              : "Engine details not added"}
        </div>
      </Link>
    </div>
  );
}

/*
 * EMPTY SECTION
 */

function EmptySection({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white py-10 text-center text-sm text-gray-500">
      {text}
    </div>
  );
}

/*
 * ACTION BUTTON STYLE
 */

const iconButtonClass =
  "flex h-8 w-8 items-center justify-center rounded-lg border border-white/60 bg-white/90 text-[#1d2228] shadow-sm backdrop-blur transition hover:bg-white hover:shadow";

/*
 * ICONS
 */

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />

      <circle
        cx="12"
        cy="12"
        r="3"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />

      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function WorkIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a4 4 0 0 0-5-5l2.3 2.3-2.8 2.8-2.3-2.3a4 4 0 0 0 5 5L20 17.2a2 2 0 1 1-2.8 2.8l-7.9-7.9" />
    </svg>
  );
}

/*
 * SUMMARY CARD
 */

function SummaryCard({
  label,
  value,
  wishlist = false,
}: {
  label: string;
  value: number;
  wishlist?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl border px-4 py-4 ${
        wishlist
          ? "border-amber-300 bg-amber-50"
          : "border-[#dfe2e6] bg-white"
      }`}
    >
      <div
        className={`text-xs font-medium uppercase tracking-wide ${
          wishlist
            ? "text-amber-700"
            : "text-gray-400"
        }`}
      >
        {label}
      </div>

      <div className="mt-3 text-2xl font-semibold">
        {value}
      </div>
    </div>
  );
}

/*
 * STATUS BADGE
 */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<
    string,
    string
  > = {
    Running:
      "bg-green-100 text-green-700",

    Repair:
      "bg-red-100 text-red-700",

    "Custom Project":
      "bg-purple-100 text-purple-700",

    "For Parts":
      "bg-orange-100 text-orange-700",

    Stored:
      "bg-gray-100 text-gray-700",

    Sold:
      "bg-blue-100 text-blue-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium shadow-sm ${
        styles[status] ||
        "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}

/*
 * FORMAT NUMBER
 */

function formatNumber(
  value?: number
) {
  if (
    value === undefined ||
    value === null
  ) {
    return "0";
  }

  return value.toLocaleString();
}