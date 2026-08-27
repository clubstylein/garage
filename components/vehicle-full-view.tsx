"use client";

import Link from "next/link";
import { useState } from "react";
import { Vehicle, WorkItem } from "@/lib/mock-data";
import TopNav from "@/components/top-nav";


type Section =
  | "Overview"
  | "Work Plan"
  | "Maintenance"
  | "Parts"
  | "Expenses"
  | "Documents";

export default function VehicleDashboard({
  vehicle,
  workItems,
}: {
  vehicle: Vehicle;
  workItems: WorkItem[];
}) {
  const [section, setSection] = useState<Section>("Overview");

const vehicleWork = workItems;

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#1c2026]">
      <TopNav />

      <main>
        <header className="border-b border-[#e1e4e8] bg-white">
          <div className="px-5 py-5 lg:px-8">
            <Link
              href="/"
              className="mb-4 inline-block text-sm text-gray-500 hover:text-black"
            >
              ← Vehicles
            </Link>

            <div className="flex flex-wrap items-center justify-between gap-5">
              <div className="flex items-center gap-5">
                <div className="flex h-24 w-32 items-center justify-center rounded-xl bg-[#e9ebee] text-xs text-gray-400">
                  Vehicle Photo
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold">
                      {vehicle.name}
                    </h1>

                    <StatusBadge status={vehicle.status} />
                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    {vehicle.year} · {vehicle.make} · {vehicle.model}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-5 text-sm">
                    <HeaderInfo
                      label="Odometer"
                      value={`${vehicle.odometer.toLocaleString()} ${
                        vehicle.odometerUnit
                      }`}
                    />

                    <HeaderInfo
                      label="Location"
                      value={vehicle.location}
                    />

                    <HeaderInfo
                      label="Engine"
                      value={
                        vehicle.engine
                          ? `${vehicle.engine}${
                              vehicle.engineCc
                                ? ` · ${vehicle.engineCc} cc`
                                : ""
                            }`
                          : "—"
                      }
                    />
                  </div>
                </div>
              </div>

<Link
  href={`/vehicles/${vehicle.id}/edit`}
  className="rounded-lg border border-[#d8dce1] bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
>
  Edit Vehicle
</Link>

            </div>
          </div>
        </header>

        <div className="px-5 py-5 lg:px-8">
          <nav className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-[#e0e3e7] bg-white p-1">
            {(
              [
                "Overview",
                "Work Plan",
                "Maintenance",
                "Parts",
                "Expenses",
                "Documents",
              ] as Section[]
            ).map((item) => (
              <button
                key={item}
                onClick={() => setSection(item)}
                className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm ${
                  section === item
                    ? "bg-[#1d2228] font-medium text-white"
                    : "text-gray-500 hover:bg-gray-50 hover:text-black"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          {section === "Overview" && (
            <Overview
              vehicle={vehicle}
              workCount={vehicleWork.length}
              onOpenWorkPlan={() => setSection("Work Plan")}
            />
          )}

{section === "Work Plan" && (
  <WorkPlan
    items={workItems}
    vehicleId={vehicle.id}
  />
)}

          {section === "Maintenance" && (
            <EmptySection
              title="Maintenance History"
              action="+ Add Maintenance"
            />
          )}

          {section === "Parts" && (
            <EmptySection title="Parts" action="+ Add Part" />
          )}

          {section === "Expenses" && (
            <EmptySection title="Expenses" action="+ Add Expense" />
          )}

          {section === "Documents" && (
            <EmptySection
              title="Documents & Photos"
              action="+ Upload"
            />
          )}
        </div>
      </main>
    </div>
  );
}

function Overview({
  vehicle,
  workCount,
  onOpenWorkPlan,
}: {
  vehicle: Vehicle;
  workCount: number;
  onOpenWorkPlan: () => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card title="Vehicle Details">
        <Detail label="Make" value={vehicle.make} />
        <Detail label="Model" value={vehicle.model} />
        <Detail label="Year" value={String(vehicle.year)} />
        <Detail label="Status" value={vehicle.status} />
      </Card>

      <Card title="Engine">
        <Detail label="Platform" value={vehicle.engine ?? "—"} />

        <Detail
          label="Capacity"
          value={vehicle.engineCc ? `${vehicle.engineCc} cc` : "—"}
        />
      </Card>

      <Card title="Current Status">
        <Detail
          label="Odometer"
          value={`${vehicle.odometer.toLocaleString()} ${
            vehicle.odometerUnit
          }`}
        />

        <Detail label="Location" value={vehicle.location} />
      </Card>

      <Card title="Work Plan">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-semibold">{workCount}</div>

            <div className="mt-1 text-sm text-gray-500">
              Open work items
            </div>
          </div>

          <button
            onClick={onOpenWorkPlan}
            className="text-sm font-medium text-gray-600 hover:text-black"
          >
            View Work Plan →
          </button>
        </div>
      </Card>

      <Card title="Service">
        <Detail label="Last Service" value="—" />
        <Detail label="Next Service" value="—" />
      </Card>

      <Card title="Ownership">
        <Detail label="Purchase Date" value="—" />
        <Detail label="Purchase Price" value="—" />
      </Card>
    </div>
  );
}


function WorkPlan({
  items: allItems,
  vehicleId,
}: {
  items: WorkItem[];
  vehicleId: string;
}) {
  const [filter, setFilter] = useState("All");


  const items =
    filter === "All"
      ? allItems
      : allItems.filter((item) => item.status === filter);

  const priorities = {
    critical: allItems.filter((item) => item.priority === 1).length,
    high: allItems.filter((item) => item.priority === 2).length,
  };

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Work Plan</h2>

          <p className="mt-1 text-sm text-gray-500">
            Current and planned workshop jobs
          </p>
        </div>

<Link
  href={`/vehicles/${vehicleId}/work/new`}
  className="rounded-lg bg-[#1d2228] px-4 py-2.5 text-sm font-medium text-white hover:bg-black"
>
  + Add Work
</Link>

      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <WorkSummary label="Open Jobs" value={allItems.length} />

        <WorkSummary
          label="Priority 1"
          value={priorities.critical}
        />

        <WorkSummary
          label="Priority 2"
          value={priorities.high}
        />

        <WorkSummary
          label="Parts Required"
          value={
            allItems.filter(
              (item) => item.status === "Parts Required"
            ).length
          }
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          "All",
          "Planned",
          "Parts Required",
          "In Progress",
          "Completed",
        ].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-lg border px-3 py-2 text-sm ${
              filter === status
                ? "border-[#1d2228] bg-[#1d2228] text-white"
                : "border-[#d8dce1] bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-[#e0e3e7] bg-white p-5"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <PriorityBadge priority={item.priority ?? 3} />

                  <span className="text-xs text-gray-400">
                    {item.category || "General"}
                  </span>

                </div>

                <h3 className="font-semibold">{item.title}</h3>
              </div>

<span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
  {item.status || "Planned"}
</span>
            </div>

{item.workDescription && (
  <p className="mt-4 text-sm leading-6 text-gray-500">
    {item.workDescription}
  </p>
)}

            <div className="mt-5 flex items-center justify-between border-t border-[#eceef0] pt-4">
              <span className="text-xs text-gray-400">
                Priority {item.priority ?? 3}
              </span>

              <button className="text-sm font-medium text-gray-700 hover:text-black">
                Open →
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-sm text-gray-500">
            No work items in this status.
          </div>
        )}
      </div>
    </section>
  );
}

function WorkSummary({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-[#e0e3e7] bg-white px-4 py-4">
      <div className="text-xs uppercase tracking-wide text-gray-400">
        {label}
      </div>

      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function EmptySection({
  title,
  action,
}: {
  title: string;
  action: string;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>

        <button className="rounded-lg bg-[#1d2228] px-4 py-2.5 text-sm font-medium text-white">
          {action}
        </button>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
        <p className="text-sm text-gray-500">
          This section will be added next.
        </p>
      </div>
    </section>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#e0e3e7] bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>

      {children}
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-5 border-b border-[#eceef0] py-2.5 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>

      <span className="text-right text-sm font-medium">
        {value}
      </span>
    </div>
  );
}

function HeaderInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span className="mr-1 text-xs text-gray-400">
        {label}
      </span>

      <span className="font-medium">{value}</span>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-semibold ${
        priority === 1
          ? "bg-red-100 text-red-700"
          : priority === 2
          ? "bg-amber-100 text-amber-700"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      P{priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    Running: "bg-green-100 text-green-700",
    Repair: "bg-red-100 text-red-700",
    "Custom Project": "bg-amber-100 text-amber-700",
    "For Parts": "bg-gray-800 text-white",
    Stored: "bg-blue-100 text-blue-700",
    Sold: "bg-gray-200 text-gray-600",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        classes[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}