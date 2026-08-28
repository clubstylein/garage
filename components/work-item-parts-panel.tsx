"use client";

import { useEffect, useMemo, useState } from "react";
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

type EditablePart = WorkItemPart & {
  quantityNeededText: string;
  quantityUsedText: string;
  unitCostText: string;
  unitPriceText: string;
  notesText: string;
};

function toEditable(item: WorkItemPart): EditablePart {
  return {
    ...item,
    quantityNeededText:
      item.quantityNeeded !== undefined ? String(item.quantityNeeded) : "",
    quantityUsedText:
      item.quantityUsed !== undefined ? String(item.quantityUsed) : "",
    unitCostText: item.unitCost !== undefined ? String(item.unitCost) : "",
    unitPriceText: item.unitPrice !== undefined ? String(item.unitPrice) : "",
    notesText: item.notes ?? "",
  };
}

export default function WorkItemPartsPanel({
  workItemId,
  onChanged,
}: {
  workItemId: string;
  onChanged?: () => void;
}) {
  const [items, setItems] = useState<EditablePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    void loadParts();
  }, [workItemId]);

  async function loadParts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/work-items/${encodeURIComponent(workItemId)}/parts`,
        { cache: "no-store" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Unable to load work item parts");
      }

      setItems((Array.isArray(result) ? result : []).map(toEditable));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load work item parts"
      );
    } finally {
      setLoading(false);
    }
  }

  async function attachPart(part: GaragePart) {
    setShowPicker(false);
    setError("");

    if (items.some((item) => String(item.partId) === String(part.id))) {
      setError("This part is already linked to the work item.");
      return;
    }

    try {
      const response = await fetch(
        `/api/work-items/${encodeURIComponent(workItemId)}/parts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            part: part.id,
            quantity_needed: 1,
            quantity_used: 0,
            status: "Needed",
            unit_cost: part.costPrice ?? null,
            unit_price: part.sellingPrice ?? null,
            billable: true,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Unable to attach part");
      }

      setItems((current) => [...current, toEditable(result as WorkItemPart)]);
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to attach part");
    }
  }

  function updateItem(id: string, patch: Partial<EditablePart>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  async function saveItem(item: EditablePart) {
    setSavingId(item.id);
    setError("");

    try {
      const response = await fetch(
        `/api/work-items/${encodeURIComponent(workItemId)}/parts`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.id,
            quantity_needed: item.quantityNeededText,
            quantity_used: item.quantityUsedText,
            status: item.status || "Needed",
            unit_cost: item.unitCostText,
            unit_price: item.unitPriceText,
            billable: item.billable !== false,
            notes: item.notesText,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Unable to save work item part");
      }

      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id ? toEditable(result as WorkItemPart) : currentItem
        )
      );
      onChanged?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save work item part"
      );
    } finally {
      setSavingId(null);
    }
  }

  async function removeItem(item: EditablePart) {
    const label = item.part?.name || "this part";

    if (!window.confirm(`Remove ${label} from this work item?`)) return;

    setRemovingId(item.id);
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

      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove part");
    } finally {
      setRemovingId(null);
    }
  }

  const totals = useMemo(() => {
    let estimated = 0;
    let used = 0;

    for (const item of items) {
      if (item.billable === false) continue;

      const price = Number(item.unitPriceText || 0);
      const neededQty = Number(item.quantityNeededText || 0);
      const usedQty = Number(item.quantityUsedText || 0);

      if (Number.isFinite(price) && Number.isFinite(neededQty)) {
        estimated += price * neededQty;
      }

      if (Number.isFinite(price) && Number.isFinite(usedQty)) {
        used += price * usedQty;
      }
    }

    return { estimated, used };
  }, [items]);

  return (
    <section className="mt-4 rounded-xl border border-[#dfe2e6] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e1e4e8] px-3 py-2.5 sm:px-4">
        <div>
          <div className="text-sm font-semibold">Parts</div>
          <div className="mt-0.5 text-[11px] text-gray-400">
            Parts needed or used for this work item
          </div>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <div className="hidden text-right text-[11px] text-gray-400 sm:block">
              Needed value: {formatNumber(totals.estimated)} · Used value: {formatNumber(totals.used)}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="h-9 rounded-lg bg-[#1d2228] px-3 text-xs font-medium text-white hover:bg-black"
          >
            + Add Part
          </button>
        </div>
      </div>

      {loading ? (
        <div className="px-4 py-8 text-center text-sm text-gray-500">
          Loading parts...
        </div>
      ) : items.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-gray-500">
          No parts linked to this work item.
        </div>
      ) : (
        <div>
          <div className="hidden grid-cols-[1.8fr_.7fr_.7fr_1fr_.9fr_.9fr_.6fr_auto] gap-2 border-b border-[#e7e8ea] bg-[#fafafa] px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-gray-400 xl:grid">
            <div>Part</div>
            <div>Needed</div>
            <div>Used</div>
            <div>Status</div>
            <div>Unit Cost</div>
            <div>Unit Price</div>
            <div>Bill</div>
            <div></div>
          </div>

          <div className="divide-y divide-[#e7e8ea]">
            {items.map((item) => (
              <div key={item.id} className="p-3">
                <div className="grid gap-2 xl:grid-cols-[1.8fr_.7fr_.7fr_1fr_.9fr_.9fr_.6fr_auto] xl:items-end">
                  <div>
                    <div className="text-sm font-medium">
                      {item.part?.name || "Unknown part"}
                    </div>
                    <div className="mt-0.5 text-[11px] text-gray-400">
                      {[item.part?.partNumber, item.part?.brand]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </div>
                  </div>

                  <MiniField label="Needed">
                    <input
                      type="number"
                      step="0.001"
                      value={item.quantityNeededText}
                      onChange={(event) =>
                        updateItem(item.id, {
                          quantityNeededText: event.target.value,
                        })
                      }
                      className={smallInputClass}
                    />
                  </MiniField>

                  <MiniField label="Used">
                    <input
                      type="number"
                      step="0.001"
                      value={item.quantityUsedText}
                      onChange={(event) =>
                        updateItem(item.id, {
                          quantityUsedText: event.target.value,
                        })
                      }
                      className={smallInputClass}
                    />
                  </MiniField>

                  <MiniField label="Status">
                    <select
                      value={item.status || "Needed"}
                      onChange={(event) =>
                        updateItem(item.id, { status: event.target.value })
                      }
                      className={smallInputClass}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </MiniField>

                  <MiniField label="Unit Cost">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitCostText}
                      onChange={(event) =>
                        updateItem(item.id, {
                          unitCostText: event.target.value,
                        })
                      }
                      className={smallInputClass}
                    />
                  </MiniField>

                  <MiniField label="Unit Price">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPriceText}
                      onChange={(event) =>
                        updateItem(item.id, {
                          unitPriceText: event.target.value,
                        })
                      }
                      className={smallInputClass}
                    />
                  </MiniField>

                  <MiniField label="Billable">
                    <label className="flex h-[36px] items-center gap-2 rounded-lg border border-[#d8dce1] bg-white px-2 text-xs">
                      <input
                        type="checkbox"
                        checked={item.billable !== false}
                        onChange={(event) =>
                          updateItem(item.id, {
                            billable: event.target.checked,
                          })
                        }
                      />
                      Yes
                    </label>
                  </MiniField>

                  <div className="flex gap-2 xl:justify-end">
                    <button
                      type="button"
                      onClick={() => void saveItem(item)}
                      disabled={savingId === item.id}
                      className="h-9 rounded-lg border border-[#1d2228] bg-white px-3 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      {savingId === item.id ? "Saving..." : "Save"}
                    </button>

                    <button
                      type="button"
                      onClick={() => void removeItem(item)}
                      disabled={removingId === item.id}
                      className="h-9 rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-2">
                  <input
                    value={item.notesText}
                    onChange={(event) =>
                      updateItem(item.id, { notesText: event.target.value })
                    }
                    placeholder="Part notes..."
                    className="h-9 w-full rounded-lg border border-[#e1e4e8] bg-white px-2.5 text-xs outline-none focus:border-[#7c828a]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="border-t border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700 sm:px-4">
          {error}
        </div>
      )}

      {showPicker && (
        <PartPickerModal
          onClose={() => setShowPicker(false)}
          onSelect={(part) => void attachPart(part)}
        />
      )}
    </section>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

const smallInputClass =
  "h-[36px] w-full min-w-0 rounded-lg border border-[#d8dce1] bg-white px-2 text-xs outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";

function MiniField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-400 xl:hidden">
        {label}
      </span>
      {children}
    </label>
  );
}
