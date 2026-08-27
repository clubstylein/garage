"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  Vehicle,
  WorkItem,
} from "@/lib/mock-data";

import VehicleCard from "@/components/vehicle-card";
import VehicleWorkModal from "@/components/vehicle-work-modal";

/* =========================================================
   CUSTOMER VIEW
   ========================================================= */

type CustomerView =
  | "self-owned"
  | "vip"
  | "general"
  | "all-customers"
  | "wishlist"
  | "all-vehicles";

/* =========================================================
   COMPONENT
   ========================================================= */

export default function VehiclesDashboard({
  vehicles,
  workItems,
}: {
  vehicles: Vehicle[];
  workItems: WorkItem[];
}) {
  /* =======================================================
     FILTERS
     ======================================================= */

  const [
    search,
    setSearch,
  ] = useState("");

  /*
   * Default vehicle view.
   */

  const [
    customerView,
    setCustomerView,
  ] =
    useState<CustomerView>(
      "self-owned"
    );

  const [
    status,
    setStatus,
  ] = useState("All");

  const [
    location,
    setLocation,
  ] = useState("All");

  /* =======================================================
     WORK MODAL
     ======================================================= */

  const [
    workVehicle,
    setWorkVehicle,
  ] =
    useState<Vehicle | null>(
      null
    );

  /* =======================================================
     HELPERS
     ======================================================= */

  function isWishlistVehicle(
    vehicle: Vehicle
  ) {
    return (
      String(
        vehicle.ownershipStatus ||
          ""
      )
        .trim()
        .toLowerCase() ===
      "wishlist"
    );
  }

  /*
   * Normalize the Directus category value.
   *
   * Database values:
   *
   * self-owned
   * vip
   * general
   *
   * This also tolerates old values such as:
   *
   * Self-owned
   * VIP
   * General
   */

  function getCustomerCategory(
    vehicle: Vehicle
  ) {
    const category =
      vehicle.customer
        ?.category ??
      vehicle.customerCategory ??
      "";

    return String(category)
      .trim()
      .toLowerCase();
  }

  function getCustomerName(
    vehicle: Vehicle
  ) {
    const name =
      vehicle.customer
        ?.name ??
      vehicle.customerName ??
      "";

    return String(
      name
    ).trim();
  }

  /* =======================================================
     VEHICLE GROUPS
     ======================================================= */

  const wishlistVehicles =
    useMemo(() => {
      return vehicles.filter(
        (vehicle) =>
          isWishlistVehicle(
            vehicle
          )
      );
    }, [
      vehicles,
    ]);

  const nonWishlistVehicles =
    useMemo(() => {
      return vehicles.filter(
        (vehicle) =>
          !isWishlistVehicle(
            vehicle
          )
      );
    }, [
      vehicles,
    ]);

  /*
   * Self-owned
   */

  const selfOwnedVehicles =
    useMemo(() => {
      return nonWishlistVehicles.filter(
        (vehicle) =>
          getCustomerCategory(
            vehicle
          ) ===
          "self-owned"
      );
    }, [
      nonWishlistVehicles,
    ]);

  /*
   * VIP customers
   */

  const vipVehicles =
    useMemo(() => {
      return nonWishlistVehicles.filter(
        (vehicle) =>
          getCustomerCategory(
            vehicle
          ) ===
          "vip"
      );
    }, [
      nonWishlistVehicles,
    ]);

  /*
   * General customers
   */

  const generalVehicles =
    useMemo(() => {
      return nonWishlistVehicles.filter(
        (vehicle) =>
          getCustomerCategory(
            vehicle
          ) ===
          "general"
      );
    }, [
      nonWishlistVehicles,
    ]);

  /*
   * Customer vehicles intentionally
   * exclude ClubStyle Self-owned.
   */

  const customerVehicles =
    useMemo(() => {
      return nonWishlistVehicles.filter(
        (vehicle) => {
          const category =
            getCustomerCategory(
              vehicle
            );

          return (
            category ===
              "vip" ||
            category ===
              "general"
          );
        }
      );
    }, [
      nonWishlistVehicles,
    ]);

  /* =======================================================
     OPEN WORK COUNT
     ======================================================= */

  const openWorkCountByVehicle =
    useMemo(() => {
      const counts =
        new Map<
          string,
          number
        >();

      for (
        const item of
        workItems
      ) {
        if (
          item.status ===
            "Completed" ||
          item.status ===
            "Cancelled"
        ) {
          continue;
        }

        const vehicleId =
          String(
            item.vehicleId
          );

        counts.set(
          vehicleId,
          (counts.get(
            vehicleId
          ) || 0) + 1
        );
      }

      return counts;
    }, [
      workItems,
    ]);

  /* =======================================================
     LOCATIONS
     ======================================================= */

  const locations =
    useMemo(() => {
      return Array.from(
        new Set(
          vehicles
            .map(
              (vehicle) =>
                vehicle.location
            )
            .filter(
              (
                value
              ): value is string =>
                Boolean(value)
            )
        )
      ).sort();
    }, [
      vehicles,
    ]);

  /* =======================================================
     CUSTOMER VIEW FILTER
     ======================================================= */

  function matchesCustomerView(
    vehicle: Vehicle
  ) {
    const wishlist =
      isWishlistVehicle(
        vehicle
      );

    const category =
      getCustomerCategory(
        vehicle
      );

    if (
      customerView ===
      "all-vehicles"
    ) {
      return true;
    }

    if (
      customerView ===
      "wishlist"
    ) {
      return wishlist;
    }

    /*
     * Wishlist never appears inside
     * customer category views.
     */

    if (wishlist) {
      return false;
    }

    if (
      customerView ===
      "self-owned"
    ) {
      return (
        category ===
        "self-owned"
      );
    }

    if (
      customerView ===
      "vip"
    ) {
      return (
        category ===
        "vip"
      );
    }

    if (
      customerView ===
      "general"
    ) {
      return (
        category ===
        "general"
      );
    }

    if (
      customerView ===
      "all-customers"
    ) {
      return (
        category ===
          "vip" ||
        category ===
          "general"
      );
    }

    return false;
  }

  /* =======================================================
     MAIN FILTER
     ======================================================= */

  const filteredVehicles =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return vehicles.filter(
        (vehicle) => {
          /*
           * CUSTOMER
           */

          if (
            !matchesCustomerView(
              vehicle
            )
          ) {
            return false;
          }

          /*
           * STATUS
           */

          if (
            status !==
              "All" &&
            vehicle.status !==
              status
          ) {
            return false;
          }

          /*
           * LOCATION
           */

          if (
            location !==
              "All" &&
            vehicle.location !==
              location
          ) {
            return false;
          }

          /*
           * SEARCH
           */

          if (!query) {
            return true;
          }

          const text = [
            vehicle.name,
            vehicle.make,
            vehicle.model,
            vehicle.variant,
            vehicle.registrationNumber,
            vehicle.location,
            getCustomerName(
              vehicle
            ),
            getCustomerCategory(
              vehicle
            ),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return text.includes(
            query
          );
        }
      );
    }, [
      vehicles,
      search,
      customerView,
      status,
      location,
    ]);

  /* =======================================================
     DISPLAY GROUPS
     ======================================================= */

  const filteredWishlist =
    useMemo(() => {
      return filteredVehicles.filter(
        (vehicle) =>
          isWishlistVehicle(
            vehicle
          )
      );
    }, [
      filteredVehicles,
    ]);

  const filteredNonWishlist =
    useMemo(() => {
      return filteredVehicles.filter(
        (vehicle) =>
          !isWishlistVehicle(
            vehicle
          )
      );
    }, [
      filteredVehicles,
    ]);

  /* =======================================================
     STATS
     ======================================================= */

  const stats =
    useMemo(() => {
      return {
        selfOwned:
          selfOwnedVehicles.length,

        customers:
          customerVehicles.length,

        vip:
          vipVehicles.length,

        wishlist:
          wishlistVehicles.length,

        running:
          selfOwnedVehicles.filter(
            (vehicle) =>
              vehicle.status ===
              "Running"
          ).length,

        repair:
          selfOwnedVehicles.filter(
            (vehicle) =>
              vehicle.status ===
              "Repair"
          ).length,

        projects:
          selfOwnedVehicles.filter(
            (vehicle) =>
              vehicle.status ===
              "Custom Project"
          ).length,
      };
    }, [
      selfOwnedVehicles,
      customerVehicles,
      vipVehicles,
      wishlistVehicles,
    ]);

  /* =======================================================
     HEADER ACTIONS
     ======================================================= */

  function showSelfOwned() {
    setCustomerView(
      "self-owned"
    );

    setStatus(
      "All"
    );
  }

  function showCustomers() {
    setCustomerView(
      "all-customers"
    );

    setStatus(
      "All"
    );
  }

  function showVip() {
    setCustomerView(
      "vip"
    );

    setStatus(
      "All"
    );
  }

  function showWishlist() {
    setCustomerView(
      "wishlist"
    );

    setStatus(
      "All"
    );
  }

  function showRunning() {
    setCustomerView(
      "self-owned"
    );

    setStatus(
      "Running"
    );
  }

  function showRepair() {
    setCustomerView(
      "self-owned"
    );

    setStatus(
      "Repair"
    );
  }

  function showProjects() {
    setCustomerView(
      "self-owned"
    );

    setStatus(
      "Custom Project"
    );
  }

  /* =======================================================
     ACTIVE HEADER STATE
     ======================================================= */

  const selfOwnedActive =
    customerView ===
      "self-owned" &&
    status ===
      "All";

  const customersActive =
    customerView ===
      "all-customers" &&
    status ===
      "All";

  const vipActive =
    customerView ===
      "vip" &&
    status ===
      "All";

  const wishlistActive =
    customerView ===
      "wishlist" &&
    status ===
      "All";

  const runningActive =
    customerView ===
      "self-owned" &&
    status ===
      "Running";

  const repairActive =
    customerView ===
      "self-owned" &&
    status ===
      "Repair";

  const projectsActive =
    customerView ===
      "self-owned" &&
    status ===
      "Custom Project";

  /* =======================================================
     CLEAR
     ======================================================= */

  function clearFilters() {
    setSearch("");

    setCustomerView(
      "self-owned"
    );

    setStatus(
      "All"
    );

    setLocation(
      "All"
    );
  }

  const filtersActive =
    search !== "" ||
    customerView !==
      "self-owned" ||
    status !==
      "All" ||
    location !==
      "All";

  /* =======================================================
     SECTION TITLE
     ======================================================= */

  function sectionTitle() {
    switch (
      customerView
    ) {
      case "self-owned":
        return "Self-owned Vehicles";

      case "vip":
        return "VIP Customer Vehicles";

      case "general":
        return "General Customer Vehicles";

      case "all-customers":
        return "Customer Vehicles";

      case "wishlist":
        return "Wishlist";

      case "all-vehicles":
        return "Vehicles";

      default:
        return "Vehicles";
    }
  }

  /* =======================================================
     UI
     ======================================================= */

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#1d2228]">
      {/* HEADER */}

      <section className="border-b border-[#e1e4e8] bg-white">
        <div className="px-5 py-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Vehicles
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Self-owned and customer vehicles
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <CompactStat
                label="Self-owned"
                value={
                  stats.selfOwned
                }
                active={
                  selfOwnedActive
                }
                onClick={
                  showSelfOwned
                }
              />

              <CompactStat
                label="Customers"
                value={
                  stats.customers
                }
                active={
                  customersActive
                }
                onClick={
                  showCustomers
                }
              />

              <CompactStat
                label="VIP"
                value={
                  stats.vip
                }
                active={
                  vipActive
                }
                onClick={
                  showVip
                }
              />

              <CompactStat
                label="Wishlist"
                value={
                  stats.wishlist
                }
                active={
                  wishlistActive
                }
                onClick={
                  showWishlist
                }
                wishlist
              />

              <CompactStat
                label="Running"
                value={
                  stats.running
                }
                active={
                  runningActive
                }
                onClick={
                  showRunning
                }
              />

              <CompactStat
                label="Repair"
                value={
                  stats.repair
                }
                active={
                  repairActive
                }
                onClick={
                  showRepair
                }
              />

              <CompactStat
                label="Projects"
                value={
                  stats.projects
                }
                active={
                  projectsActive
                }
                onClick={
                  showProjects
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}

      <div className="px-5 py-5 lg:px-8">
        {/* FILTER BAR */}

        <div className="mb-6 rounded-xl border border-[#dfe2e6] bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-center">
            <input
              type="search"
              value={
                search
              }
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search vehicle or customer..."
              className={`${inputClass} lg:flex-[2]`}
            />

            <select
              value={
                customerView
              }
              onChange={(e) =>
                setCustomerView(
                  e.target
                    .value as CustomerView
                )
              }
              className={`${inputClass} lg:min-w-[180px] lg:flex-1`}
            >
              <option value="self-owned">
                Self-owned
              </option>

              <option value="vip">
                VIP
              </option>

              <option value="general">
                General
              </option>

              <option value="all-customers">
                All Customers
              </option>

              <option value="wishlist">
                Wishlist
              </option>

              <option value="all-vehicles">
                All Vehicles
              </option>
            </select>

            <select
              value={
                status
              }
              onChange={(e) =>
                setStatus(
                  e.target.value
                )
              }
              className={`${inputClass} lg:min-w-[160px] lg:flex-1`}
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

            <select
              value={
                location
              }
              onChange={(e) =>
                setLocation(
                  e.target.value
                )
              }
              className={`${inputClass} lg:min-w-[160px] lg:flex-1`}
            >
              <option value="All">
                All Locations
              </option>

              {locations.map(
                (item) => (
                  <option
                    key={
                      item
                    }
                    value={
                      item
                    }
                  >
                    {item}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              onClick={
                clearFilters
              }
              disabled={
                !filtersActive
              }
              className="h-[42px] shrink-0 whitespace-nowrap rounded-lg border border-[#d8dce1] bg-white px-4 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>

            <Link
              href="/vehicles/new"
              className="inline-flex h-[42px] shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-[#1d2228] px-5 text-sm font-medium text-white hover:bg-black"
            >
              + Add Vehicle
            </Link>
          </div>
        </div>

        {/* NON-WISHLIST VEHICLES */}

        {customerView !==
          "wishlist" && (
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">
                {sectionTitle()}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {
                  filteredNonWishlist.length
                }{" "}
                {filteredNonWishlist.length ===
                1
                  ? "vehicle"
                  : "vehicles"}
              </p>
            </div>

            {filteredNonWishlist.length >
            0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {filteredNonWishlist.map(
                  (vehicle) => (
                    <VehicleCard
                      key={
                        vehicle.id
                      }
                      vehicle={
                        vehicle
                      }
                      workCount={
                        openWorkCountByVehicle.get(
                          String(
                            vehicle.id
                          )
                        ) || 0
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
              <EmptySection
                text={`No ${sectionTitle().toLowerCase()} match the selected filters.`}
              />
            )}
          </section>
        )}

        {/* WISHLIST */}

        {(customerView ===
          "wishlist" ||
          customerView ===
            "all-vehicles") && (
          <section
            className={
              customerView ===
              "all-vehicles"
                ? "mt-10"
                : ""
            }
          >
            <div className="mb-4">
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
                      workCount={
                        0
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
              <EmptySection text="No wishlist vehicles match the selected filters." />
            )}
          </section>
        )}
      </div>

      {/* WORK MODAL */}

      {workVehicle && (
        <VehicleWorkModal
          vehicle={
            workVehicle
          }
          vehicles={
            nonWishlistVehicles
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

/* =========================================================
   INPUT
   ========================================================= */

const inputClass =
  "h-[42px] w-full min-w-0 rounded-lg border border-[#d8dce1] bg-white px-3 text-sm outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";

/* =========================================================
   COMPACT STAT
   ========================================================= */

function CompactStat({
  label,
  value,
  active = false,
  onClick,
  wishlist = false,
}: {
  label: string;

  value: number;

  active?: boolean;

  onClick: () => void;

  wishlist?: boolean;
}) {
  let classes =
    "border-[#dfe2e6] bg-[#fafafa] text-[#1d2228] hover:border-[#aeb4bb] hover:bg-white";

  let labelClasses =
    "text-gray-400";

  if (
    wishlist &&
    !active
  ) {
    classes =
      "border-amber-300 bg-amber-50 text-amber-900 hover:border-amber-400";

    labelClasses =
      "text-amber-700";
  }

  if (active) {
    classes =
      "border-[#1d2228] bg-[#1d2228] text-white";

    labelClasses =
      "text-gray-300";
  }

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 transition ${classes}`}
    >
      <span
        className={`text-[11px] font-medium uppercase tracking-wide ${labelClasses}`}
      >
        {label}
      </span>

      <span className="text-sm font-semibold">
        {value}
      </span>
    </button>
  );
}

/* =========================================================
   EMPTY SECTION
   ========================================================= */

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