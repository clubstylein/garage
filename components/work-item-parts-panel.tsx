"use client";

import { useEffect, useRef, useState } from "react";
import { WorkItemPart } from "@/lib/mock-data";
import WorkItemPartModal from "@/components/work-item-part-modal";

export default function WorkItemPartsPanel({
  workItemId,
  onChanged,
  openAddOnMount = false,
}: {
  workItemId: string;
  onChanged?: () => void;
  openAddOnMount?: boolean;
}) {
  const [items, setItems] = useState<WorkItemPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingItem, setEditingItem] = useState<WorkItemPart | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const openedInitial = useRef(false);

  useEffect(() => {
    void loadParts();
  }, [workItemId]);

  useEffect(() => {
    if (openAddOnMount && !openedInitial.current) {
      openedInitial.current = true;
      setEditingItem(null);
      setShowEditor(true);
    }
  }, [openAddOnMount]);

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
      setItems(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load work item parts"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSaved(saved: WorkItemPart) {
    setItems((current) => {
      const exists = current.some((item) => item.id === saved.id);
      if (exists) {
        return current.map((item) => (item.id === saved.id ? saved : item));
      }
      return [...current, saved];
    });
    setShowEditor(false);
    setEditingItem(null);
    onChanged?.();
  }

  function handleRemoved(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    setShowEditor(false);
    setEditingItem(null);
    onChanged?.();
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#dfe2e6] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e1e4e8] px-3 py-2.5 sm:px-4">
        <div>
          <div className="text-sm font-semibold">Parts for this work item</div>
          <div className="mt-0.5 text-[11px] text-gray-400">
            Parts needed, ordered or used for this job
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingItem(null);
            setShowEditor(true);
          }}
          className="h-9 rounded-lg bg-[#1d2228] px-3 text-xs font-medium text-white hover:bg-black"
        >
          + Add Part
        </button>
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
        <>
          <div className="hidden grid-cols-[2fr_.65fr_.65fr_1fr_.9fr_.65fr_auto] gap-3 border-b border-[#e7e8ea] bg-[#fafafa] px-4 py-2 text-[10px] font-medium uppercase tracking-wide text-gray-400 lg:grid">
            <div>Part</div>
            <div>Needed</div>
            <div>Used</div>
            <div>Status</div>
            <div>Unit Price</div>
            <div>Billable</div>
            <div className="text-right">Actions</div>
          </div>

          <div className="divide-y divide-[#e7e8ea]">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid gap-2 px-4 py-3 lg:grid-cols-[2fr_.65fr_.65fr_1fr_.9fr_.65fr_auto] lg:items-center lg:gap-3"
              >
                <div>
                  <div className="text-sm font-medium">
                    {item.part?.name || "Unknown part"}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-400">
                    {[item.part?.partNumber, item.part?.brand]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </div>
                </div>

                <GridValue label="Needed">
                  {formatQuantity(item.quantityNeeded)}
                </GridValue>

                <GridValue label="Used">
                  {formatQuantity(item.quantityUsed)}
                </GridValue>

                <GridValue label="Status">
                  <StatusPill value={item.status || "Needed"} />
                </GridValue>

                <GridValue label="Unit Price">
                  {item.unitPrice !== undefined && item.unitPrice !== null
                    ? item.unitPrice.toLocaleString()
                    : "—"}
                </GridValue>

                <GridValue label="Billable">
                  {item.billable === false ? "No" : "Yes"}
                </GridValue>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(item);
                      setShowEditor(true);
                    }}
                    className="rounded-lg border border-[#d8dce1] bg-white px-3 py-2 text-xs font-medium hover:bg-gray-50"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {error && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {showEditor && (
        <WorkItemPartModal
          workItemId={workItemId}
          item={editingItem}
          onClose={() => {
            setShowEditor(false);
            setEditingItem(null);
          }}
          onSaved={handleSaved}
          onRemoved={handleRemoved}
        />
      )}
    </section>
  );
}

function GridValue({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm lg:block">
      <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400 lg:hidden">
        {label}
      </span>
      <span>{children}</span>
    </div>
  );
}

function formatQuantity(value?: number) {
  if (value === undefined || value === null) return "—";
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 3,
  });
}

function StatusPill({ value }: { value: string }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600">
      {value}
    </span>
  );
}
