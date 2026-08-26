"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  Vehicle,
  WorkItem,
} from "@/lib/mock-data";

import VehicleWorkModal from "@/components/vehicle-work-modal";

type WorkModalState = {
  vehicle?: Vehicle;
  workItemId?: string;
};

export default function WorkDashboard({
  workItems,
  vehicles,
}: {
  workItems: WorkItem[];
  vehicles: Vehicle[];
}) {
  const router = useRouter();

  const [search, setSearch] =
    useState("");

  const [
    vehicleFilter,
    setVehicleFilter,
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
    categoryFilter,
    setCategoryFilter,
  ] = useState("All");

  /*
   * WORK MODAL
   */

  const [
    workModal,
    setWorkModal,
  ] =
    useState<WorkModalState | null>(
      null
    );

  /*
   * VEHICLE LOOKUP
   */

  const vehicleMap =
    useMemo(() => {
      return new Map<
        string,
        Vehicle
      >(
        vehicles.map(
          (vehicle) =>
            [
              vehicle.id,
              vehicle,
            ] as const
        )
      );
    }, [vehicles]);

  /*
   * CATEGORIES
   */

  const categories =
    useMemo(() => {
      return Array.from(
        new Set(
          workItems
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
    }, [workItems]);

  /*
   * FILTERED ITEMS
   */

  const filteredItems =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return workItems.filter(
        (item) => {
          const vehicle =
            vehicleMap.get(
              item.vehicleId
            );

          const matchesSearch =
            !query ||
            item.title
              ?.toLowerCase()
              .includes(query) ||
            item.category
              ?.toLowerCase()
              .includes(query) ||
            item.workDescription
              ?.toLowerCase()
              .includes(query) ||
            item.notes
              ?.toLowerCase()
              .includes(query) ||
            vehicle?.name
              ?.toLowerCase()
              .includes(query) ||
            vehicle?.make
              ?.toLowerCase()
              .includes(query) ||
            vehicle?.model
              ?.toLowerCase()
              .includes(query);

          const matchesVehicle =
            vehicleFilter ===
              "All" ||
            item.vehicleId ===
              vehicleFilter;

          const matchesStatus =
            statusFilter ===
              "All" ||
            item.status ===
              statusFilter;

          const matchesPriority =
            priorityFilter ===
              "All" ||
            String(
              item.priority ??
                3
            ) ===
              priorityFilter;

          const matchesCategory =
            categoryFilter ===
              "All" ||
            item.category ===
              categoryFilter;

          return (
            matchesSearch &&
            matchesVehicle &&
            matchesStatus &&
            matchesPriority &&
            matchesCategory
          );
        }
      );
    }, [
      workItems,
      vehicleMap,
      search,
      vehicleFilter,
      statusFilter,
      priorityFilter,
      categoryFilter,
    ]);

  /*
   * STATS
   */

  const stats =
    useMemo(() => {
      const open =
        workItems.filter(
          (item) =>
            item.status !==
              "Completed" &&
            item.status !==
              "Cancelled"
        ).length;

      const priority1 =
        workItems.filter(
          (item) =>
            (item.priority ??
              3) === 1 &&
            item.status !==
              "Completed" &&
            item.status !==
              "Cancelled"
        ).length;

      const partsRequired =
        workItems.filter(
          (item) =>
            item.status ===
            "Parts Required"
        ).length;

      const inProgress =
        workItems.filter(
          (item) =>
            item.status ===
            "In Progress"
        ).length;

      return {
        total:
          workItems.length,

        open,

        priority1,

        partsRequired,

        inProgress,
      };
    }, [workItems]);

  /*
   * EDIT EXISTING WORK
   */

  function openEdit(
    item: WorkItem
  ) {
    const vehicle =
      vehicleMap.get(
        item.vehicleId
      );

    if (!vehicle) {
      return;
    }

    setWorkModal({
      vehicle,
      workItemId:
        item.id,
    });
  }

  /*
   * TOP ADD WORK
   */

  function startAddWork() {
    /*
     * If page is already filtered
     * to one vehicle, use it.
     */

    if (
      vehicleFilter !==
      "All"
    ) {
      const vehicle =
        vehicleMap.get(
          vehicleFilter
        );

      if (vehicle) {
        setWorkModal({
          vehicle,
        });

        return;
      }
    }

    /*
     * Otherwise open common
     * Work popup with vehicle
     * selector inside it.
     */

    setWorkModal({});
  }

  /*
   * CLEAR FILTERS
   */

  function clearFilters() {
    setSearch("");
    setVehicleFilter("All");
    setStatusFilter("All");
    setPriorityFilter("All");
    setCategoryFilter("All");
  }

  const filtersActive =
    search !== "" ||
    vehicleFilter !== "All" ||
    statusFilter !== "All" ||
    priorityFilter !== "All" ||
    categoryFilter !== "All";

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#1d2228]">
      {/* HEADER */}

      <header className="border-b border-[#e1e4e8] bg-white">
        <div className="flex items-center justify-between px-5 py-7 lg:px-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Work
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Workshop jobs across all vehicles
            </p>
          </div>

          <button
            type="button"
            onClick={
              startAddWork
            }
            className="rounded-lg bg-[#1d2228] px-5 py-3 text-sm font-medium text-white hover:bg-black"
          >
            + Add Work
          </button>
        </div>
      </header>

      <div className="px-5 py-7 lg:px-8">
        {/* SUMMARY */}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          <SummaryCard
            label="Total Work"
            value={stats.total}
          />

          <SummaryCard
            label="Open"
            value={stats.open}
          />

          <SummaryCard
            label="Priority 1"
            value={stats.priority1}
          />

          <SummaryCard
            label="Parts Required"
            value={
              stats.partsRequired
            }
          />

          <SummaryCard
            label="In Progress"
            value={
              stats.inProgress
            }
          />
        </div>

        {/* WORK ITEMS */}

        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              Work Items
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {filteredItems.length}{" "}
              {filteredItems.length ===
              1
                ? "work item"
                : "work items"}{" "}
              shown
            </p>
          </div>

          {/* FILTERS */}

          <div className="mb-5 rounded-xl border border-[#dfe2e6] bg-white p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1.4fr_1fr_1fr_1.2fr_auto]">
              {/* SEARCH */}

              <input
                type="search"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search work or vehicle..."
                className={
                  inputClass
                }
              />

              {/* VEHICLE */}

              <select
                value={
                  vehicleFilter
                }
                onChange={(e) =>
                  setVehicleFilter(
                    e.target.value
                  )
                }
                className={
                  inputClass
                }
              >
                <option value="All">
                  All Vehicles
                </option>

                {vehicles
                  .slice()
                  .sort((a, b) =>
                    a.name.localeCompare(
                      b.name
                    )
                  )
                  .map(
                    (vehicle) => (
                      <option
                        key={
                          vehicle.id
                        }
                        value={
                          vehicle.id
                        }
                      >
                        {
                          vehicle.name
                        }
                      </option>
                    )
                  )}
              </select>

              {/* STATUS */}

              <select
                value={
                  statusFilter
                }
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
                className={
                  inputClass
                }
              >
                <option value="All">
                  All Status
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

                <option value="Completed">
                  Completed
                </option>

                <option value="Cancelled">
                  Cancelled
                </option>
              </select>

              {/* PRIORITY */}

              <select
                value={
                  priorityFilter
                }
                onChange={(e) =>
                  setPriorityFilter(
                    e.target.value
                  )
                }
                className={
                  inputClass
                }
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

              {/* CATEGORY */}

              <select
                value={
                  categoryFilter
                }
                onChange={(e) =>
                  setCategoryFilter(
                    e.target.value
                  )
                }
                className={
                  inputClass
                }
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
                      {
                        category
                      }
                    </option>
                  )
                )}
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
                className="rounded-lg border border-[#d8dce1] bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear
              </button>
            </div>
          </div>

          {/* TABLE */}

          <div className="overflow-hidden rounded-xl border border-[#dfe2e6] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] border-collapse text-left">
                <thead className="border-b border-[#e1e4e8] bg-[#fafafa]">
                  <tr>
                    <TableHeader>
                      Priority
                    </TableHeader>

                    <TableHeader>
                      Vehicle
                    </TableHeader>

                    <TableHeader>
                      Work Item
                    </TableHeader>

                    <TableHeader>
                      Category
                    </TableHeader>

                    <TableHeader>
                      Status
                    </TableHeader>

                    <TableHeader>
                      Target
                    </TableHeader>

                    <TableHeader>
                      Odometer
                    </TableHeader>

                    <TableHeader align="right">
                      Est. Cost
                    </TableHeader>

                    <TableHeader align="right">
                      Actions
                    </TableHeader>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#e7e8ea]">
                  {filteredItems.length >
                  0 ? (
                    filteredItems.map(
                      (item) => {
                        const vehicle =
                          vehicleMap.get(
                            item.vehicleId
                          );

                        return (
                          <tr
                            key={
                              item.id
                            }
                            className="transition hover:bg-[#fafafa]"
                          >
                            {/* PRIORITY */}

                            <td className="px-5 py-4 align-top">
                              <PriorityBadge
                                priority={
                                  item.priority ??
                                  3
                                }
                              />
                            </td>

                            {/* VEHICLE */}

                            <td className="px-5 py-4 align-top">
                              {vehicle ? (
                                <>
                                  <Link
                                    href={`/vehicles/${vehicle.id}`}
                                    className="font-medium hover:underline"
                                  >
                                    {
                                      vehicle.name
                                    }
                                  </Link>

                                  <div className="mt-1 text-xs text-gray-400">
                                    {
                                      vehicle.year
                                    }{" "}
                                    ·{" "}
                                    {
                                      vehicle.make
                                    }
                                  </div>
                                </>
                              ) : (
                                <span className="text-gray-400">
                                  Unknown
                                </span>
                              )}
                            </td>

                            {/* WORK TITLE */}

                            <td className="max-w-[360px] px-5 py-4 align-top">
                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    item
                                  )
                                }
                                className="text-left font-medium hover:underline"
                              >
                                {
                                  item.title
                                }
                              </button>

                              {item.workDescription && (
                                <div className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                                  {
                                    item.workDescription
                                  }
                                </div>
                              )}
                            </td>

                            {/* CATEGORY */}

                            <td className="px-5 py-4 align-top text-sm text-gray-600">
                              {item.category ||
                                "General"}
                            </td>

                            {/* STATUS */}

                            <td className="px-5 py-4 align-top">
                              <StatusBadge
                                status={
                                  item.status ||
                                  "Planned"
                                }
                              />
                            </td>

                            {/* TARGET */}

                            <td className="px-5 py-4 align-top text-sm">
                              {item.targetDate
                                ? formatDate(
                                    item.targetDate
                                  )
                                : "—"}
                            </td>

                            {/* ODOMETER */}

                            <td className="px-5 py-4 align-top text-sm">
                              {item.odometer !==
                                undefined &&
                              item.odometer !==
                                null
                                ? `${item.odometer.toLocaleString()} ${
                                    vehicle?.odometerUnit ||
                                    "km"
                                  }`
                                : "—"}
                            </td>

                            {/* COST */}

                            <td className="px-5 py-4 text-right align-top text-sm">
                              {item.estimatedCost !==
                                undefined &&
                              item.estimatedCost !==
                                null
                                ? `${vehicle?.currency || ""} ${item.estimatedCost.toLocaleString()}`.trim()
                                : "—"}
                            </td>

                            {/* ACTIONS */}

                            <td className="px-5 py-4 text-right align-top">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEdit(
                                      item
                                    )
                                  }
                                  className="rounded-lg border border-[#d8dce1] bg-white px-3 py-2 text-xs font-medium hover:bg-gray-50"
                                >
                                  Edit
                                </button>

                                {vehicle && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setWorkModal(
                                        {
                                          vehicle,
                                        }
                                      )
                                    }
                                    className="rounded-lg border border-[#d8dce1] bg-white px-3 py-2 text-xs font-medium hover:bg-gray-50"
                                  >
                                    + Work
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-5 py-16 text-center text-sm text-gray-500"
                      >
                        No work items
                        match the selected
                        filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* COMMON WORK POPUP */}

      {workModal && (
        <VehicleWorkModal
          vehicle={
            workModal.vehicle
          }
          vehicles={vehicles}
          initialWorkItemId={
            workModal.workItemId
          }
          onChanged={() => {
            /*
             * Refresh Work page
             * server data after add/edit.
             */
            router.refresh();
          }}
          onClose={() => {
            setWorkModal(null);

            /*
             * Also refresh when closing.
             */
            router.refresh();
          }}
        />
      )}
    </main>
  );
}

/*
 * COMMON INPUT
 */

const inputClass =
  "w-full rounded-lg border border-[#d8dce1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";

/*
 * SUMMARY CARD
 */

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

/*
 * TABLE HEADER
 */

function TableHeader({
  children,
  align = "left",
}: {
  children:
    React.ReactNode;

  align?:
    | "left"
    | "right";
}) {
  return (
    <th
      className={`px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 ${
        align ===
        "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

/*
 * PRIORITY
 */

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
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
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

/*
 * STATUS
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

    Completed:
      "bg-green-100 text-green-700",

    Cancelled:
      "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
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

/*
 * DATE
 */

function formatDate(
  date: string
) {
  const parts =
    date.split("-");

  if (
    parts.length !==
    3
  ) {
    return date;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}