"use client";

import Link from "next/link";

import {
  Vehicle,
} from "@/lib/mock-data";

export default function VehicleCard({
  vehicle,
  wishlist = false,
  workCount = 0,
  onWork,
}: {
  vehicle: Vehicle;

  wishlist?: boolean;

  workCount?: number;

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

          {!wishlist && (
            <button
              type="button"
              onClick={
                onWork
              }
              title="View, edit or add work items"
              aria-label="View, edit or add work items"
              className={
                iconButtonClass
              }
            >
              <WorkIcon />
            </button>
          )}
        </div>
      </div>

      {/* DETAILS */}

      <Link
        href={`/vehicles/${vehicle.id}`}
        className="block p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 truncate text-base font-semibold">
            {
              vehicle.name
            }
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
            {/* ODOMETER */}

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

            {/* OPEN WORK */}

            <div className="min-w-0 text-right">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Work ({workCount})
              </p>

              <p className="mt-1 truncate text-sm">
                {workCount === 1
                  ? "1 pending item"
                  : `${workCount} pending items`}
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
        styles[
          status
        ] ||
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