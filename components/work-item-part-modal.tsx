"use client";

import { useEffect, useState } from "react";
import { GaragePart, WorkItemPart } from "@/lib/mock-data";
import PartPickerModal from "@/components/part-picker-modal";

const statuses = [
  "Needed",
  "To Order",
  "Ordered",
  "Received",
  "Available",
  "Used",
  "Returned",
  "Cancelled",
];

type FormState = {
  quantityNeeded: string;
  quantityUsed: string;
  status: string;
  unitCost: string;
  unitPrice: string;
  billable: boolean;
  notes: string;
};

function formFromItem(item?: WorkItemPart | null): FormState {
  return {
    quantityNeeded:
      item?.quantityNeeded !== undefined ? String(item.quantityNeeded) : "1",
    quantityUsed:
      item?.quantityUsed !== undefined ? String(item.quantityUsed) : "0",
    status: item?.status || "Needed",
    unitCost: item?.unitCost !== undefined ? String(item.unitCost) : "",
    unitPrice: item?.unitPrice !== undefined ? String(item.unitPrice) : "",
    billable: item?.billable !== false,
    notes: item?.notes || "",
  };
}

export default function WorkItemPartModal({
  workItemId,
  item,
  onClose,
  onSaved,
  onRemoved,
}: {
  workItemId: string;
  item?: WorkItemPart | null;
  onClose: () => void;
  onSaved: (item: WorkItemPart) => void;
  onRemoved?: (id: string) => void;
}) {
  const editing = Boolean(item?.id);
  const [part, setPart] = useState<GaragePart | null>(item?.part ?? null);
  const [showPicker, setShowPicker] = useState(!editing && !item?.part);
  const [form, setForm] = useState<FormState>(() => formFromItem(item));
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !showPicker) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, showPicker]);

  function choosePart(nextPart: GaragePart) {
    setPart(nextPart);
    setForm((current) => ({
      ...current,
      unitCost:
        current.unitCost ||
        (nextPart.costPrice !== undefined ? String(nextPart.costPrice) : ""),
      unitPrice:
        current.unitPrice ||
        (nextPart.sellingPrice !== undefined
          ? String(nextPart.sellingPrice)
          : ""),
    }));
    setShowPicker(false);
    setError("");
  }

  async function save() {
    if (!part?.id && !item?.partId) {
      setError("Select a part first.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/work-items/${encodeURIComponent(workItemId)}/parts`,
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item?.id,
            part: part?.id ?? item?.partId,
            quantity_needed: form.quantityNeeded,
            quantity_used: form.quantityUsed,
            status: form.status,
            unit_cost: form.unitCost,
            unit_price: form.unitPrice,
            billable: form.billable,
            notes: form.notes,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Unable to save work item part");
      }

      onSaved(result as WorkItemPart);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save part");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!item?.id) return;
    const label = item.part?.name || part?.name || "this part";
    if (!window.confirm(`Remove ${label} from this work item?`)) return;

    setRemoving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/work-items/${encodeURIComponent(workItemId)}/parts`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id }),
        }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Unable to remove part");
      }
      onRemoved?.(item.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove part");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[85] flex items-center justify-center bg-black/35 p-2 sm:p-4"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#e1e4e8] px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-lg font-semibold">
                {editing ? "Edit Part for Work Item" : "Add Part to Work Item"}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Quantity, status, pricing and billing for this job.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8dce1] bg-white text-lg text-gray-500 hover:bg-gray-50"
            >
              ×
            </button>
          </div>

          <div className="overflow-y-auto p-4 sm:p-5">
            <Field label="Part" required>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex min-h-10 flex-1 items-center rounded-lg border border-[#d8dce1] bg-[#fafafa] px-3 text-sm">
                  {part || item?.part ? (
                    <div>
                      <span className="font-medium">
                        {(part ?? item?.part)?.name || "Unknown part"}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {[(part ?? item?.part)?.partNumber, (part ?? item?.part)?.brand]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">No part selected</span>
                  )}
                </div>

                {!editing && (
                  <button
                    type="button"
                    onClick={() => setShowPicker(true)}
                    className="h-10 shrink-0 rounded-lg border border-[#d8dce1] bg-white px-4 text-sm font-medium hover:bg-gray-50"
                  >
                    Search / Select Part
                  </button>
                )}
              </div>
            </Field>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Quantity Needed">
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.quantityNeeded}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      quantityNeeded: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Quantity Used">
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.quantityUsed}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      quantityUsed: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Unit Cost">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unitCost}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      unitCost: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Unit Price">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      unitPrice: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Billable">
                <label className="flex h-10 items-center gap-2 rounded-lg border border-[#d8dce1] bg-white px-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.billable}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        billable: event.target.checked,
                      }))
                    }
                  />
                  Billable item
                </label>
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Notes">
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  className={`${inputClass} min-h-[80px] py-2`}
                />
              </Field>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e1e4e8] px-4 py-3 sm:px-5">
            <div>
              {editing && (
                <button
                  type="button"
                  onClick={() => void remove()}
                  disabled={removing || saving}
                  className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {removing ? "Removing..." : "Remove"}
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving || removing}
                className="rounded-lg border border-[#d8dce1] bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || removing || (!part && !item?.partId)}
                className="rounded-lg bg-[#1d2228] px-5 py-2 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "Saving..." : editing ? "Save Changes" : "Add Part"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPicker && (
        <PartPickerModal
          onClose={() => {
            if (part) setShowPicker(false);
            else if (editing) setShowPicker(false);
            else onClose();
          }}
          onSelect={choosePart}
        />
      )}
    </>
  );
}

const inputClass =
  "h-10 w-full min-w-0 rounded-lg border border-[#d8dce1] bg-white px-3 text-sm text-[#1d2228] outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";

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
