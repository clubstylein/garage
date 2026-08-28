"use client";

import { useMemo, useState } from "react";

type SourceMode = "work" | "job-part" | "part";

type WorkSource = {
  id: string;
  title: string;
  category?: string;
  status?: string;
  vehicle?: string;
  estimatedCost?: number;
};

type PartSource = {
  id: string;
  partNumber?: string;
  name: string;
  brand?: string;
  sellingPrice?: number;
  stockQuantity?: number;
};

type JobPartSource = {
  id: string;
  workItemId: string;
  workTitle?: string;
  partId: string;
  partNumber?: string;
  name: string;
  brand?: string;
  quantity?: number;
  unitPrice?: number;
  billable?: boolean;
  status?: string;
};

export type BillingLineDraft = {
  key: string;
  lineType: "Work" | "Part" | "Manual";
  workItemId?: string;
  partId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  billable: boolean;
  notes: string;
};

export default function BillingSourceModal({
  mode,
  workItems,
  parts,
  jobParts,
  onAdd,
  onClose,
}: {
  mode: SourceMode;
  workItems: WorkSource[];
  parts: PartSource[];
  jobParts: JobPartSource[];
  onAdd: (line: BillingLineDraft) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();

  const rows = useMemo(() => {
    if (mode === "work") {
      return workItems.filter((item) =>
        [item.title, item.category, item.status, item.vehicle].filter(Boolean).join(" ").toLowerCase().includes(query)
      );
    }
    if (mode === "job-part") {
      return jobParts.filter((item) =>
        [item.partNumber, item.name, item.brand, item.workTitle, item.status].filter(Boolean).join(" ").toLowerCase().includes(query)
      );
    }
    return parts.filter((item) =>
      [item.partNumber, item.name, item.brand].filter(Boolean).join(" ").toLowerCase().includes(query)
    );
  }, [mode, workItems, parts, jobParts, query]);

  function choose(item: any) {
    const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (mode === "work") {
      onAdd({
        key,
        lineType: "Work",
        workItemId: item.id,
        description: item.title,
        quantity: 1,
        unitPrice: Number(item.estimatedCost ?? 0),
        discount: 0,
        tax: 0,
        billable: true,
        notes: item.vehicle ? `Vehicle: ${item.vehicle}` : "",
      });
      return;
    }
    if (mode === "job-part") {
      onAdd({
        key,
        lineType: "Part",
        workItemId: item.workItemId,
        partId: item.partId,
        description: item.name,
        quantity: Number(item.quantity ?? 1) || 1,
        unitPrice: Number(item.unitPrice ?? 0),
        discount: 0,
        tax: 0,
        billable: item.billable !== false,
        notes: item.workTitle ? `Work: ${item.workTitle}` : "",
      });
      return;
    }
    onAdd({
      key,
      lineType: "Part",
      partId: item.id,
      description: item.name,
      quantity: 1,
      unitPrice: Number(item.sellingPrice ?? 0),
      discount: 0,
      tax: 0,
      billable: true,
      notes: "",
    });
  }

  const title = mode === "work" ? "Add Work Item" : mode === "job-part" ? "Add Part from Work" : "Add Part";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="flex max-h-[82vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e1e4e8] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-0.5 text-xs text-gray-500">Select an item to add to this estimate or invoice.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8dce1] text-xl text-gray-500 hover:bg-gray-50">×</button>
        </div>

        <div className="border-b border-[#e1e4e8] p-4">
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus placeholder="Search..." className={inputClass} />
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div className="mb-2 text-xs text-gray-500">{rows.length} result{rows.length === 1 ? "" : "s"}</div>
          <div className="space-y-2 md:hidden">
            {rows.map((item: any) => (
              <button key={`${mode}-${item.id}`} type="button" onClick={() => choose(item)} className="w-full rounded-xl border border-[#dfe2e6] p-3 text-left">
                <div className="font-medium">{mode === "work" ? item.title : item.name}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {mode === "work"
                    ? [item.vehicle, item.status].filter(Boolean).join(" · ")
                    : [item.partNumber, item.brand, mode === "job-part" ? item.workTitle : null].filter(Boolean).join(" · ")}
                </div>
              </button>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-[#dfe2e6] md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-[#e1e4e8] bg-[#fafafa] text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e8ea]">
                {rows.map((item: any) => (
                  <tr key={`${mode}-${item.id}`} className="hover:bg-[#fafafa]">
                    <td className="px-4 py-3 font-medium">{mode === "work" ? item.title : item.name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {mode === "work"
                        ? [item.vehicle, item.status].filter(Boolean).join(" · ") || "—"
                        : [item.partNumber, item.brand, mode === "job-part" ? item.workTitle : null].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatMoney(mode === "work" ? item.estimatedCost : mode === "job-part" ? item.unitPrice : item.sellingPrice)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => choose(item)} className="rounded-lg bg-[#1d2228] px-3 py-2 text-xs font-medium text-white hover:bg-black">Add</button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-500">No matching items.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatMoney(value?: number) {
  const number = Number(value ?? 0);
  return number ? number.toLocaleString() : "—";
}

const inputClass = "h-11 w-full rounded-lg border border-[#d8dce1] bg-white px-3 text-sm outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";
