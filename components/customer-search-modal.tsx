"use client";

import { useMemo, useState } from "react";
import { VehicleCustomer } from "@/lib/mock-data";

export default function CustomerSearchModal({
  customers,
  onSelect,
  onClose,
}: {
  customers: VehicleCustomer[];
  onSelect: (customer: VehicleCustomer) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    const cityQuery = city.trim().toLowerCase();
    const stateQuery = state.trim().toLowerCase();

    return customers
      .filter((customer) => {
        const text = [
          customer.customerCode,
          customer.name,
          customer.phone,
          customer.email,
          customer.city,
          customer.state,
          customer.pincode,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch = !query || text.includes(query);
        const matchesCategory =
          category === "All" ||
          String(customer.category || "").toLowerCase() === category;
        const matchesCity =
          !cityQuery || String(customer.city || "").toLowerCase().includes(cityQuery);
        const matchesState =
          !stateQuery ||
          String(customer.state || "").toLowerCase().includes(stateQuery);

        return matchesSearch && matchesCategory && matchesCity && matchesState;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, search, category, city, state]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="flex h-full w-full flex-col overflow-hidden bg-[#f5f6f8] sm:h-auto sm:max-h-[88vh] sm:max-w-5xl sm:rounded-2xl sm:shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#dfe2e6] bg-white px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-lg font-semibold">Search Customer</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Search by customer, code, phone, email, city or state
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#d8dce1] bg-white text-xl text-gray-500 hover:bg-gray-50 sm:h-9 sm:w-9"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="border-b border-[#dfe2e6] bg-white p-3 sm:p-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, code, phone or email..."
              className={inputClass}
              autoFocus
            />

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={inputClass}
            >
              <option value="All">All Categories</option>
              <option value="self-owned">Self-owned</option>
              <option value="vip">VIP</option>
              <option value="general">General</option>
            </select>

            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="City"
              className={inputClass}
            />

            <input
              value={state}
              onChange={(event) => setState(event.target.value)}
              placeholder="State"
              className={inputClass}
            />

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("All");
                setCity("");
                setState("");
              }}
              className="h-11 rounded-lg border border-[#d8dce1] bg-white px-4 text-sm font-medium hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
          <div className="mb-2 text-xs text-gray-500">
            {results.length} customer{results.length === 1 ? "" : "s"}
          </div>

          <div className="space-y-2 md:hidden">
            {results.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => onSelect(customer)}
                className="w-full rounded-xl border border-[#dfe2e6] bg-white p-3 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{customer.name}</div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {customer.customerCode || "—"} · {formatCategory(customer.category)}
                    </div>
                  </div>
                  <span className="text-sm font-medium">Select</span>
                </div>
                <div className="mt-2 text-xs leading-5 text-gray-500">
                  {[customer.phone, customer.email, customer.city, customer.state]
                    .filter(Boolean)
                    .join(" · ") || "No contact details"}
                </div>
              </button>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-[#dfe2e6] bg-white md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-[#e1e4e8] bg-[#fafafa] text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e8ea]">
                {results.map((customer) => (
                  <tr key={customer.id} className="hover:bg-[#fafafa]">
                    <td className="px-4 py-3 text-gray-500">
                      {customer.customerCode || "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">{customer.name}</td>
                    <td className="px-4 py-3">{formatCategory(customer.category)}</td>
                    <td className="px-4 py-3">{customer.phone || "—"}</td>
                    <td className="px-4 py-3">{customer.city || "—"}</td>
                    <td className="px-4 py-3">{customer.state || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelect(customer)}
                        className="rounded-lg bg-[#1d2228] px-3 py-2 text-xs font-medium text-white hover:bg-black"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}

                {results.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      No customers match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatCategory(category?: string) {
  const value = String(category || "").toLowerCase();
  if (value === "self-owned") return "Self-owned";
  if (value === "vip") return "VIP";
  if (value === "general") return "General";
  return category || "Customer";
}

const inputClass =
  "h-11 w-full min-w-0 rounded-lg border border-[#d8dce1] bg-white px-3 text-sm text-[#1d2228] outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";
