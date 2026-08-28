"use client";

import { FormEvent, useState } from "react";
import { VehicleCustomer } from "@/lib/mock-data";

export default function AddCustomerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (customer: VehicleCustomer) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const form = new FormData(event.currentTarget);
      const payload = {
        name: form.get("name"),
        category: form.get("category"),
        phone: form.get("phone"),
        email: form.get("email"),
        address: form.get("address"),
        city: form.get("city"),
        state: form.get("state"),
        pincode: form.get("pincode"),
        country: form.get("country"),
        notes: form.get("notes"),
      };

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Unable to create customer");
      }

      onCreated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create customer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-stretch justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex h-full w-full flex-col overflow-hidden bg-white sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-2xl sm:shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-[#e1e4e8] px-4 py-3 sm:px-5 sm:py-4">
          <div>
            <h2 className="text-lg font-semibold">Add Customer</h2>
            <p className="mt-0.5 text-xs text-gray-500">Create a new garage customer</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#d8dce1] text-xl text-gray-500 hover:bg-gray-50 sm:h-9 sm:w-9"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <Field label="Customer Name" required>
              <input
                name="name"
                required
                autoFocus
                placeholder="Customer name"
                className={inputClass}
              />
            </Field>

            <Field label="Category" required>
              <select name="category" defaultValue="general" className={inputClass}>
                <option value="general">General</option>
                <option value="vip">VIP</option>
                <option value="self-owned">Self-owned</option>
              </select>
            </Field>

            <Field label="Phone">
              <input name="phone" type="tel" placeholder="Phone" className={inputClass} />
            </Field>

            <Field label="Email">
              <input name="email" type="email" placeholder="Email" className={inputClass} />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Address">
                <input name="address" placeholder="Address" className={inputClass} />
              </Field>
            </div>

            <Field label="City">
              <input name="city" className={inputClass} />
            </Field>

            <Field label="State">
              <input name="state" className={inputClass} />
            </Field>

            <Field label="Pincode">
              <input name="pincode" inputMode="numeric" className={inputClass} />
            </Field>

            <Field label="Country">
              <input name="country" defaultValue="India" className={inputClass} />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Notes">
                <textarea name="notes" rows={3} className={textareaClass} />
              </Field>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="sticky bottom-0 -mx-4 mt-5 flex gap-2 border-t border-[#e1e4e8] bg-white px-4 py-3 sm:static sm:mx-0 sm:justify-end sm:border-0 sm:p-0 sm:pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 flex-1 rounded-lg border border-[#d8dce1] bg-white px-4 text-sm font-medium hover:bg-gray-50 sm:flex-none"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-11 flex-1 rounded-lg bg-[#1d2228] px-4 text-sm font-medium text-white hover:bg-black disabled:opacity-50 sm:flex-none"
            >
              {saving ? "Saving..." : "Add Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-[#d8dce1] bg-white px-3 text-sm text-[#1d2228] outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a] sm:h-[40px]";

const textareaClass =
  "min-h-[86px] w-full resize-y rounded-lg border border-[#d8dce1] bg-white px-3 py-2 text-sm text-[#1d2228] outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
