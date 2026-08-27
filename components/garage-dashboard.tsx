"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Vehicle,
  WorkItem,
} from "@/lib/mock-data";

import VehicleWorkModal from "@/components/vehicle-work-modal";

/* =========================================================
   TYPES
   ========================================================= */

type GarageModalState = {
  vehicle: Vehicle;
  workItemId?: string;
};

type SummaryFilter =
  | "all"
  | "service"
  | "p1"
  | "parts"
  | "progress"
  | "ready"
  | "overdue";

/* =========================================================
   COMPONENT
   ========================================================= */

export default function GarageDashboard({
  vehicles,
  workItems,
}: {
  vehicles: Vehicle[];
  workItems: WorkItem[];
}) {
  const router =
    useRouter();

  /*
   * FILTERS
   */

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("All");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    priorityFilter,
    setPriorityFilter,
  ] = useState("All");

  const [
    summaryFilter,
    setSummaryFilter,
  ] =
    useState<SummaryFilter>(
      "all"
    );

  /*
   * MODAL
   */

  const [
    workModal,
    setWorkModal,
  ] =
    useState<GarageModalState | null>(
      null
    );

  /* =======================================================
     VEHICLES AVAILABLE TO GARAGE
     ======================================================= */

  const garageVehicles =
    useMemo(() => {
      return vehicles.filter(
        (vehicle) =>
          String(
            vehicle.ownershipStatus ||
              ""
          )
            .trim()
            .toLowerCase() !==
          "wishlist"
      );
    }, [
      vehicles,
    ]);

  /*
   * VEHICLE LOOKUP
   */

  const vehicleMap =
    useMemo(() => {
      return new Map<
        string,
        Vehicle
      >(
        garageVehicles.map(
          (vehicle) =>
            [
              String(
                vehicle.id
              ),
              vehicle,
            ] as const
        )
      );
    }, [
      garageVehicles,
    ]);

  /* =======================================================
     OPEN WORK
     ======================================================= */

  function isOpenWork(
    item: WorkItem
  ) {
    return (
      item.status !==
        "Completed" &&
      item.status !==
        "Cancelled"
    );
  }

  const garageWorkItems =
    useMemo(() => {
      return workItems.filter(
        (item) =>
          isOpenWork(item) &&
          vehicleMap.has(
            String(
              item.vehicleId
            )
          )
      );
    }, [
      workItems,
      vehicleMap,
    ]);

  /* =======================================================
     CATEGORIES
     ======================================================= */

  const categories =
    useMemo(() => {
      return Array.from(
        new Set(
          garageWorkItems
            .map(
              (item) =>
                item.category
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
      garageWorkItems,
    ]);

  /* =======================================================
     BUILD VEHICLE CARDS
     ======================================================= */

  const vehicleWorkGroups =
    useMemo(() => {
      return garageVehicles
        .map(
          (vehicle) => {
            const vehicleId =
              String(
                vehicle.id
              );

            const items =
              garageWorkItems.filter(
                (item) =>
                  String(
                    item.vehicleId
                  ) ===
                  vehicleId
              );

            /*
             * No open work =
             * no Garage card.
             */

            if (
              items.length ===
              0
            ) {
              return null;
            }

            const sortedItems =
              items
                .slice()
                .sort(
                  compareWorkItems
                );

            const p1 =
              items.filter(
                (item) =>
                  Number(
                    item.priority ??
                      3
                  ) === 1
              ).length;

            const service =
              items.filter(
                (item) =>
                  String(
                    item.category ||
                      ""
                  )
                    .trim()
                    .toLowerCase() ===
                  "service"
              ).length;

            const partsRequired =
              items.filter(
                (item) =>
                  item.status ===
                  "Parts Required"
              ).length;

            const partsOrdered =
              items.filter(
                (item) =>
                  item.status ===
                  "Parts Ordered"
              ).length;

            const inProgress =
              items.filter(
                (item) =>
                  item.status ===
                  "In Progress"
              ).length;

            const ready =
              items.filter(
                (item) =>
                  item.status ===
                  "Ready"
              ).length;

            const overdue =
              items.filter(
                isOverdue
              ).length;

            return {
              vehicle,

              items:
                sortedItems,

              counts: {
                open:
                  items.length,

                service,

                p1,

                partsRequired,

                partsOrdered,

                inProgress,

                ready,

                overdue,
              },
            };
          }
        )
        .filter(
          (
            group
          ): group is NonNullable<
            typeof group
          > =>
            group !== null
        );
    }, [
      garageVehicles,
      garageWorkItems,
    ]);

  /* =======================================================
     SUMMARY STATS
     ======================================================= */

  const stats =
    useMemo(() => {
      return {
        open:
          garageWorkItems.length,

        service:
          garageWorkItems.filter(
            (item) =>
              String(
                item.category ||
                  ""
              )
                .trim()
                .toLowerCase() ===
              "service"
          ).length,

        p1:
          garageWorkItems.filter(
            (item) =>
              Number(
                item.priority ??
                  3
              ) === 1
          ).length,

        parts:
          garageWorkItems.filter(
            (item) =>
              item.status ===
              "Parts Required"
          ).length,

        progress:
          garageWorkItems.filter(
            (item) =>
              item.status ===
              "In Progress"
          ).length,

        ready:
          garageWorkItems.filter(
            (item) =>
              item.status ===
              "Ready"
          ).length,

        overdue:
          garageWorkItems.filter(
            isOverdue
          ).length,
      };
    }, [
      garageWorkItems,
    ]);

  /* =======================================================
     FILTER VEHICLE CARDS
     ======================================================= */

  const filteredGroups =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return vehicleWorkGroups
        .map((group) => {
          const filteredItems =
            group.items.filter(
              (item) => {
                /*
                 * CATEGORY
                 */

                if (
                  categoryFilter !==
                    "All" &&
                  String(
                    item.category ||
                      ""
                  ) !==
                    categoryFilter
                ) {
                  return false;
                }

                /*
                 * PRIORITY
                 */

                if (
                  priorityFilter !==
                    "All" &&
                  String(
                    item.priority ??
                      3
                  ) !==
                    priorityFilter
                ) {
                  return false;
                }

                /*
                 * STATUS
                 */

                if (
                  statusFilter !==
                    "All" &&
                  item.status !==
                    statusFilter
                ) {
                  return false;
                }

                /*
                 * SUMMARY FILTER
                 */

                if (
                  summaryFilter ===
                    "service" &&
                  String(
                    item.category ||
                      ""
                  )
                    .trim()
                    .toLowerCase() !==
                    "service"
                ) {
                  return false;
                }

                if (
                  summaryFilter ===
                    "p1" &&
                  Number(
                    item.priority ??
                      3
                  ) !== 1
                ) {
                  return false;
                }

                if (
                  summaryFilter ===
                    "parts" &&
                  item.status !==
                    "Parts Required"
                ) {
                  return false;
                }

                if (
                  summaryFilter ===
                    "progress" &&
                  item.status !==
                    "In Progress"
                ) {
                  return false;
                }

                if (
                  summaryFilter ===
                    "ready" &&
                  item.status !==
                    "Ready"
                ) {
                  return false;
                }

                if (
                  summaryFilter ===
                    "overdue" &&
                  !isOverdue(
                    item
                  )
                ) {
                  return false;
                }

                return true;
              }
            );

          /*
           * SEARCH
           */

          if (query) {
            const vehicleText = [
              group.vehicle.name,
              group.vehicle.make,
              group.vehicle.model,
              group.vehicle.variant,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            const vehicleMatches =
              vehicleText.includes(
                query
              );

            const matchingItems =
              filteredItems.filter(
                (item) => {
                  const text = [
                    item.title,
                    item.category,
                    item.status,
                    item.workDescription,
                    item.notes,
                  ]
                    .filter(
                      Boolean
                    )
                    .join(" ")
                    .toLowerCase();

                  return text.includes(
                    query
                  );
                }
              );

            if (
              vehicleMatches
            ) {
              return {
                ...group,

                filteredItems,
              };
            }

            return {
              ...group,

              filteredItems:
                matchingItems,
            };
          }

          return {
            ...group,

            filteredItems,
          };
        })
        .filter(
          (group) =>
            group.filteredItems
              .length > 0
        );
    }, [
      vehicleWorkGroups,
      search,
      categoryFilter,
      priorityFilter,
      statusFilter,
      summaryFilter,
    ]);

  /* =======================================================
     SUMMARY BUTTONS
     ======================================================= */

  function showAll() {
    setSummaryFilter(
      "all"
    );

    setCategoryFilter(
      "All"
    );

    setPriorityFilter(
      "All"
    );

    setStatusFilter(
      "All"
    );
  }

  function showService() {
    setSummaryFilter(
      "service"
    );

    setCategoryFilter(
      "Service"
    );

    setPriorityFilter(
      "All"
    );

    setStatusFilter(
      "All"
    );
  }

  function showP1() {
    setSummaryFilter(
      "p1"
    );

    setCategoryFilter(
      "All"
    );

    setPriorityFilter(
      "1"
    );

    setStatusFilter(
      "All"
    );
  }

  function showParts() {
    setSummaryFilter(
      "parts"
    );

    setCategoryFilter(
      "All"
    );

    setPriorityFilter(
      "All"
    );

    setStatusFilter(
      "Parts Required"
    );
  }

  function showProgress() {
    setSummaryFilter(
      "progress"
    );

    setCategoryFilter(
      "All"
    );

    setPriorityFilter(
      "All"
    );

    setStatusFilter(
      "In Progress"
    );
  }

  function showReady() {
    setSummaryFilter(
      "ready"
    );

    setCategoryFilter(
      "All"
    );

    setPriorityFilter(
      "All"
    );

    setStatusFilter(
      "Ready"
    );
  }

  function showOverdue() {
    setSummaryFilter(
      "overdue"
    );

    setCategoryFilter(
      "All"
    );

    setPriorityFilter(
      "All"
    );

    setStatusFilter(
      "All"
    );
  }

  /* =======================================================
     MANUAL FILTER CHANGE
     ======================================================= */

  function handleCategoryChange(
    value: string
  ) {
    setCategoryFilter(
      value
    );

    setSummaryFilter(
      "all"
    );
  }

  function handleStatusChange(
    value: string
  ) {
    setStatusFilter(
      value
    );

    setSummaryFilter(
      "all"
    );
  }

  function handlePriorityChange(
    value: string
  ) {
    setPriorityFilter(
      value
    );

    setSummaryFilter(
      "all"
    );
  }

  function clearFilters() {
    setSearch("");

    setCategoryFilter(
      "All"
    );

    setStatusFilter(
      "All"
    );

    setPriorityFilter(
      "All"
    );

    setSummaryFilter(
      "all"
    );
  }

  const filtersActive =
    search !== "" ||
    categoryFilter !==
      "All" ||
    statusFilter !==
      "All" ||
    priorityFilter !==
      "All" ||
    summaryFilter !==
      "all";

  /* =======================================================
     MODAL ACTIONS
     ======================================================= */

  function addWork(
    vehicle: Vehicle
  ) {
    setWorkModal({
      vehicle,
    });
  }

  function editWork(
    vehicle: Vehicle,
    item: WorkItem
  ) {
    setWorkModal({
      vehicle,

      workItemId:
        item.id,
    });
  }

  function viewVehicleWork(
    vehicle: Vehicle
  ) {
    setWorkModal({
      vehicle,
    });
  }

  /* =======================================================
     UI
     ======================================================= */

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#1d2228]">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <section className="border-b border-[#e1e4e8] bg-white">
        <div className="px-5 py-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* LEFT */}

            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Garage
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Current workshop workload
              </p>
            </div>

            {/* RIGHT */}

            <div className="flex flex-wrap items-center justify-end gap-2">
              <CompactStat
                label="Open"
                value={
                  stats.open
                }
                active={
                  summaryFilter ===
                  "all"
                }
                onClick={
                  showAll
                }
              />

              <CompactStat
                label="Service"
                value={
                  stats.service
                }
                active={
                  summaryFilter ===
                  "service"
                }
                onClick={
                  showService
                }
              />

              <CompactStat
                label="P1"
                value={
                  stats.p1
                }
                active={
                  summaryFilter ===
                  "p1"
                }
                onClick={
                  showP1
                }
              />

              <CompactStat
                label="Parts"
                value={
                  stats.parts
                }
                active={
                  summaryFilter ===
                  "parts"
                }
                onClick={
                  showParts
                }
              />

              <CompactStat
                label="In Progress"
                value={
                  stats.progress
                }
                active={
                  summaryFilter ===
                  "progress"
                }
                onClick={
                  showProgress
                }
              />

              <CompactStat
                label="Ready"
                value={
                  stats.ready
                }
                active={
                  summaryFilter ===
                  "ready"
                }
                onClick={
                  showReady
                }
              />

              <CompactStat
                label="Overdue"
                value={
                  stats.overdue
                }
                active={
                  summaryFilter ===
                  "overdue"
                }
                onClick={
                  showOverdue
                }
                warning={
                  stats.overdue > 0
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTENT
          ===================================================== */}

      <div className="px-5 py-5 lg:px-8">
        {/* ===================================================
            FILTERS — SINGLE ROW ON DESKTOP
            =================================================== */}

        <div className="mb-5 rounded-xl border border-[#dfe2e6] bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-center">
            {/* SEARCH */}

            <input
              type="search"
              value={
                search
              }
              onChange={(event) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Search vehicle or work..."
              className={`${inputClass} lg:min-w-0 lg:flex-[2]`}
            />

            {/* CATEGORY */}

            <select
              value={
                categoryFilter
              }
              onChange={(event) =>
                handleCategoryChange(
                  event.target
                    .value
                )
              }
              className={`${inputClass} lg:min-w-[170px] lg:flex-1`}
            >
              <option value="All">
                All Categories
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={
                      category
                    }
                    value={
                      category
                    }
                  >
                    {category}
                  </option>
                )
              )}
            </select>

            {/* STATUS */}

            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                handleStatusChange(
                  event.target
                    .value
                )
              }
              className={`${inputClass} lg:min-w-[190px] lg:flex-1`}
            >
              <option value="All">
                All Work Status
              </option>

              <option value="Idea">
                Idea
              </option>

              <option value="Planned">
                Planned
              </option>

              <option value="Parts Required">
                Parts Required
              </option>

              <option value="Parts Ordered">
                Parts Ordered
              </option>

              <option value="Ready">
                Ready
              </option>

              <option value="In Progress">
                In Progress
              </option>

              <option value="On Hold">
                On Hold
              </option>
            </select>

            {/* PRIORITY */}

            <select
              value={
                priorityFilter
              }
              onChange={(event) =>
                handlePriorityChange(
                  event.target
                    .value
                )
              }
              className={`${inputClass} lg:min-w-[165px] lg:flex-1`}
            >
              <option value="All">
                All Priority
              </option>

              <option value="1">
                P1 — Urgent
              </option>

              <option value="2">
                P2 — High
              </option>

              <option value="3">
                P3 — Normal
              </option>

              <option value="4">
                P4 — Low
              </option>
            </select>

            {/* CLEAR */}

            <button
              type="button"
              onClick={
                clearFilters
              }
              disabled={
                !filtersActive
              }
              className="h-[42px] shrink-0 whitespace-nowrap rounded-lg border border-[#d8dce1] bg-white px-5 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </div>

        {/* ===================================================
            VEHICLE WORK CARDS
            =================================================== */}

        {filteredGroups.length >
        0 ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {filteredGroups.map(
              (group) => (
                <GarageVehicleCard
                  key={
                    group.vehicle.id
                  }
                  vehicle={
                    group.vehicle
                  }
                  allItems={
                    group.items
                  }
                  displayedItems={
                    group.filteredItems
                  }
                  counts={
                    group.counts
                  }
                  onAddWork={() =>
                    addWork(
                      group.vehicle
                    )
                  }
                  onEditWork={(
                    item
                  ) =>
                    editWork(
                      group.vehicle,
                      item
                    )
                  }
                  onViewAll={() =>
                    viewVehicleWork(
                      group.vehicle
                    )
                  }
                />
              )
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <div className="text-base font-medium text-gray-700">
              No open work found
            </div>

            <p className="mt-1 text-sm text-gray-500">
              No vehicle has work matching the selected filters.
            </p>
          </div>
        )}
      </div>

      {/* =====================================================
          WORK MODAL
          ===================================================== */}

      {workModal && (
        <VehicleWorkModal
          vehicle={
            workModal.vehicle
          }
          vehicles={
            garageVehicles
          }
          initialWorkItemId={
            workModal.workItemId
          }
          onChanged={() => {
            router.refresh();
          }}
          onClose={() => {
            setWorkModal(
              null
            );

            router.refresh();
          }}
        />
      )}
    </main>
  );
}

/* =========================================================
   VEHICLE WORK CARD
   ========================================================= */

function GarageVehicleCard({
  vehicle,
  allItems,
  displayedItems,
  counts,
  onAddWork,
  onEditWork,
  onViewAll,
}: {
  vehicle: Vehicle;

  allItems: WorkItem[];

  displayedItems: WorkItem[];

  counts: {
    open: number;
    service: number;
    p1: number;
    partsRequired: number;
    partsOrdered: number;
    inProgress: number;
    ready: number;
    overdue: number;
  };

  onAddWork:
    () => void;

  onEditWork:
    (
      item: WorkItem
    ) => void;

  onViewAll:
    () => void;
}) {
  const visibleItems =
    displayedItems.slice(
      0,
      4
    );

  return (
    <div className="overflow-hidden rounded-xl border border-[#dfe2e6] bg-white">
      {/* CARD HEADER */}

      <div className="border-b border-[#e7e8ea] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={`/vehicles/${vehicle.id}`}
              className="block truncate text-lg font-semibold hover:underline"
            >
              {vehicle.name}
            </Link>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span>
                {vehicle.year}
              </span>

              <span>
                ·
              </span>

              <span>
                {vehicle.make}
              </span>

              {vehicle.status && (
                <>
                  <span>
                    ·
                  </span>

                  <VehicleStatusBadge
                    status={
                      vehicle.status
                    }
                  />
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={
              onAddWork
            }
            className="shrink-0 rounded-lg bg-[#1d2228] px-3.5 py-2 text-sm font-medium text-white hover:bg-black"
          >
            + Work
          </button>
        </div>

        {/* CARD COUNTS */}

        <div className="mt-4 flex flex-wrap gap-2">
          <MiniStat
            label="Open"
            value={
              counts.open
            }
          />

          <MiniStat
            label="P1"
            value={
              counts.p1
            }
            danger={
              counts.p1 >
              0
            }
          />

          <MiniStat
            label="Parts"
            value={
              counts.partsRequired
            }
            warning={
              counts.partsRequired >
              0
            }
          />

          <MiniStat
            label="Progress"
            value={
              counts.inProgress
            }
          />
        </div>
      </div>

      {/* WORK ITEMS */}

      <div className="divide-y divide-[#edf0f2]">
        {visibleItems.map(
          (item) => (
            <button
              type="button"
              key={
                item.id
              }
              onClick={() =>
                onEditWork(
                  item
                )
              }
              className="block w-full px-5 py-3.5 text-left transition hover:bg-[#fafafa]"
            >
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  <PriorityBadge
                    priority={
                      item.priority ??
                      3
                    }
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-[#1d2228]">
                        {
                          item.title
                        }
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <StatusBadge
                          status={
                            item.status ||
                            "Planned"
                          }
                        />

                        {item.category && (
                          <span className="text-xs text-gray-400">
                            {
                              item.category
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {isOverdue(
                        item
                      ) ? (
                        <div className="text-xs font-medium text-red-600">
                          Overdue
                        </div>
                      ) : item.targetDate ? (
                        <div className="text-xs text-gray-400">
                          {formatDate(
                            item.targetDate
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="pt-1 text-gray-300">
                  →
                </div>
              </div>
            </button>
          )
        )}
      </div>

      {/* FOOTER */}

      <div className="flex items-center justify-between border-t border-[#e7e8ea] bg-[#fafafa] px-5 py-3">
        <span className="text-xs text-gray-400">
          {allItems.length ===
          1
            ? "1 open work item"
            : `${allItems.length} open work items`}
        </span>

        <button
          type="button"
          onClick={
            onViewAll
          }
          className="text-sm font-medium text-[#1d2228] hover:underline"
        >
          View all{" "}
          {allItems.length}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   COMPACT HEADER STAT
   ========================================================= */

function CompactStat({
  label,
  value,
  active = false,
  warning = false,
  onClick,
}: {
  label: string;

  value: number;

  active?: boolean;

  warning?: boolean;

  onClick:
    () => void;
}) {
  let classes =
    "border-[#dfe2e6] bg-[#fafafa] text-[#1d2228] hover:border-[#aeb4bb] hover:bg-white";

  let labelClass =
    "text-gray-400";

  if (
    warning &&
    !active
  ) {
    classes =
      "border-red-200 bg-red-50 text-red-700 hover:border-red-300";

    labelClass =
      "text-red-500";
  }

  if (active) {
    classes =
      "border-[#1d2228] bg-[#1d2228] text-white";

    labelClass =
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
        className={`text-[11px] font-medium uppercase tracking-wide ${labelClass}`}
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
   MINI STAT
   ========================================================= */

function MiniStat({
  label,
  value,
  danger = false,
  warning = false,
}: {
  label: string;

  value: number;

  danger?: boolean;

  warning?: boolean;
}) {
  let classes =
    "border-gray-200 bg-gray-50 text-gray-600";

  if (
    warning &&
    value > 0
  ) {
    classes =
      "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (
    danger &&
    value > 0
  ) {
    classes =
      "border-red-200 bg-red-50 text-red-700";
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] ${classes}`}
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

/* =========================================================
   PRIORITY
   ========================================================= */

function PriorityBadge({
  priority,
}: {
  priority: number;
}) {
  const styles: Record<
    number,
    string
  > = {
    1: "bg-red-100 text-red-700",
    2: "bg-orange-100 text-orange-700",
    3: "bg-gray-100 text-gray-600",
    4: "bg-gray-50 text-gray-400",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
        styles[
          priority
        ] ||
        styles[3]
      }`}
    >
      P{priority}
    </span>
  );
}

/* =========================================================
   WORK STATUS
   ========================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<
    string,
    string
  > = {
    Idea:
      "bg-gray-100 text-gray-600",

    Planned:
      "bg-blue-100 text-blue-700",

    "Parts Required":
      "bg-orange-100 text-orange-700",

    "Parts Ordered":
      "bg-yellow-100 text-yellow-700",

    Ready:
      "bg-cyan-100 text-cyan-700",

    "In Progress":
      "bg-purple-100 text-purple-700",

    "On Hold":
      "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${
        styles[
          status
        ] ||
        "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

/* =========================================================
   VEHICLE STATUS
   ========================================================= */

function VehicleStatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<
    string,
    string
  > = {
    Running:
      "text-green-700",

    Repair:
      "text-red-600",

    "Custom Project":
      "text-purple-700",

    "For Parts":
      "text-orange-700",

    Stored:
      "text-gray-500",
  };

  return (
    <span
      className={`text-xs font-medium ${
        styles[
          status
        ] ||
        "text-gray-500"
      }`}
    >
      {status}
    </span>
  );
}

/* =========================================================
   SORT WORK
   ========================================================= */

function compareWorkItems(
  a: WorkItem,
  b: WorkItem
) {
  const priorityA =
    Number(
      a.priority ??
        3
    );

  const priorityB =
    Number(
      b.priority ??
        3
    );

  if (
    priorityA !==
    priorityB
  ) {
    return (
      priorityA -
      priorityB
    );
  }

  const overdueA =
    isOverdue(a);

  const overdueB =
    isOverdue(b);

  if (
    overdueA !==
    overdueB
  ) {
    return overdueA
      ? -1
      : 1;
  }

  if (
    a.status ===
      "In Progress" &&
    b.status !==
      "In Progress"
  ) {
    return -1;
  }

  if (
    b.status ===
      "In Progress" &&
    a.status !==
      "In Progress"
  ) {
    return 1;
  }

  if (
    a.targetDate &&
    b.targetDate
  ) {
    return a.targetDate.localeCompare(
      b.targetDate
    );
  }

  if (
    a.targetDate
  ) {
    return -1;
  }

  if (
    b.targetDate
  ) {
    return 1;
  }

  return 0;
}

/* =========================================================
   OVERDUE
   ========================================================= */

function isOverdue(
  item: WorkItem
) {
  if (
    !item.targetDate
  ) {
    return false;
  }

  if (
    item.status ===
      "Completed" ||
    item.status ===
      "Cancelled"
  ) {
    return false;
  }

  const today =
    new Date();

  const year =
    today.getFullYear();

  const month =
    String(
      today.getMonth() +
        1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      today.getDate()
    ).padStart(
      2,
      "0"
    );

  const todayString =
    `${year}-${month}-${day}`;

  return (
    item.targetDate <
    todayString
  );
}

/* =========================================================
   DATE
   ========================================================= */

function formatDate(
  value: string
) {
  const parts =
    value
      .slice(0, 10)
      .split("-");

  if (
    parts.length !==
    3
  ) {
    return value;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/* =========================================================
   INPUT
   ========================================================= */

const inputClass =
  "h-[42px] w-full min-w-0 rounded-lg border border-[#d8dce1] bg-white px-3 text-sm outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";