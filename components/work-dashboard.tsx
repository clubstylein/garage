"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Vehicle, WorkItem } from "@/lib/mock-data";
import VehicleWorkModal from "@/components/vehicle-work-modal";

type WorkModalState = {
  vehicle?: Vehicle;
  workItemId?: string;
  openAddPart?: boolean;
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

  const workVehicles = useMemo(() => {
    return vehicles.filter(
      (vehicle) =>
        String(vehicle.ownershipStatus || "").trim().toLowerCase() !==
        "wishlist"
    );
  }, [vehicles]);

  const vehicleMap = useMemo(() => {
    return new Map(
      workVehicles.map((vehicle) => [String(vehicle.id), vehicle] as const)
    );
  }, [workVehicles]);

  const validWorkItems = useMemo(() => {
    return workItems.filter((item) => {
      if (!item.vehicleId) return true;
      return vehicleMap.has(String(item.vehicleId));
    });
  }, [workItems, vehicleMap]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        validWorkItems
          .map((item) => item.category)
          .filter((value): value is string => Boolean(value))
      )
    ).sort();
  }, [validWorkItems]);

  function isOpenWork(item: WorkItem) {
    return item.status !== "Completed" && item.status !== "Cancelled";
  }

  function getVehicleCustomerName(vehicle?: Vehicle | null) {
    if (!vehicle) return "";
    return String(
      vehicle.customerName ?? vehicle.customer?.name ?? ""
    ).trim();
  }

  function getVehicleCustomerCategory(vehicle?: Vehicle | null) {
    if (!vehicle) return "";
    return String(
      vehicle.customerCategory ?? vehicle.customer?.category ?? ""
    ).trim();
  }

  function getCustomerName(item: WorkItem, vehicle?: Vehicle | null) {
    return String(item.customerName || getVehicleCustomerName(vehicle) || "").trim();
  }

  function getCustomerCategory(item: WorkItem, vehicle?: Vehicle | null) {
    return String(
      item.customerCategory || getVehicleCustomerCategory(vehicle) || ""
    ).trim();
  }

  function formatCustomerCategory(category: string) {
    const value = String(category).trim().toLowerCase();
    if (value === "self-owned") return "Self-owned";
    if (value === "vip") return "VIP";
    if (value === "general") return "General";
    return category;
  }

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return validWorkItems.filter((item) => {
      const itemVehicleId = item.vehicleId ? String(item.vehicleId) : "";
      const vehicle = itemVehicleId ? vehicleMap.get(itemVehicleId) : undefined;

      const customerName = getCustomerName(item, vehicle);
      const customerCategory = getCustomerCategory(item, vehicle);

      const searchText = [
        item.title,
        item.category,
        item.workDescription,
        item.notes,
        item.vehicleText,
        item.customerCode,
        item.customerName,
        item.customerCategory,
        customerName,
        customerCategory,
        vehicle?.name,
        vehicle?.make,
        vehicle?.model,
        vehicle?.variant,
        vehicle?.registrationNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchText.includes(query);

      const matchesVehicle =
        vehicleFilter === "All" || itemVehicleId === String(vehicleFilter);

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

  const stats = useMemo(() => {
    return {
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
    };
  }, [validWorkItems]);

  function showTotal() {
    setStatusFilter("All");
    setPriorityFilter("All");
  }

  function showOpen() {
    setStatusFilter("Open");
    setPriorityFilter("All");
  }

  function showPriority1() {
    setStatusFilter("Open");
    setPriorityFilter("1");
  }

  function showPartsRequired() {
    setStatusFilter("Parts Required");
    setPriorityFilter("All");
  }

  function showInProgress() {
    setStatusFilter("In Progress");
    setPriorityFilter("All");
  }

  const totalActive = statusFilter === "All" && priorityFilter === "All";
  const openActive = statusFilter === "Open" && priorityFilter === "All";
  const p1Active = statusFilter === "Open" && priorityFilter === "1";
  const partsActive =
    statusFilter === "Parts Required" && priorityFilter === "All";
  const progressActive =
    statusFilter === "In Progress" && priorityFilter === "All";

  function openEdit(item: WorkItem) {
    const vehicle = item.vehicleId
      ? vehicleMap.get(String(item.vehicleId))
      : undefined;

    setWorkModal({
      vehicle,
      workItemId: item.id,
    });
  }

  function openAddPart(item: WorkItem) {
    const vehicle = item.vehicleId
      ? vehicleMap.get(String(item.vehicleId))
      : undefined;

    setWorkModal({
      vehicle,
      workItemId: item.id,
      openAddPart: true,
    });
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
      <section className="border-b border-[#e1e4e8] bg-white">
        <div className="px-5 py-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Work</h1>
              <p className="mt-1 text-sm text-gray-500">
                Workshop jobs across self-owned and customer vehicles
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <CompactStat
                label="Total"
                value={stats.total}
                active={totalActive}
                onClick={showTotal}
              />
              <CompactStat
                label="Open"
                value={stats.open}
                active={openActive}
                onClick={showOpen}
              />
              <CompactStat
                label="P1"
                value={stats.priority1}
                active={p1Active}
                onClick={showPriority1}
              />
              <CompactStat
                label="Parts"
                value={stats.partsRequired}
                active={partsActive}
                onClick={showPartsRequired}
              />
              <CompactStat
                label="In Progress"
                value={stats.inProgress}
                active={progressActive}
                onClick={showInProgress}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="px-5 py-5 lg:px-8">
        <div className="mb-5 rounded-xl border border-[#dfe2e6] bg-white p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:flex-nowrap xl:items-center">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search work, vehicle or customer..."
              className={`${inputClass} xl:min-w-[260px] xl:flex-[2.2]`}
            />

            <select
              value={vehicleFilter}
              onChange={(event) => setVehicleFilter(event.target.value)}
              className={`${selectClass} xl:min-w-[180px] xl:flex-[1.5]`}
            >
              <option value="All">All Vehicles</option>
              {workVehicles
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((vehicle) => {
                  const customerName = getVehicleCustomerName(vehicle);
                  return (
                    <option key={vehicle.id} value={String(vehicle.id)}>
                      {vehicle.name}
                      {customerName ? ` — ${customerName}` : ""}
                    </option>
                  );
                })}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`${selectClass} xl:min-w-[145px] xl:flex-1`}
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
              className={`${selectClass} xl:min-w-[140px] xl:flex-1`}
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
              className={`${selectClass} xl:min-w-[150px] xl:flex-1`}
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
              className="h-[42px] shrink-0 whitespace-nowrap rounded-lg border border-[#d8dce1] bg-white px-4 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={startAddWork}
              className="h-[42px] shrink-0 whitespace-nowrap rounded-lg bg-[#1d2228] px-5 text-sm font-medium text-white hover:bg-black"
            >
              + Add Work
            </button>
          </div>

          <div className="mt-3 text-xs text-gray-400">
            Showing <span className="font-medium text-gray-600">{filteredItems.length}</span>{" "}
            of <span className="font-medium text-gray-600">{validWorkItems.length}</span>{" "}
            work items
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#dfe2e6] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-left">
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
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const vehicle = item.vehicleId
                      ? vehicleMap.get(String(item.vehicleId))
                      : undefined;
                    const customerName = getCustomerName(item, vehicle);
                    const customerCategory = getCustomerCategory(item, vehicle);
                    const vehicleLabel = vehicle?.name || item.vehicleText || "Unknown vehicle";

                    return (
                      <tr key={item.id} className="transition hover:bg-[#fafafa]">
                        <td className="px-5 py-4 align-top">
                          <PriorityBadge priority={item.priority ?? 3} />
                        </td>

                        <td className="px-5 py-4 align-top">
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
                              <div className="font-medium">{vehicleLabel}</div>
                              <div className="mt-1 text-xs text-gray-400">Free text</div>
                            </>
                          )}
                        </td>

                        <td className="px-5 py-4 align-top">
                          {customerName ? (
                            <>
                              <div className="text-sm font-medium">{customerName}</div>
                              {customerCategory && (
                                <div className="mt-1 text-xs text-gray-400">
                                  {formatCustomerCategory(customerCategory)}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>

                        <td className="max-w-[360px] px-5 py-4 align-top">
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

                        <td className="px-5 py-4 align-top text-sm text-gray-600">
                          {item.category || "General"}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <StatusBadge status={item.status || "Planned"} />
                        </td>

                        <td className="px-5 py-4 align-top text-sm">
                          {item.targetDate ? formatDate(item.targetDate) : "—"}
                        </td>

                        <td className="px-5 py-4 align-top text-sm">
                          {item.odometer !== undefined && item.odometer !== null
                            ? `${item.odometer.toLocaleString()} ${vehicle?.odometerUnit || ""}`.trim()
                            : "—"}
                        </td>

                        <td className="px-5 py-4 text-right align-top text-sm">
                          {item.estimatedCost !== undefined && item.estimatedCost !== null
                            ? `${vehicle?.currency || ""} ${item.estimatedCost.toLocaleString()}`.trim()
                            : "—"}
                        </td>

                        <td className="px-5 py-4 text-right align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="rounded-lg border border-[#d8dce1] bg-white px-3 py-2 text-xs font-medium hover:bg-gray-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => openAddPart(item)}
                              className="whitespace-nowrap rounded-lg border border-[#d8dce1] bg-white px-3 py-2 text-xs font-medium hover:bg-gray-50"
                            >
                              + Part
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-5 py-16 text-center text-sm text-gray-500"
                    >
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
          openAddPartOnLoad={workModal.openAddPart === true}
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
  "h-[42px] w-full min-w-0 rounded-lg border border-[#d8dce1] bg-white px-3 text-sm outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";

const selectClass =
  "h-[42px] w-full min-w-0 rounded-lg border border-[#d8dce1] bg-white px-3 text-sm text-[#1d2228] outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";

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
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 transition ${
        active
          ? "border-[#1d2228] bg-[#1d2228] text-white"
          : "border-[#dfe2e6] bg-[#fafafa] text-[#1d2228] hover:border-[#aeb4bb] hover:bg-white"
      }`}
    >
      <span
        className={`text-[11px] font-medium uppercase tracking-wide ${
          active ? "text-gray-300" : "text-gray-400"
        }`}
      >
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
      className={`px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 ${
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
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[priority] || styles[3]
      }`}
    >
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
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

function formatDate(date: string) {
  const parts = date.split("-");
  if (parts.length !== 3) return date;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
