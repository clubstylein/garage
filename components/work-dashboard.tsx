"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Vehicle, WorkItem } from "@/lib/mock-data";
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
  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [workModal, setWorkModal] = useState<WorkModalState | null>(null);

  const workVehicles = useMemo(
    () =>
      vehicles.filter(
        (vehicle) =>
          String(vehicle.ownershipStatus || "").trim().toLowerCase() !==
          "wishlist"
      ),
    [vehicles]
  );

  const vehicleMap = useMemo(
    () =>
      new Map(
        workVehicles.map((vehicle) => [String(vehicle.id), vehicle] as const)
      ),
    [workVehicles]
  );

  const validWorkItems = useMemo(
    () =>
      workItems.filter((item) => {
        if (!item.vehicleId) return true;
        return vehicleMap.has(String(item.vehicleId));
      }),
    [workItems, vehicleMap]
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          validWorkItems
            .map((item) => item.category)
            .filter((value): value is string => Boolean(value))
        )
      ).sort(),
    [validWorkItems]
  );

  function isOpenWork(item: WorkItem) {
    return item.status !== "Completed" && item.status !== "Cancelled";
  }

  function itemVehicle(item: WorkItem) {
    return item.vehicleId ? vehicleMap.get(String(item.vehicleId)) : undefined;
  }

  function customerName(item: WorkItem, vehicle?: Vehicle) {
    return (
      item.customerName || vehicle?.customerName || vehicle?.customer?.name || ""
    );
  }

  function customerCode(item: WorkItem, vehicle?: Vehicle) {
    return (
      item.customerCode ||
      vehicle?.customerCode ||
      vehicle?.customer?.customerCode ||
      ""
    );
  }

  function customerCategory(item: WorkItem, vehicle?: Vehicle) {
    return (
      item.customerCategory ||
      vehicle?.customerCategory ||
      vehicle?.customer?.category ||
      ""
    );
  }

  function vehicleLabel(item: WorkItem, vehicle?: Vehicle) {
    return vehicle?.name || item.vehicleText || "Unspecified vehicle";
  }

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return validWorkItems.filter((item) => {
      const vehicle = itemVehicle(item);
      const vehicleId = String(item.vehicleId || "");

      const searchText = [
        item.title,
        item.category,
        item.workDescription,
        item.notes,
        item.vehicleText,
        vehicle?.name,
        vehicle?.make,
        vehicle?.model,
        vehicle?.variant,
        vehicle?.registrationNumber,
        customerName(item, vehicle),
        customerCode(item, vehicle),
        customerCategory(item, vehicle),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchText.includes(query);
      const matchesVehicle =
        vehicleFilter === "All" || vehicleId === String(vehicleFilter);

      let matchesStatus = true;
      if (statusFilter === "Open") {
        matchesStatus = isOpenWork(item);
      } else if (statusFilter !== "All") {
        matchesStatus = item.status === statusFilter;
      }

      const matchesPriority =
        priorityFilter === "All" ||
        String(item.priority ?? 3) === priorityFilter;
      const matchesCategory =
        categoryFilter === "All" || item.category === categoryFilter;

      return (
        matchesSearch &&
        matchesVehicle &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory
      );
    });
  }, [
    validWorkItems,
    vehicleMap,
    search,
    vehicleFilter,
    statusFilter,
    priorityFilter,
    categoryFilter,
  ]);

  const stats = useMemo(
    () => ({
      total: validWorkItems.length,
      open: validWorkItems.filter(isOpenWork).length,
      priority1: validWorkItems.filter(
        (item) => Number(item.priority ?? 3) === 1 && isOpenWork(item)
      ).length,
      partsRequired: validWorkItems.filter(
        (item) => item.status === "Parts Required"
      ).length,
      inProgress: validWorkItems.filter(
        (item) => item.status === "In Progress"
      ).length,
    }),
    [validWorkItems]
  );

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

  function openEdit(item: WorkItem) {
    const vehicle = itemVehicle(item);
    setWorkModal({ vehicle, workItemId: item.id });
  }

  function startAddWork() {
    if (vehicleFilter !== "All") {
      const vehicle = vehicleMap.get(String(vehicleFilter));
      if (vehicle) {
        setWorkModal({ vehicle });
        return;
      }
    }

    setWorkModal({});
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#1d2228]">
      <section className="border-b border-[#e1e4e8] bg-white">
        <div className="px-4 py-4 sm:px-5 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Work</h1>
              <p className="mt-1 text-sm text-gray-500">
                Workshop jobs across self-owned and customer vehicles
              </p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 lg:justify-end">
              <CompactStat
                label="Total"
                value={stats.total}
                active={statusFilter === "All" && priorityFilter === "All"}
                onClick={() => {
                  setStatusFilter("All");
                  setPriorityFilter("All");
                }}
              />
              <CompactStat
                label="Open"
                value={stats.open}
                active={statusFilter === "Open" && priorityFilter === "All"}
                onClick={() => {
                  setStatusFilter("Open");
                  setPriorityFilter("All");
                }}
              />
              <CompactStat
                label="P1"
                value={stats.priority1}
                active={statusFilter === "Open" && priorityFilter === "1"}
                onClick={() => {
                  setStatusFilter("Open");
                  setPriorityFilter("1");
                }}
              />
              <CompactStat
                label="Parts"
                value={stats.partsRequired}
                active={statusFilter === "Parts Required"}
                onClick={() => {
                  setStatusFilter("Parts Required");
                  setPriorityFilter("All");
                }}
              />
              <CompactStat
                label="In Progress"
                value={stats.inProgress}
                active={statusFilter === "In Progress"}
                onClick={() => {
                  setStatusFilter("In Progress");
                  setPriorityFilter("All");
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="px-3 py-4 sm:px-5 sm:py-5 lg:px-8">
        <div className="mb-4 rounded-xl border border-[#dfe2e6] bg-white p-3 sm:p-4">
          <div className="grid gap-2 sm:grid-cols-2 xl:flex xl:flex-nowrap xl:items-center">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search work, vehicle or customer..."
              className={`${inputClass} sm:col-span-2 xl:min-w-[260px] xl:flex-[2.2]`}
            />

            <select
              value={vehicleFilter}
              onChange={(event) => setVehicleFilter(event.target.value)}
              className={`${inputClass} xl:min-w-[180px] xl:flex-[1.5]`}
            >
              <option value="All">All Vehicles</option>
              {workVehicles
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((vehicle) => (
                  <option key={vehicle.id} value={String(vehicle.id)}>
                    {vehicle.name}
                    {vehicle.customerName ? ` — ${vehicle.customerName}` : ""}
                  </option>
                ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`${inputClass} xl:min-w-[145px] xl:flex-1`}
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="Idea">Idea</option>
              <option value="Planned">Planned</option>
              <option value="Parts Required">Parts Required</option>
              <option value="Parts Ordered">Parts Ordered</option>
              <option value="Ready">Ready</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className={`${inputClass} xl:min-w-[135px] xl:flex-1`}
            >
              <option value="All">All Priority</option>
              <option value="1">P1 — Urgent</option>
              <option value="2">P2 — High</option>
              <option value="3">P3 — Normal</option>
              <option value="4">P4 — Low</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className={`${inputClass} xl:min-w-[150px] xl:flex-1`}
            >
              <option value="All">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!filtersActive}
              className="h-11 rounded-lg border border-[#d8dce1] bg-white px-4 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 xl:shrink-0"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={startAddWork}
              className="h-11 rounded-lg bg-[#1d2228] px-5 text-sm font-medium text-white hover:bg-black sm:col-span-2 xl:col-span-1 xl:shrink-0"
            >
              + Add Work
            </button>
          </div>

          <div className="mt-3 text-xs text-gray-400">
            Showing <span className="font-medium text-gray-600">{filteredItems.length}</span> of{" "}
            <span className="font-medium text-gray-600">{validWorkItems.length}</span> work items
          </div>
        </div>

        <div className="space-y-2 md:hidden">
          {filteredItems.map((item) => {
            const vehicle = itemVehicle(item);
            const customer = customerName(item, vehicle);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openEdit(item)}
                className="w-full rounded-xl border border-[#dfe2e6] bg-white p-3 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{item.title}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {vehicleLabel(item, vehicle)}
                      {customer ? ` · ${customer}` : ""}
                    </div>
                  </div>
                  <PriorityBadge priority={item.priority ?? 3} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <StatusBadge status={item.status || "Planned"} />
                  <span className="text-gray-500">{item.category || "General"}</span>
                  {item.targetDate && (
                    <span className="text-gray-500">Target {formatDate(item.targetDate)}</span>
                  )}
                </div>
              </button>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="rounded-xl border border-[#dfe2e6] bg-white px-4 py-12 text-center text-sm text-gray-500">
              No work items match the selected filters.
            </div>
          )}
        </div>

        <div className="hidden overflow-hidden rounded-xl border border-[#dfe2e6] bg-white md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-left">
              <thead className="border-b border-[#e1e4e8] bg-[#fafafa]">
                <tr>
                  <TableHeader>Priority</TableHeader>
                  <TableHeader>Vehicle</TableHeader>
                  <TableHeader>Customer</TableHeader>
                  <TableHeader>Work Item</TableHeader>
                  <TableHeader>Category</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Target</TableHeader>
                  <TableHeader>Odometer</TableHeader>
                  <TableHeader align="right">Est. Cost</TableHeader>
                  <TableHeader align="right">Actions</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#e7e8ea]">
                {filteredItems.map((item) => {
                  const vehicle = itemVehicle(item);
                  const customer = customerName(item, vehicle);
                  const category = customerCategory(item, vehicle);

                  return (
                    <tr key={item.id} className="transition hover:bg-[#fafafa]">
                      <td className="px-4 py-4 align-top">
                        <PriorityBadge priority={item.priority ?? 3} />
                      </td>

                      <td className="px-4 py-4 align-top">
                        {vehicle ? (
                          <>
                            <Link
                              href={`/vehicles/${vehicle.id}`}
                              className="font-medium hover:underline"
                            >
                              {vehicle.name}
                            </Link>
                            <div className="mt-1 text-xs text-gray-400">
                              {vehicle.year} · {vehicle.make}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium">{item.vehicleText || "—"}</div>
                            {item.vehicleText && (
                              <div className="mt-1 text-xs text-gray-400">Free text</div>
                            )}
                          </>
                        )}
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="text-sm font-medium">{customer || "—"}</div>
                        {category && (
                          <div className="mt-1 text-xs text-gray-400">
                            {formatCustomerCategory(category)}
                          </div>
                        )}
                      </td>

                      <td className="max-w-[330px] px-4 py-4 align-top">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="text-left font-medium hover:underline"
                        >
                          {item.title}
                        </button>
                        {item.workDescription && (
                          <div className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                            {item.workDescription}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-gray-600">
                        {item.category || "General"}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <StatusBadge status={item.status || "Planned"} />
                      </td>
                      <td className="px-4 py-4 align-top text-sm">
                        {item.targetDate ? formatDate(item.targetDate) : "—"}
                      </td>
                      <td className="px-4 py-4 align-top text-sm">
                        {item.odometer !== undefined && item.odometer !== null
                          ? `${item.odometer.toLocaleString()} ${vehicle?.odometerUnit || ""}`.trim()
                          : "—"}
                      </td>
                      <td className="px-4 py-4 text-right align-top text-sm">
                        {item.estimatedCost !== undefined && item.estimatedCost !== null
                          ? `${vehicle?.currency || ""} ${item.estimatedCost.toLocaleString()}`.trim()
                          : "—"}
                      </td>
                      <td className="px-4 py-4 text-right align-top">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="rounded-lg border border-[#d8dce1] bg-white px-3 py-2 text-xs font-medium hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          {vehicle && (
                            <button
                              type="button"
                              onClick={() => setWorkModal({ vehicle })}
                              className="rounded-lg border border-[#d8dce1] bg-white px-3 py-2 text-xs font-medium hover:bg-gray-50"
                            >
                              + Work
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-5 py-16 text-center text-sm text-gray-500">
                      No work items match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {workModal && (
        <VehicleWorkModal
          vehicle={workModal.vehicle}
          vehicles={workVehicles}
          initialWorkItemId={workModal.workItemId}
          onChanged={() => router.refresh()}
          onClose={() => {
            setWorkModal(null);
            router.refresh();
          }}
        />
      )}
    </main>
  );
}

const inputClass =
  "h-11 w-full min-w-0 rounded-lg border border-[#d8dce1] bg-white px-3 text-sm text-[#1d2228] outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";

function CompactStat({
  label,
  value,
  active = false,
  onClick,
}: {
  label: string;
  value: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border px-3 transition ${
        active
          ? "border-[#1d2228] bg-[#1d2228] text-white"
          : "border-[#dfe2e6] bg-[#fafafa] text-[#1d2228] hover:border-[#aeb4bb] hover:bg-white"
      }`}
    >
      <span className={`text-[11px] font-medium uppercase tracking-wide ${active ? "text-gray-300" : "text-gray-400"}`}>
        {label}
      </span>
      <span className="text-sm font-semibold">{value}</span>
    </button>
  );
}

function TableHeader({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  const styles: Record<number, string> = {
    1: "bg-red-100 text-red-700",
    2: "bg-orange-100 text-orange-700",
    3: "bg-gray-100 text-gray-600",
    4: "bg-gray-50 text-gray-400",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[priority] || styles[3]}`}>
      P{priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Idea: "bg-gray-100 text-gray-600",
    Planned: "bg-blue-100 text-blue-700",
    "Parts Required": "bg-orange-100 text-orange-700",
    "Parts Ordered": "bg-yellow-100 text-yellow-700",
    Ready: "bg-cyan-100 text-cyan-700",
    "In Progress": "bg-purple-100 text-purple-700",
    "On Hold": "bg-gray-100 text-gray-600",
    Completed: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
  };

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function formatCustomerCategory(category: string) {
  const value = String(category).trim().toLowerCase();
  if (value === "self-owned") return "Self-owned";
  if (value === "vip") return "VIP";
  if (value === "general") return "General";
  return category;
}

function formatDate(date: string) {
  const parts = date.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : date;
}
