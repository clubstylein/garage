"use client";

import { useEffect, useMemo, useState } from "react";
import { GaragePart } from "@/lib/mock-data";
import PartFormModal from "@/components/part-form-modal";

export default function PartsDashboard() {
  const [parts, setParts] = useState<GaragePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");
  const [supplierFilter, setSupplierFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [activeFilter, setActiveFilter] = useState("Active");
  const [editingPart, setEditingPart] = useState<GaragePart | null>(null);
  const [showPartModal, setShowPartModal] = useState(false);

  useEffect(() => {
    void loadParts();
  }, []);

  async function loadParts() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/parts?include_inactive=1", {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Unable to load parts");
      setParts(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load parts");
    } finally {
      setLoading(false);
    }
  }

  const brands = useMemo(
    () =>
      Array.from(new Set(parts.map((p) => p.brand).filter(Boolean) as string[])).sort(),
    [parts]
  );

  const suppliers = useMemo(
    () =>
      Array.from(
        new Set(parts.map((p) => p.supplier).filter(Boolean) as string[])
      ).sort(),
    [parts]
  );

  function stockState(part: GaragePart) {
    const stock = Number(part.stockQuantity ?? 0);
    const reorder = Number(part.reorderLevel ?? 0);
    if (stock <= 0) return "Out of Stock";
    if (reorder > 0 && stock <= reorder) return "Low Stock";
    return "In Stock";
  }

  const filteredParts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return parts.filter((part) => {
      const text = [
        part.partNumber,
        part.name,
        part.brand,
        part.description,
        part.supplier,
        part.supplierPartNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchSearch = !query || text.includes(query);
      const matchBrand = brandFilter === "All" || part.brand === brandFilter;
      const matchSupplier =
        supplierFilter === "All" || part.supplier === supplierFilter;
      const matchStock = stockFilter === "All" || stockState(part) === stockFilter;
      const matchActive =
        activeFilter === "All" ||
        (activeFilter === "Active" ? part.active !== false : part.active === false);

      return matchSearch && matchBrand && matchSupplier && matchStock && matchActive;
    });
  }, [parts, search, brandFilter, supplierFilter, stockFilter, activeFilter]);

  const stats = useMemo(() => {
    return {
      total: parts.filter((p) => p.active !== false).length,
      inStock: parts.filter((p) => p.active !== false && stockState(p) === "In Stock").length,
      lowStock: parts.filter((p) => p.active !== false && stockState(p) === "Low Stock").length,
      out: parts.filter((p) => p.active !== false && stockState(p) === "Out of Stock").length,
    };
  }, [parts]);

  function clearFilters() {
    setSearch("");
    setBrandFilter("All");
    setSupplierFilter("All");
    setStockFilter("All");
    setActiveFilter("Active");
  }

  const filtersActive =
    search !== "" ||
    brandFilter !== "All" ||
    supplierFilter !== "All" ||
    stockFilter !== "All" ||
    activeFilter !== "Active";

  function saveIntoList(saved: GaragePart) {
    setParts((current) => {
      const exists = current.some((part) => String(part.id) === String(saved.id));
      if (exists) {
        return current.map((part) =>
          String(part.id) === String(saved.id) ? saved : part
        );
      }
      return [...current, saved];
    });
    setShowPartModal(false);
    setEditingPart(null);
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#1d2228]">
      <section className="border-b border-[#e1e4e8] bg-white">
        <div className="px-5 py-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Parts</h1>
              <p className="mt-1 text-sm text-gray-500">
                Garage parts master, stock and pricing
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <CompactStat label="Total" value={stats.total} />
              <CompactStat label="In Stock" value={stats.inStock} />
              <CompactStat label="Low Stock" value={stats.lowStock} />
              <CompactStat label="Out" value={stats.out} />
            </div>
          </div>
        </div>
      </section>

      <div className="px-5 py-5 lg:px-8">
        <div className="mb-5 rounded-xl border border-[#dfe2e6] bg-white p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:flex-nowrap xl:items-center">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search part, number, brand or supplier..."
              className={`${inputClass} xl:min-w-[280px] xl:flex-[2.2]`}
            />

            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className={`${selectClass} xl:min-w-[150px] xl:flex-1`}
            >
              <option value="All">All Brands</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>

            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className={`${selectClass} xl:min-w-[160px] xl:flex-1`}
            >
              <option value="All">All Suppliers</option>
              {suppliers.map((supplier) => (
                <option key={supplier} value={supplier}>{supplier}</option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className={`${selectClass} xl:min-w-[145px] xl:flex-1`}
            >
              <option value="All">All Stock</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>

            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className={`${selectClass} xl:min-w-[120px] xl:flex-1`}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="All">All</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!filtersActive}
              className="h-[42px] shrink-0 rounded-lg border border-[#d8dce1] bg-white px-4 text-sm font-medium hover:bg-gray-50 disabled:opacity-40"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingPart(null);
                setShowPartModal(true);
              }}
              className="h-[42px] shrink-0 rounded-lg bg-[#1d2228] px-5 text-sm font-medium text-white hover:bg-black"
            >
              + Add Part
            </button>
          </div>

          <div className="mt-3 text-xs text-gray-400">
            Showing <span className="font-medium text-gray-600">{filteredParts.length}</span>{" "}
            of <span className="font-medium text-gray-600">{parts.length}</span> parts
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-[#dfe2e6] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left">
              <thead className="border-b border-[#e1e4e8] bg-[#fafafa]">
                <tr>
                  <TableHeader>Part No.</TableHeader>
                  <TableHeader>Part</TableHeader>
                  <TableHeader>Brand</TableHeader>
                  <TableHeader>Supplier</TableHeader>
                  <TableHeader align="right">Stock</TableHeader>
                  <TableHeader align="right">Reorder</TableHeader>
                  <TableHeader align="right">Cost</TableHeader>
                  <TableHeader align="right">Sell</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader align="right">Actions</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e8ea]">
                {loading ? (
                  <tr><td colSpan={10} className="px-5 py-16 text-center text-sm text-gray-500">Loading parts...</td></tr>
                ) : filteredParts.length === 0 ? (
                  <tr><td colSpan={10} className="px-5 py-16 text-center text-sm text-gray-500">No parts match the selected filters.</td></tr>
                ) : (
                  filteredParts.map((part) => (
                    <tr key={part.id} className="hover:bg-[#fafafa]">
                      <td className="px-5 py-4 text-sm text-gray-600">{part.partNumber || "—"}</td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPart(part);
                            setShowPartModal(true);
                          }}
                          className="text-left font-medium hover:underline"
                        >
                          {part.name}
                        </button>
                        {part.description && (
                          <div className="mt-1 line-clamp-1 text-xs text-gray-400">{part.description}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm">{part.brand || "—"}</td>
                      <td className="px-5 py-4 text-sm">{part.supplier || "—"}</td>
                      <td className="px-5 py-4 text-right text-sm">{formatQty(part.stockQuantity)}</td>
                      <td className="px-5 py-4 text-right text-sm">{formatQty(part.reorderLevel)}</td>
                      <td className="px-5 py-4 text-right text-sm">{formatMoney(part.costPrice, part.currency)}</td>
                      <td className="px-5 py-4 text-right text-sm">{formatMoney(part.sellingPrice, part.currency)}</td>
                      <td className="px-5 py-4"><StockBadge value={stockState(part)} /></td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPart(part);
                            setShowPartModal(true);
                          }}
                          className="rounded-lg border border-[#d8dce1] bg-white px-3 py-2 text-xs font-medium hover:bg-gray-50"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showPartModal && (
        <PartFormModal
          part={editingPart}
          onClose={() => {
            setShowPartModal(false);
            setEditingPart(null);
          }}
          onSaved={saveIntoList}
        />
      )}
    </main>
  );
}

const inputClass =
  "h-[42px] w-full min-w-0 rounded-lg border border-[#d8dce1] bg-white px-3 text-sm outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";
const selectClass = inputClass;

function CompactStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-[#dfe2e6] bg-[#fafafa] px-3 py-2">
      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function TableHeader({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th className={`px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

function StockBadge({ value }: { value: string }) {
  const classes =
    value === "Out of Stock"
      ? "bg-red-100 text-red-700"
      : value === "Low Stock"
        ? "bg-orange-100 text-orange-700"
        : "bg-green-100 text-green-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}>{value}</span>;
}

function formatQty(value?: number) {
  if (value === undefined || value === null) return "—";
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 });
}

function formatMoney(value?: number, currency?: string) {
  if (value === undefined || value === null) return "—";
  return `${currency || ""} ${Number(value).toLocaleString()}`.trim();
}
