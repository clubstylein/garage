"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  VehicleCustomer,
} from "@/lib/mock-data";

export type AIVehiclePrefill = {
  customerId?: string;
  name?: string;
  make?: string;
  model?: string;
  variant?: string;
  year?: number;
  status?: string;
  registrationNumber?: string;
  vin?: string;
  enginePlatform?: string;
  engineCc?: number;
  odometer?: number;
  odometerUnit?: "km" | "mi";
  location?: string;
  notes?: string;
};

export default function AIVehicleModal({
  customers,
  initialData,
  onClose,
  onSaved,
}: {
  customers:
    VehicleCustomer[];

  initialData?:
    AIVehiclePrefill;

  onClose:
    () => void;

  onSaved?:
    () => void;
}) {
  const [
    form,
    setForm,
  ] =
    useState({
      customerId:
        initialData?.customerId ||
        "",
      name:
        initialData?.name ||
        "",
      make:
        initialData?.make ||
        "",
      model:
        initialData?.model ||
        "",
      variant:
        initialData?.variant ||
        "",
      year:
        initialData?.year
          ? String(
              initialData.year
            )
          : "",
      status:
        initialData?.status ||
        "Running",
      registrationNumber:
        initialData
          ?.registrationNumber ||
        "",
      vin:
        initialData?.vin ||
        "",
      enginePlatform:
        initialData
          ?.enginePlatform ||
        "",
      engineCc:
        initialData?.engineCc !==
          undefined
          ? String(
              initialData.engineCc
            )
          : "",
      odometer:
        initialData?.odometer !==
          undefined
          ? String(
              initialData.odometer
            )
          : "0",
      odometerUnit:
        initialData?.odometerUnit ||
        "km",
      location:
        initialData?.location ||
        "",
      notes:
        initialData?.notes ||
        "",
    });

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const activeCustomers =
    useMemo(
      () =>
        customers
          .slice()
          .sort(
            (a, b) =>
              a.name.localeCompare(
                b.name
              )
          ),
      [customers]
    );

  function patch(
    key: keyof typeof form,
    value: string
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,
        [key]:
          value,
      })
    );
  }

  async function save() {
    if (
      !form.customerId ||
      !form.name.trim() ||
      !form.make.trim() ||
      !form.model.trim() ||
      !form.year
    ) {
      setError(
        "Customer, vehicle name, make, model and year are required."
      );

      return;
    }

    setSaving(
      true
    );

    setError("");

    try {
      const response =
        await fetch(
          "/api/vehicles",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                customer:
                  form.customerId,

                ownership_status:
                  "Owned",

                name:
                  form.name.trim(),

                asset_type:
                  "Motorcycle",

                make:
                  form.make.trim(),

                model:
                  form.model.trim(),

                variant:
                  form.variant.trim(),

                year:
                  Number(
                    form.year
                  ),

                status:
                  form.status,

                registration_number:
                  form.registrationNumber,

                vin:
                  form.vin,

                engine_platform:
                  form.enginePlatform,

                engine_cc:
                  form.engineCc,

                odometer:
                  form.odometer,

                odometer_unit:
                  form.odometerUnit,

                location:
                  form.location,

                notes:
                  form.notes,
              }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to create vehicle"
        );
      }

      onSaved?.();

      onClose();
    } catch (err) {
      setError(
        err instanceof
          Error
          ? err.message
          : "Unable to create vehicle"
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/40 p-3"
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e1e4e8] px-5 py-3">
          <div>
            <h2 className="text-lg font-semibold">
              Add Vehicle
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              AI Assistant pre-filled vehicle
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8dce1] text-lg text-gray-500 hover:bg-gray-50"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Customer"
              required
            >
              <select
                value={
                  form.customerId
                }
                onChange={(
                  event
                ) =>
                  patch(
                    "customerId",
                    event.target
                      .value
                  )
                }
                className={
                  inputClass
                }
              >
                <option value="">
                  Select customer...
                </option>

                {activeCustomers.map(
                  (
                    customer
                  ) => (
                    <option
                      key={
                        customer.id
                      }
                      value={
                        customer.id
                      }
                    >
                      {
                        customer.name
                      }
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field
              label="Vehicle Name"
              required
            >
              <input
                value={
                  form.name
                }
                onChange={(
                  event
                ) =>
                  patch(
                    "name",
                    event.target
                      .value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field
              label="Make"
              required
            >
              <input
                value={
                  form.make
                }
                onChange={(
                  event
                ) =>
                  patch(
                    "make",
                    event.target
                      .value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field
              label="Model"
              required
            >
              <input
                value={
                  form.model
                }
                onChange={(
                  event
                ) =>
                  patch(
                    "model",
                    event.target
                      .value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field label="Variant">
              <input
                value={
                  form.variant
                }
                onChange={(
                  event
                ) =>
                  patch(
                    "variant",
                    event.target
                      .value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field
              label="Year"
              required
            >
              <input
                type="number"
                min="1900"
                max="2100"
                value={
                  form.year
                }
                onChange={(
                  event
                ) =>
                  patch(
                    "year",
                    event.target
                      .value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field label="Status">
              <select
                value={
                  form.status
                }
                onChange={(
                  event
                ) =>
                  patch(
                    "status",
                    event.target
                      .value
                  )
                }
                className={
                  inputClass
                }
              >
                <option>
                  Running
                </option>

                <option>
                  Repair
                </option>

                <option>
                  Project
                </option>
              </select>
            </Field>

            <Field label="Location">
              <input
                value={
                  form.location
                }
                onChange={(
                  event
                ) =>
                  patch(
                    "location",
                    event.target
                      .value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field label="Registration Number">
              <input
                value={
                  form.registrationNumber
                }
                onChange={(
                  event
                ) =>
                  patch(
                    "registrationNumber",
                    event.target
                      .value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field label="VIN">
              <input
                value={
                  form.vin
                }
                onChange={(
                  event
                ) =>
                  patch(
                    "vin",
                    event.target
                      .value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field label="Engine Platform">
              <input
                value={
                  form.enginePlatform
                }
                onChange={(
                  event
                ) =>
                  patch(
                    "enginePlatform",
                    event.target
                      .value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field label="Engine CC">
              <input
                type="number"
                min="0"
                value={
                  form.engineCc
                }
                onChange={(
                  event
                ) =>
                  patch(
                    "engineCc",
                    event.target
                      .value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field label="Odometer">
              <div className="grid grid-cols-[1fr_90px] gap-2">
                <input
                  type="number"
                  min="0"
                  value={
                    form.odometer
                  }
                  onChange={(
                    event
                  ) =>
                    patch(
                      "odometer",
                      event.target
                        .value
                    )
                  }
                  className={
                    inputClass
                  }
                />

                <select
                  value={
                    form.odometerUnit
                  }
                  onChange={(
                    event
                  ) =>
                    patch(
                      "odometerUnit",
                      event.target
                        .value
                    )
                  }
                  className={
                    inputClass
                  }
                >
                  <option value="km">
                    km
                  </option>

                  <option value="mi">
                    mi
                  </option>
                </select>
              </div>
            </Field>

            <div className="sm:col-span-2">
              <Field label="Notes">
                <textarea
                  rows={3}
                  value={
                    form.notes
                  }
                  onChange={(
                    event
                  ) =>
                    patch(
                      "notes",
                      event.target
                        .value
                    )
                  }
                  className={
                    textareaClass
                  }
                />
              </Field>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#e1e4e8] bg-[#fafafa] px-4 py-3">
          <button
            type="button"
            onClick={
              onClose
            }
            className={
              secondaryButton
            }
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() =>
              void save()
            }
            disabled={
              saving
            }
            className="h-10 rounded-lg bg-[#1d2228] px-5 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Add Vehicle"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label:
    string;

  required?:
    boolean;

  children:
    React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">
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

const inputClass =
  "h-10 w-full rounded-lg border border-[#d8dce1] bg-white px-3 text-sm outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";

const textareaClass =
  "w-full resize-y rounded-lg border border-[#d8dce1] bg-white px-3 py-2 text-sm outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";

const secondaryButton =
  "h-10 rounded-lg border border-[#d8dce1] bg-white px-4 text-sm font-medium hover:bg-gray-50";
