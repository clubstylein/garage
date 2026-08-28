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
  const [startWithNewPart, setStartWithNewPart] = useState(false);
  const openedInitial = useRef(false);

  useEffect(() => {
    void loadParts();
  }, [workItemId]);

  useEffect(() => {
    if (openAddOnMount && !openedInitial.current) {
      openedInitial.current = true;
      openAddExisting();
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

  function openAddExisting() {
    setEditingItem(null);
    setStartWithNewPart(false);
    setShowEditor(true);
  }

  function openNewPart() {
    setEditingItem(null);
    setStartWithNewPart(true);
    setShowEditor(true);
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
    setStartWithNewPart(false);
    onChanged?.();
  }

  function handleRemoved(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    setShowEditor(false);
    setEditingItem(null);
    setStartWithNewPart(false);
    onChanged?.();
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#dfe2e6] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e1e4e8] px-3 py-2.5 sm:px-4">
        <div>
          <div className="text-sm font-semibold">Parts for this work item</div>
          <div className="mt-0.5 text-[11px] text-gray-400">
            Parts needed, ordered or used for this job
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openAddExisting}
            className="h-9 rounded-lg border border-[#d8dce1] bg-white px-3 text-xs font-medium hover:bg-gray-50"
          >
            + Add Existing
          </button>

          <button
            type="button"
            onClick={openNewPart}
            className="h-9 rounded-lg bg-[#1d2228] px-3 text-xs font-medium text-white hover:bg-black"
          >
            + New Part
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
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="border-b border-[#e7e8ea] bg-[#fafafa]">
                <tr>
                  <Th>Part</Th>
                  <Th>Needed</Th>
                  <Th>Used</Th>
                  <Th>Status</Th>
                  <Th>Unit Price</Th>
                  <Th>Billable</Th>
                  <Th align="right">Action</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#e7e8ea]">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#fafafa]">
                    <td className="px-3 py-2.5">
                      <div className="text-sm font-medium">
                        {item.part?.name || "Unknown part"}
                      </div>
                      <div className="mt-0.5 text-[11px] text-gray-400">
                        {[item.part?.partNumber, item.part?.brand]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </div>
                    </td>

                    <Td>{formatQuantity(item.quantityNeeded)}</Td>
                    <Td>{formatQuantity(item.quantityUsed)}</Td>
                    <Td>
                      <StatusPill value={item.status || "Needed"} />
                    </Td>
                    <Td>
                      {item.unitPrice !== undefined && item.unitPrice !== null
                        ? item.unitPrice.toLocaleString()
                        : "—"}
                    </Td>
                    <Td>{item.billable === false ? "No" : "Yes"}</Td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(item);
                          setStartWithNewPart(false);
                          setShowEditor(true);
                        }}
                        className="rounded-lg border border-[#d8dce1] bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-[#e7e8ea] md:hidden">
            {items.map((item) => (
              <div key={item.id} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {item.part?.name || "Unknown part"}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-gray-400">
                      {[item.part?.partNumber, item.part?.brand]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(item);
                      setStartWithNewPart(false);
                      setShowEditor(true);
                    }}
                    className="shrink-0 rounded-lg border border-[#d8dce1] bg-white px-3 py-1.5 text-xs font-medium"
                  >
                    Edit
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <MobileValue label="Needed" value={formatQuantity(item.quantityNeeded)} />
                  <MobileValue label="Used" value={formatQuantity(item.quantityUsed)} />
                  <MobileValue label="Status" value={item.status || "Needed"} />
                  <MobileValue
                    label="Unit Price"
                    value={
                      item.unitPrice !== undefined && item.unitPrice !== null
                        ? item.unitPrice.toLocaleString()
                        : "—"
                    }
                  />
                  <MobileValue
                    label="Billable"
                    value={item.billable === false ? "No" : "Yes"}
                  />
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
          startWithNewPart={startWithNewPart}
          onClose={() => {
            setShowEditor(false);
            setEditingItem(null);
            setStartWithNewPart(false);
          }}
          onSaved={handleSaved}
          onRemoved={handleRemoved}
        />
      )}
    </section>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-gray-400 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2.5 text-sm text-gray-700">{children}</td>;
}

function MobileValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </div>
      <div className="mt-0.5 text-sm text-gray-700">{value}</div>
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
