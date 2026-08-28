"use client";

import { useEffect, useMemo, useState } from "react";
import BillFormModal from "@/components/bill-form-modal";

type BillRow = {
  id: string;
  billNumber?: string;
  customerName?: string;
  customerCode?: string;
  type: "Estimate" | "Invoice";
  status?: string;
  billDate?: string;
  currency?: string;
  total?: number;
  itemCount?: number;
};

export default function BillingDashboard() {
  const [bills, setBills] = useState<BillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editing, setEditing] = useState<BillRow | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { void loadBills(); }, []);

  async function loadBills() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/bills", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Unable to load billing");
      setBills(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load billing");
    } finally {
      setLoading(false);
    }
  }

  const statuses = useMemo(() => Array.from(new Set(bills.map((b) => b.status).filter(Boolean) as string[])).sort(), [bills]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bills.filter((bill) => {
      const text = [bill.billNumber, bill.customerName, bill.customerCode, bill.type, bill.status].filter(Boolean).join(" ").toLowerCase();
      return (!q || text.includes(q)) && (typeFilter === "All" || bill.type === typeFilter) && (statusFilter === "All" || bill.status === statusFilter);
    });
  }, [bills, search, typeFilter, statusFilter]);

  const stats = useMemo(() => ({
    estimates: bills.filter((b) => b.type === "Estimate" && b.status !== "Cancelled").length,
    invoices: bills.filter((b) => b.type === "Invoice" && b.status !== "Cancelled").length,
    outstanding: bills.filter((b) => b.type === "Invoice" && !["Paid", "Cancelled"].includes(String(b.status))).length,
    paid: bills.filter((b) => b.type === "Invoice" && b.status === "Paid").length,
  }), [bills]);

  const filtersActive = search !== "" || typeFilter !== "All" || statusFilter !== "All";

  function clearFilters() {
    setSearch("");
    setTypeFilter("All");
    setStatusFilter("All");
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#1d2228]">
      <section className="border-b border-[#e1e4e8] bg-white">
        <div className="px-5 py-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
              <p className="mt-1 text-sm text-gray-500">Customer estimates and invoices</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <CompactStat label="Estimates" value={stats.estimates} />
              <CompactStat label="Invoices" value={stats.invoices} />
              <CompactStat label="Outstanding" value={stats.outstanding} />
              <CompactStat label="Paid" value={stats.paid} />
            </div>
          </div>
        </div>
      </section>

      <div className="px-5 py-5 lg:px-8">
        <div className="mb-5 rounded-xl border border-[#dfe2e6] bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-center">
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search bill, customer or status..." className={`${inputClass} lg:min-w-[300px] lg:flex-[2]`} />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`${inputClass} lg:min-w-[150px] lg:flex-1`}><option value="All">All Types</option><option value="Estimate">Estimates</option><option value="Invoice">Invoices</option></select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClass} lg:min-w-[170px] lg:flex-1`}><option value="All">All Status</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
            <button type="button" onClick={clearFilters} disabled={!filtersActive} className="h-[42px] shrink-0 rounded-lg border border-[#d8dce1] bg-white px-4 text-sm font-medium hover:bg-gray-50 disabled:opacity-40">Clear</button>
            <button type="button" onClick={() => { setEditing(null); setShowModal(true); }} className="h-[42px] shrink-0 rounded-lg bg-[#1d2228] px-5 text-sm font-medium text-white hover:bg-black">+ New Bill</button>
          </div>
          <div className="mt-3 text-xs text-gray-400">Showing <span className="font-medium text-gray-600">{filtered.length}</span> of <span className="font-medium text-gray-600">{bills.length}</span> bills</div>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="overflow-hidden rounded-xl border border-[#dfe2e6] bg-white">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead className="border-b border-[#e1e4e8] bg-[#fafafa] text-xs uppercase tracking-wide text-gray-400"><tr><th className="px-5 py-3">Number</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Items</th><th className="px-5 py-3 text-right">Total</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-[#e7e8ea]">
                {filtered.map((bill) => (
                  <tr key={bill.id} className="hover:bg-[#fafafa]">
                    <td className="px-5 py-4 font-medium">{bill.billNumber || `#${bill.id}`}</td>
                    <td className="px-5 py-4"><TypeBadge type={bill.type} /></td>
                    <td className="px-5 py-4"><div className="font-medium">{bill.customerName || "—"}</div><div className="mt-1 text-xs text-gray-400">{bill.customerCode || ""}</div></td>
                    <td className="px-5 py-4 text-sm">{formatDate(bill.billDate)}</td>
                    <td className="px-5 py-4"><StatusBadge status={bill.status || "Draft"} /></td>
                    <td className="px-5 py-4 text-right text-sm">{bill.itemCount ?? 0}</td>
                    <td className="px-5 py-4 text-right font-medium">{bill.currency || "INR"} {Number(bill.total ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="px-5 py-4 text-right"><button type="button" onClick={() => { setEditing(bill); setShowModal(true); }} className="rounded-lg border border-[#d8dce1] bg-white px-3 py-2 text-xs font-medium hover:bg-gray-50">Edit</button></td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && <tr><td colSpan={8} className="px-5 py-16 text-center text-sm text-gray-500">No billing records match the selected filters.</td></tr>}
                {loading && <tr><td colSpan={8} className="px-5 py-16 text-center text-sm text-gray-500">Loading billing...</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-[#e7e8ea] md:hidden">
            {filtered.map((bill) => (
              <button key={bill.id} type="button" onClick={() => { setEditing(bill); setShowModal(true); }} className="block w-full p-4 text-left">
                <div className="flex items-start justify-between gap-3"><div><div className="font-semibold">{bill.billNumber || `#${bill.id}`}</div><div className="mt-1 text-sm text-gray-500">{bill.customerName || "—"}</div></div><TypeBadge type={bill.type} /></div>
                <div className="mt-3 flex items-center justify-between text-sm"><StatusBadge status={bill.status || "Draft"} /><span className="font-semibold">{bill.currency || "INR"} {Number(bill.total ?? 0).toLocaleString()}</span></div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {showModal && <BillFormModal bill={editing} onClose={() => setShowModal(false)} onSaved={() => void loadBills()} />}
    </main>
  );
}

function CompactStat({ label, value }: { label: string; value: number }) {
  return <div className="inline-flex items-center gap-2 rounded-lg border border-[#dfe2e6] bg-[#fafafa] px-3 py-2"><span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</span><span className="text-sm font-semibold">{value}</span></div>;
}

function TypeBadge({ type }: { type: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${type === "Invoice" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{type}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const style: Record<string, string> = { Draft: "bg-gray-100 text-gray-600", Sent: "bg-blue-100 text-blue-700", Approved: "bg-green-100 text-green-700", Rejected: "bg-red-100 text-red-700", Invoiced: "bg-purple-100 text-purple-700", "Part Paid": "bg-yellow-100 text-yellow-700", Paid: "bg-green-100 text-green-700", Cancelled: "bg-red-100 text-red-700" };
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${style[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const parts = value.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
}

const inputClass = "h-[42px] w-full min-w-0 rounded-lg border border-[#d8dce1] bg-white px-3 text-sm outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";
