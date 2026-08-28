"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  VehicleCustomer,
} from "@/lib/mock-data";

export type AddCustomerPrefill = {
  name?: string;
  category?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  notes?: string;
};

export default function AddCustomerModal({
  initialData,
  onClose,
  onCreated,
}: {
  initialData?: AddCustomerPrefill;

  onClose:
    () => void;

  onCreated:
    (
      customer:
        VehicleCustomer
    ) => void;
}) {
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

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(
      true
    );

    setError("");

    try {
      const form =
        new FormData(
          event.currentTarget
        );

      const payload = {
        name:
          form.get(
            "name"
          ),

        category:
          form.get(
            "category"
          ),

        phone:
          form.get(
            "phone"
          ),

        email:
          form.get(
            "email"
          ),

        address:
          form.get(
            "address"
          ),

        city:
          form.get(
            "city"
          ),

        state:
          form.get(
            "state"
          ),

        pincode:
          form.get(
            "pincode"
          ),

        country:
          form.get(
            "country"
          ),

        notes:
          form.get(
            "notes"
          ),
      };

      const response =
        await fetch(
          "/api/customers",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result?.error ||
            "Unable to create customer"
        );
      }

      onCreated(
        result
      );
    } catch (
      err
    ) {
      setError(
        err instanceof
          Error
          ? err.message
          : "Unable to create customer"
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-[#e1e4e8] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              Add Customer
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              Create a new garage customer
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8dce1] text-lg text-gray-500 hover:bg-gray-50"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="p-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Customer Name"
              required
            >
              <input
                name="name"
                defaultValue={initialData?.name || ""}
                required
                autoFocus
                placeholder="Customer name"
                className={
                  inputClass
                }
              />
            </Field>

            <Field
              label="Category"
              required
            >
              <select
                name="category"
                defaultValue={initialData?.category || "general"}
                className={
                  inputClass
                }
              >
                <option value="general">
                  General
                </option>

                <option value="vip">
                  VIP
                </option>

                <option value="self-owned">
                  Self-owned
                </option>
              </select>
            </Field>

            <Field label="Phone">
              <input
                name="phone"
                defaultValue={initialData?.phone || ""}
                type="tel"
                placeholder="Phone"
                className={
                  inputClass
                }
              />
            </Field>

            <Field label="Email">
              <input
                name="email"
                defaultValue={initialData?.email || ""}
                type="email"
                placeholder="Email"
                className={
                  inputClass
                }
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Address">
                <input
                  name="address"
                  defaultValue={initialData?.address || ""}
                  placeholder="Address"
                  className={
                    inputClass
                  }
                />
              </Field>
            </div>

            <Field label="City">
              <input
                name="city"
                defaultValue={initialData?.city || ""}
                className={
                  inputClass
                }
              />
            </Field>

            <Field label="State">
              <input
                name="state"
                defaultValue={initialData?.state || ""}
                className={
                  inputClass
                }
              />
            </Field>

            <Field label="Pincode">
              <input
                name="pincode"
                defaultValue={initialData?.pincode || ""}
                inputMode="numeric"
                className={
                  inputClass
                }
              />
            </Field>

            <Field label="Country">
              <input
                name="country"
                defaultValue={initialData?.country || "India"}
                className={
                  inputClass
                }
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Notes">
                <textarea
                  name="notes"
                  defaultValue={initialData?.notes || ""}
                  rows={3}
                  className={`${inputClass} min-h-[80px] resize-y`}
                />
              </Field>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                saving
              }
              className="rounded-lg border border-[#d8dce1] bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving
              }
              className="rounded-lg bg-[#1d2228] px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Add Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "h-[38px] w-full rounded-lg border border-[#d8dce1] bg-white px-3 text-sm outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";

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