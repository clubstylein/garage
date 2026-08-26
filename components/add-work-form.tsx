"use client";

import {
  FormEvent,
  ReactNode,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Vehicle } from "@/lib/mock-data";

export default function AddWorkForm({
  vehicle,
}: {
  vehicle: Vehicle;
}) {
  const router = useRouter();

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const form =
        new FormData(event.currentTarget);

      const data = {
        ...Object.fromEntries(
          form.entries()
        ),

        vehicle: vehicle.id,
      };

      const response = await fetch(
        "/api/work-items",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(data),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to add work item"
        );
      }

      router.push(
        `/vehicles/${vehicle.id}`
      );

      router.refresh();
    } catch (err) {
      console.error(
        "Add work error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to add work item"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-5 xl:grid-cols-3">

        {/* WORK DETAILS */}

        <div className="xl:col-span-2">
          <FormCard title="Work Details">
            <Field
              label="Work Title"
              required
            >
              <input
                name="title"
                required
                placeholder="Replace rear cylinder and piston"
                className={inputClass}
              />
            </Field>

            <Field label="Category">
              <input
                name="category"
                list="work-categories"
                placeholder="Engine"
                className={inputClass}
              />

              <datalist id="work-categories">
                <option value="Engine" />
                <option value="Electrical" />
                <option value="Brakes" />
                <option value="Suspension" />
                <option value="Drivetrain" />
                <option value="Controls" />
                <option value="Wheels & Tyres" />
                <option value="Body" />
                <option value="Service" />
                <option value="Fabrication" />
                <option value="Accessories" />
                <option value="Other" />
              </datalist>
            </Field>

            <Field label="Work Description">
              <textarea
                name="work_description"
                rows={8}
                placeholder="Describe the problem, diagnosis and work required..."
                className={`${inputClass} resize-y`}
              />
            </Field>
          </FormCard>
        </div>

        {/* STATUS */}

        <FormCard title="Status & Priority">
          <Field label="Status">
            <select
              name="status"
              defaultValue="Planned"
              className={inputClass}
            >
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
          </Field>

          <Field label="Priority">
            <select
              name="priority"
              defaultValue="3"
              className={inputClass}
            >
              <option value="1">
                1 — Urgent
              </option>

              <option value="2">
                2 — High
              </option>

              <option value="3">
                3 — Normal
              </option>

              <option value="4">
                4 — Low
              </option>
            </select>
          </Field>

          <Field label="Odometer">
            <div className="flex items-center gap-2">
              <input
                name="odometer"
                type="number"
                min="0"
                defaultValue={
                  vehicle.odometer || ""
                }
                className={inputClass}
              />

              <span className="shrink-0 text-sm text-gray-500">
                {vehicle.odometerUnit ||
                  "km"}
              </span>
            </div>
          </Field>
        </FormCard>

        {/* DATES */}

        <FormCard title="Schedule">
          <Field label="Target Date">
            <input
              name="target_date"
              type="date"
              className={inputClass}
            />
          </Field>

          <Field label="Started Date">
            <input
              name="started_date"
              type="date"
              className={inputClass}
            />
          </Field>

          <Field label="Completed Date">
            <input
              name="completed_date"
              type="date"
              className={inputClass}
            />
          </Field>
        </FormCard>

        {/* COST */}

        <FormCard title="Cost">
          <Field label="Estimated Cost">
            <input
              name="estimated_cost"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              className={inputClass}
            />
          </Field>

          <p className="text-xs text-gray-400">
            This is only the estimated work cost.
            Parts and actual expenses can be tracked
            separately later.
          </p>
        </FormCard>

        {/* NOTES */}

        <FormCard title="Notes">
          <textarea
            name="notes"
            rows={6}
            placeholder="Additional workshop notes..."
            className={`${inputClass} resize-y`}
          />
        </FormCard>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ACTIONS */}

      <div className="mt-6 flex justify-end gap-3">
        <Link
          href={`/vehicles/${vehicle.id}`}
          className="rounded-lg border border-[#d8dce1] bg-white px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#1d2228] px-5 py-2.5 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Add Work"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-[#d8dce1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

function FormCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#e0e3e7] bg-white p-5">
      <h2 className="mb-5 font-semibold">
        {title}
      </h2>

      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}