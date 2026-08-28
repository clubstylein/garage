"use client";

import { useEffect, useMemo, useState } from "react";
import { GaragePart } from "@/lib/mock-data";

type NewPartForm = {
  name: string;
  part_number: string;
  brand: string;
  cost_price: string;
  selling_price: string;
  currency: string;
  supplier: string;
  supplier_part_number: string;
  stock_quantity: string;
  notes: string;
};

const emptyNewPart: NewPartForm = {
  name: "",
  part_number: "",
  brand: "",
  cost_price: "",
  selling_price: "",
  currency: "INR",
  supplier: "",
  supplier_part_number: "",
  stock_quantity: "0",
  notes: "",
};

export default function PartPickerModal({
  startCreate = false,
  onClose,
  onSelect,
}: {
  startCreate?: boolean;
  onClose: () => void;
  onSelect: (part: GaragePart) => void;
}) {
  const [parts, setParts] = useState<GaragePart[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(startCreate);
  const [saving, setSaving] = useState(false);
  const [newPart, setNewPart] = useState<NewPartForm>(emptyNewPart);

  useEffect(() => {
    void loadParts();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function loadParts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/parts", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Unable to load parts");
      }

      setParts(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load parts");
    } finally {
      setLoading(false);
    }
  }

  const filteredParts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return parts.slice(0, 50);

    return parts
      .filter((part) => {
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

        return text.includes(query);
      })
      .slice(0, 50);
  }, [parts, search]);

  async function createPart() {

    if (!newPart.name.trim()) {
      setError("Part name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPart),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Unable to create part");
      }

      onSelect(result as GaragePart);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create part");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-2 sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-[#e1e4e8] px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-lg font-semibold">Add Part</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Search the parts master or create a new part.
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

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-5">
          {!showCreate ? (
            <>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  autoFocus
                  placeholder="Search part number, name, brand or supplier..."
                  className={inputClass}
                />

                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(true);
                    setError("");
                  }}
                  className="h-11 shrink-0 rounded-lg border border-[#d8dce1] bg-white px-4 text-sm font-medium hover:bg-gray-50 sm:h-[40px]"
                >
                  + New Part
                </button>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-[#dfe2e6]">
                <div className="hidden grid-cols-[1.2fr_2fr_1fr_1fr_auto] gap-3 border-b border-[#e1e4e8] bg-[#fafafa] px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-gray-400 md:grid">
                  <div>Part No.</div>
                  <div>Part</div>
                  <div>Stock</div>
                  <div>Price</div>
                  <div></div>
                </div>

                {loading ? (
                  <div className="px-4 py-10 text-center text-sm text-gray-500">
                    Loading parts...
                  </div>
                ) : filteredParts.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-gray-500">
                    No parts found.
                  </div>
                ) : (
                  <div className="divide-y divide-[#e7e8ea]">
                    {filteredParts.map((part) => (
                      <div
                        key={part.id}
                        className="grid gap-2 px-4 py-3 md:grid-cols-[1.2fr_2fr_1fr_1fr_auto] md:items-center md:gap-3"
                      >
                        <div className="text-xs text-gray-500 md:text-sm">
                          {part.partNumber || "—"}
                        </div>

                        <div>
                          <div className="text-sm font-medium">{part.name}</div>
                          <div className="mt-0.5 text-xs text-gray-400">
                            {[part.brand, part.supplier].filter(Boolean).join(" · ") ||
                              "—"}
                          </div>
                        </div>

                        <div className="text-sm">
                          <span className="md:hidden text-xs text-gray-400">Stock: </span>
                          {part.stockQuantity ?? 0}
                        </div>

                        <div className="text-sm">
                          <span className="md:hidden text-xs text-gray-400">Price: </span>
                          {part.sellingPrice !== undefined
                            ? `${part.currency || ""} ${part.sellingPrice}`.trim()
                            : "—"}
                        </div>

                        <button
                          type="button"
                          onClick={() => onSelect(part)}
                          className="h-9 rounded-lg bg-[#1d2228] px-4 text-sm font-medium text-white hover:bg-black"
                        >
                          Select
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Create Part</h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Create it in the parts master and attach it to this work item.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setError("");
                  }}
                  className="rounded-lg border border-[#d8dce1] bg-white px-3 py-2 text-xs font-medium hover:bg-gray-50"
                >
                  Back to Search
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Part Name" required>
                  <input
                    value={newPart.name}
                    onChange={(event) =>
                      setNewPart((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    autoFocus
                    className={inputClass}
                  />
                </Field>

                <Field label="Part Number">
                  <input
                    value={newPart.part_number}
                    onChange={(event) =>
                      setNewPart((current) => ({
                        ...current,
                        part_number: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Brand">
                  <input
                    value={newPart.brand}
                    onChange={(event) =>
                      setNewPart((current) => ({
                        ...current,
                        brand: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Supplier">
                  <input
                    value={newPart.supplier}
                    onChange={(event) =>
                      setNewPart((current) => ({
                        ...current,
                        supplier: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Supplier Part No.">
                  <input
                    value={newPart.supplier_part_number}
                    onChange={(event) =>
                      setNewPart((current) => ({
                        ...current,
                        supplier_part_number: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Currency">
                  <input
                    value={newPart.currency}
                    onChange={(event) =>
                      setNewPart((current) => ({
                        ...current,
                        currency: event.target.value.toUpperCase(),
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Cost Price">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newPart.cost_price}
                    onChange={(event) =>
                      setNewPart((current) => ({
                        ...current,
                        cost_price: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Selling Price">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newPart.selling_price}
                    onChange={(event) =>
                      setNewPart((current) => ({
                        ...current,
                        selling_price: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Stock Quantity">
                  <input
                    type="number"
                    step="0.001"
                    value={newPart.stock_quantity}
                    onChange={(event) =>
                      setNewPart((current) => ({
                        ...current,
                        stock_quantity: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Notes">
                    <textarea
                      rows={3}
                      value={newPart.notes}
                      onChange={(event) =>
                        setNewPart((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      className={textareaClass}
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t border-[#e1e4e8] pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg border border-[#d8dce1] bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void createPart()}
                  disabled={saving}
                  className="rounded-lg bg-[#1d2228] px-5 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Create & Select"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-[#d8dce1] bg-white px-3 text-sm outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a] sm:h-[40px]";

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
