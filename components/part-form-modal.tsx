"use client";

import { useEffect, useState } from "react";
import { GaragePart } from "@/lib/mock-data";

type FormState = {
  name: string;
  partNumber: string;
  brand: string;
  description: string;
  costPrice: string;
  sellingPrice: string;
  currency: string;
  supplier: string;
  supplierPartNumber: string;
  stockQuantity: string;
  reorderLevel: string;
  notes: string;
  active: boolean;
};

function formFromPart(part?: GaragePart | null): FormState {
  return {
    name: part?.name || "",
    partNumber: part?.partNumber || "",
    brand: part?.brand || "",
    description: part?.description || "",
    costPrice: part?.costPrice !== undefined ? String(part.costPrice) : "",
    sellingPrice:
      part?.sellingPrice !== undefined ? String(part.sellingPrice) : "",
    currency: part?.currency || "INR",
    supplier: part?.supplier || "",
    supplierPartNumber: part?.supplierPartNumber || "",
    stockQuantity:
      part?.stockQuantity !== undefined ? String(part.stockQuantity) : "0",
    reorderLevel:
      part?.reorderLevel !== undefined ? String(part.reorderLevel) : "",
    notes: part?.notes || "",
    active: part?.active !== false,
  };
}

export default function PartFormModal({
  part,
  onClose,
  onSaved,
}: {
  part?: GaragePart | null;
  onClose: () => void;
  onSaved: (part: GaragePart) => void;
}) {
  const editing = Boolean(part?.id);
  const [form, setForm] = useState<FormState>(() => formFromPart(part));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (!form.name.trim()) {
      setError("Part name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/parts", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: part?.id,
          name: form.name,
          part_number: form.partNumber,
          brand: form.brand,
          description: form.description,
          cost_price: form.costPrice,
          selling_price: form.sellingPrice,
          currency: form.currency,
          supplier: form.supplier,
          supplier_part_number: form.supplierPartNumber,
          stock_quantity: form.stockQuantity,
          reorder_level: form.reorderLevel,
          notes: form.notes,
          active: form.active,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Unable to save part");
      }

      onSaved(result as GaragePart);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save part");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-3"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e1e4e8] px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-lg font-semibold">
              {editing ? "Edit Part" : "Add Part"}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Parts master record
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8dce1] text-lg text-gray-500 hover:bg-gray-50"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Part Name" required>
              <input
                autoFocus
                value={form.name}
                onChange={(event) => patch("name", event.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Part Number">
              <input
                value={form.partNumber}
                onChange={(event) => patch("partNumber", event.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Brand">
              <input
                value={form.brand}
                onChange={(event) => patch("brand", event.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Supplier">
              <input
                value={form.supplier}
                onChange={(event) => patch("supplier", event.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Supplier Part Number">
              <input
                value={form.supplierPartNumber}
                onChange={(event) =>
                  patch("supplierPartNumber", event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Currency">
              <input
                value={form.currency}
                onChange={(event) =>
                  patch("currency", event.target.value.toUpperCase())
                }
                className={inputClass}
              />
            </Field>

            <Field label="Cost Price">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.costPrice}
                onChange={(event) => patch("costPrice", event.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Selling Price">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.sellingPrice}
                onChange={(event) => patch("sellingPrice", event.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Stock Quantity">
              <input
                type="number"
                step="0.001"
                value={form.stockQuantity}
                onChange={(event) => patch("stockQuantity", event.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Reorder Level">
              <input
                type="number"
                step="0.001"
                value={form.reorderLevel}
                onChange={(event) => patch("reorderLevel", event.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Active">
                <label className="flex h-10 items-center gap-2 rounded-lg border border-[#d8dce1] px-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => patch("active", event.target.checked)}
                  />
                  Active part
                </label>
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Description">
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(event) => patch("description", event.target.value)}
                  className={textareaClass}
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Notes">
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(event) => patch("notes", event.target.value)}
                  className={textareaClass}
                />
              </Field>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#e1e4e8] px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-[#d8dce1] bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="rounded-lg bg-[#1d2228] px-5 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-40"
          >
            {saving ? "Saving..." : editing ? "Save Changes" : "Add Part"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border border-[#d8dce1] bg-white px-3 text-sm outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";

const textareaClass =
  "w-full rounded-lg border border-[#d8dce1] bg-white px-3 py-2 text-sm outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";

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
