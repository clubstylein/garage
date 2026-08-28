"use client";

import { useEffect, useMemo, useState } from "react";
import { VehicleCustomer } from "@/lib/mock-data";
import CustomerSearchModal from "@/components/customer-search-modal";
import AddCustomerModal from "@/components/add-customer-modal";
import BillingSourceModal, { BillingLineDraft } from "@/components/billing-source-modal";
import ManualBillingLineModal from "@/components/manual-billing-line-modal";

type BillSummary = {
  id: string;
  billNumber?: string;
};

type SourceData = {
  workItems: any[];
  parts: any[];
  jobParts: any[];
};

type BillForm = {
  id?: string;
  billNumber?: string;
  customerId: string;
  type: "Estimate" | "Invoice";
  status: string;
  billDate: string;
  validUntil: string;
  dueDate: string;
  currency: string;
  discount: string;
  tax: string;
  notes: string;
  terms: string;
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm: BillForm = {
  customerId: "",
  type: "Estimate",
  status: "Draft",
  billDate: todayString(),
  validUntil: "",
  dueDate: "",
  currency: "INR",
  discount: "0",
  tax: "0",
  notes: "",
  terms: "",
};

export default function BillFormModal({
  bill,
  onClose,
  onSaved,
}: {
  bill?: BillSummary | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<BillForm>(emptyForm);
  const [lines, setLines] = useState<BillingLineDraft[]>([]);
  const [customers, setCustomers] = useState<VehicleCustomer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showManualLine, setShowManualLine] = useState(false);
  const [sourceMode, setSourceMode] =
    useState<"work" | "job-part" | "part" | null>(null);
  const [sourceData, setSourceData] = useState<SourceData>({
    workItems: [],
    parts: [],
    jobParts: [],
  });
  const [loadingSources, setLoadingSources] = useState(false);
  const [loading, setLoading] = useState(Boolean(bill?.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadCustomers();

    if (bill?.id) {
      void loadBill(bill.id);
    }
  }, [bill?.id]);

  async function loadCustomers() {
    try {
      const response = await fetch("/api/customers", {
        cache: "no-store",
      });

      const result = await response.json();

      if (response.ok) {
        setCustomers(Array.isArray(result) ? result : []);
      }
    } catch {
      // Keep billing usable even if customer refresh fails.
    }
  }

  async function loadBill(id: string) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/bills?id=${encodeURIComponent(id)}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Unable to load bill");
      }

      setForm({
        id: result.id,
        billNumber: result.billNumber,
        customerId: result.customerId || "",
        type: result.type === "Invoice" ? "Invoice" : "Estimate",
        status: result.status || "Draft",
        billDate: result.billDate || todayString(),
        validUntil: result.validUntil || "",
        dueDate: result.dueDate || "",
        currency: result.currency || "INR",
        discount: String(result.discount ?? 0),
        tax: String(result.tax ?? 0),
        notes: result.notes || "",
        terms: result.terms || "",
      });

      setLines(
        (Array.isArray(result.items) ? result.items : []).map(
          (item: any, index: number) => ({
            key: item.id || `existing-${index}`,
            lineType: item.lineType || "Manual",
            workItemId: item.workItemId,
            partId: item.partId,
            description: item.description || "",
            quantity: Number(item.quantity ?? 1),
            unitPrice: Number(item.unitPrice ?? 0),
            discount: Number(item.discount ?? 0),
            tax: Number(item.tax ?? 0),
            billable: item.billable !== false,
            notes: item.notes || "",
          })
        )
      );

      const customer = customers.find(
        (c) => String(c.id) === String(result.customerId)
      );

      if (customer) {
        setCustomerSearch(customer.name);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load bill"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!form.customerId) {
      return;
    }

    const customer = customers.find(
      (c) => String(c.id) === String(form.customerId)
    );

    if (customer && !customerSearch) {
      setCustomerSearch(customer.name);
    }
  }, [customers, form.customerId]);

  async function loadSources(
    mode: "work" | "job-part" | "part"
  ) {
    if (!form.customerId) {
      setError("Select a customer first.");
      return;
    }

    setLoadingSources(true);
    setError("");

    try {
      const response = await fetch(
        `/api/billing-source?customer=${encodeURIComponent(
          form.customerId
        )}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Unable to load billing items"
        );
      }

      setSourceData({
        workItems: Array.isArray(result.workItems)
          ? result.workItems
          : [],
        parts: Array.isArray(result.parts) ? result.parts : [],
        jobParts: Array.isArray(result.jobParts)
          ? result.jobParts
          : [],
      });

      setSourceMode(mode);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load billing items"
      );
    } finally {
      setLoadingSources(false);
    }
  }

  const selectedCustomer =
    customers.find(
      (c) => String(c.id) === String(form.customerId)
    ) ?? null;

  const customerMatches = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();

    if (!query || selectedCustomer) {
      return [];
    }

    return customers
      .filter((customer) =>
        [
          customer.name,
          customer.customerCode,
          customer.phone,
          customer.email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 8);
  }, [customers, customerSearch, selectedCustomer]);

  function selectCustomer(customer: VehicleCustomer) {
    setForm((current) => ({
      ...current,
      customerId: String(customer.id),
    }));

    setCustomerSearch(customer.name);
    setShowCustomerSearch(false);
    setLines([]);
    setSourceData({
      workItems: [],
      parts: [],
      jobParts: [],
    });
  }

  function clearCustomer() {
    setForm((current) => ({
      ...current,
      customerId: "",
    }));

    setCustomerSearch("");
    setLines([]);
  }

  function addManualLine(line: BillingLineDraft) {
    setLines((current) => [...current, line]);
    setShowManualLine(false);
  }

  function updateLine(
    key: string,
    field: keyof BillingLineDraft,
    value: any
  ) {
    setLines((current) =>
      current.map((line) =>
        line.key === key
          ? {
              ...line,
              [field]: value,
            }
          : line
      )
    );
  }

  function removeLine(key: string) {
    setLines((current) =>
      current.filter((line) => line.key !== key)
    );
  }

  function lineAmount(line: BillingLineDraft) {
    if (!line.billable) {
      return 0;
    }

    return Math.max(
      0,
      Number(line.quantity || 0) *
        Number(line.unitPrice || 0) -
        Number(line.discount || 0) +
        Number(line.tax || 0)
    );
  }

  const subtotal = lines.reduce(
    (sum, line) => sum + lineAmount(line),
    0
  );

  const total = Math.max(
    0,
    subtotal -
      (Number(form.discount) || 0) +
      (Number(form.tax) || 0)
  );

  async function saveBill() {
    if (!form.customerId) {
      setError("Customer is required.");
      return;
    }

    if (lines.length === 0) {
      setError("Add at least one bill item.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/bills", {
        method: form.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          items: lines,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Unable to save bill"
        );
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save bill"
      );
    } finally {
      setSaving(false);
    }
  }

  function changeType(type: "Estimate" | "Invoice") {
    setForm((current) => ({
      ...current,
      type,
      status: "Draft",
      validUntil: type === "Estimate" ? current.validUntil : "",
      dueDate: type === "Invoice" ? current.dueDate : "",
    }));
  }

  const statuses =
    form.type === "Estimate"
      ? [
          "Draft",
          "Sent",
          "Approved",
          "Rejected",
          "Invoiced",
          "Cancelled",
        ]
      : ["Draft", "Sent", "Part Paid", "Paid", "Cancelled"];

  if (loading) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45">
        <div className="rounded-xl bg-white px-6 py-4 shadow-xl">
          Loading billing...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-2 sm:p-4">
        <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#f5f6f8] shadow-2xl max-sm:h-full max-sm:max-w-none max-sm:rounded-none" style={{ height: "min(820px, calc(100dvh - 32px))" }}>
          {/* HEADER */}

          <div className="flex shrink-0 items-center justify-between border-b border-[#dfe2e6] bg-white px-4 py-2.5 sm:px-5">
            <div>
              <h2 className="text-lg font-semibold sm:text-xl">
                {form.id
                  ? `Edit ${form.type}`
                  : `New ${form.type}`}
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                {form.billNumber ||
                  "Customer billing, estimates and invoices"}
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

          {/* BODY */}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
            {/* BILL HEADER */}

            <div className="rounded-xl border border-[#dfe2e6] bg-white p-3 sm:p-4">
              {/* CUSTOMER */}

              <div className="relative">
                <Field label="Customer" required>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                    <div className="relative min-w-0 flex-1">
                      <input
                        type="search"
                        value={customerSearch}
                        onChange={(event) => {
                          setCustomerSearch(event.target.value);

                          if (form.customerId) {
                            setForm((current) => ({
                              ...current,
                              customerId: "",
                            }));
                          }
                        }}
                        placeholder="Search customer..."
                        className={inputClass}
                      />

                      {selectedCustomer && (
                        <button
                          type="button"
                          onClick={clearCustomer}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 text-gray-500"
                        >
                          ×
                        </button>
                      )}

                      {customerMatches.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-lg border border-[#d8dce1] bg-white shadow-xl">
                          {customerMatches.map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() =>
                                selectCustomer(customer)
                              }
                              className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm last:border-0 hover:bg-gray-50"
                            >
                              <div className="font-medium">
                                {customer.name}
                              </div>

                              <div className="text-xs text-gray-500">
                                {[
                                  customer.customerCode,
                                  customer.phone,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setShowCustomerSearch(true)
                      }
                      className={secondaryButton}
                    >
                      ⌕ Search
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowAddCustomer(true)}
                      className={secondaryButton}
                    >
                      + Add
                    </button>
                  </div>
                </Field>
              </div>

              {/* COMPACT BILL FIELDS */}

              <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Type">
                  <select
                    value={form.type}
                    onChange={(event) =>
                      changeType(
                        event.target.value === "Invoice"
                          ? "Invoice"
                          : "Estimate"
                      )
                    }
                    className={inputClass}
                  >
                    <option value="Estimate">Estimate</option>
                    <option value="Invoice">Invoice</option>
                  </select>
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
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Currency">
                  <input
                    value={form.currency}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        currency: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Bill Date">
                  <input
                    type="date"
                    value={form.billDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        billDate: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field
                  label={
                    form.type === "Estimate"
                      ? "Valid Until"
                      : "Due Date"
                  }
                >
                  <input
                    type="date"
                    value={
                      form.type === "Estimate"
                        ? form.validUntil
                        : form.dueDate
                    }
                    onChange={(event) =>
                      setForm((current) =>
                        form.type === "Estimate"
                          ? {
                              ...current,
                              validUntil: event.target.value,
                            }
                          : {
                              ...current,
                              dueDate: event.target.value,
                            }
                      )
                    }
                    className={inputClass}
                  />
                </Field>

              </div>
            </div>

            {/* BILL ITEMS */}

            <div className="mt-4 overflow-hidden rounded-xl border border-[#dfe2e6] bg-white">
              <div className="flex flex-col gap-3 border-b border-[#e1e4e8] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">Bill Items</h3>

                    <span className="text-xs text-gray-500">
                      {lines.length} item
                      {lines.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <p className="mt-0.5 text-xs text-gray-500">
                    Non-billable lines remain visible but contribute zero
                    to the total.
                  </p>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    disabled={!form.customerId || loadingSources}
                    onClick={() => void loadSources("work")}
                    className={secondaryButton}
                  >
                    + Work
                  </button>

                  <button
                    type="button"
                    disabled={!form.customerId || loadingSources}
                    onClick={() => void loadSources("job-part")}
                    className={secondaryButton}
                  >
                    + Job Part
                  </button>

                  <button
                    type="button"
                    disabled={!form.customerId || loadingSources}
                    onClick={() => void loadSources("part")}
                    className={secondaryButton}
                  >
                    + Part
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowManualLine(true)}
                    className={secondaryButton}
                  >
                    + Manual
                  </button>
                </div>
              </div>

              {/* GRID */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
                  <thead className="border-b border-[#e1e4e8] bg-[#fafafa] text-xs uppercase tracking-wide text-gray-400">
                    <tr>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Description</th>
                      <th className="px-3 py-3 text-right">Qty</th>
                      <th className="px-3 py-3 text-right">
                        Unit Price
                      </th>
                      <th className="px-3 py-3 text-right">
                        Discount
                      </th>
                      <th className="px-3 py-3 text-right">Tax</th>
                      <th className="px-3 py-3 text-center">
                        Billable
                      </th>
                      <th className="px-3 py-3 text-right">
                        Amount
                      </th>
                      <th className="px-3 py-3 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#e7e8ea]">
                    {lines.map((line) => (
                      <tr
                        key={line.key}
                        className={
                          !line.billable
                            ? "bg-gray-50 text-gray-500"
                            : ""
                        }
                      >
                        <td className="px-3 py-2">
                          <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-1 text-xs">
                            {line.lineType}
                          </span>
                        </td>

                        <td className="px-3 py-2">
                          <input
                            value={line.description}
                            onChange={(event) =>
                              updateLine(
                                line.key,
                                "description",
                                event.target.value
                              )
                            }
                            className={gridInput}
                          />
                        </td>

                        <td className="w-[90px] px-3 py-2">
                          <input
                            type="number"
                            step="0.001"
                            value={line.quantity}
                            onChange={(event) =>
                              updateLine(
                                line.key,
                                "quantity",
                                Number(event.target.value)
                              )
                            }
                            className={`${gridInput} text-right`}
                          />
                        </td>

                        <td className="w-[120px] px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={line.unitPrice}
                            onChange={(event) =>
                              updateLine(
                                line.key,
                                "unitPrice",
                                Number(event.target.value)
                              )
                            }
                            className={`${gridInput} text-right`}
                          />
                        </td>

                        <td className="w-[110px] px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={line.discount}
                            onChange={(event) =>
                              updateLine(
                                line.key,
                                "discount",
                                Number(event.target.value)
                              )
                            }
                            className={`${gridInput} text-right`}
                          />
                        </td>

                        <td className="w-[100px] px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={line.tax}
                            onChange={(event) =>
                              updateLine(
                                line.key,
                                "tax",
                                Number(event.target.value)
                              )
                            }
                            className={`${gridInput} text-right`}
                          />
                        </td>

                        <td className="w-[85px] px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={line.billable}
                            onChange={(event) =>
                              updateLine(
                                line.key,
                                "billable",
                                event.target.checked
                              )
                            }
                            className="h-4 w-4"
                          />
                        </td>

                        <td className="w-[120px] px-3 py-2 text-right font-medium">
                          {formatMoney(lineAmount(line))}
                        </td>

                        <td className="w-[90px] px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeLine(line.key)}
                            className="whitespace-nowrap rounded-lg border border-red-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}

                    {lines.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-12 text-center text-gray-500"
                        >
                          Add work, parts or a manual line.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}

              <div className="space-y-3 p-3 md:hidden">
                {lines.map((line) => (
                  <div
                    key={line.key}
                    className="rounded-xl border border-[#dfe2e6] p-3"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                        {line.lineType}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        className="text-xs text-red-600"
                      >
                        Remove
                      </button>
                    </div>

                    <Field label="Description">
                      <input
                        value={line.description}
                        onChange={(event) =>
                          updateLine(
                            line.key,
                            "description",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </Field>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Field label="Qty">
                        <input
                          type="number"
                          step="0.001"
                          value={line.quantity}
                          onChange={(event) =>
                            updateLine(
                              line.key,
                              "quantity",
                              Number(event.target.value)
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Unit Price">
                        <input
                          type="number"
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(event) =>
                            updateLine(
                              line.key,
                              "unitPrice",
                              Number(event.target.value)
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Discount">
                        <input
                          type="number"
                          step="0.01"
                          value={line.discount}
                          onChange={(event) =>
                            updateLine(
                              line.key,
                              "discount",
                              Number(event.target.value)
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Tax">
                        <input
                          type="number"
                          step="0.01"
                          value={line.tax}
                          onChange={(event) =>
                            updateLine(
                              line.key,
                              "tax",
                              Number(event.target.value)
                            )
                          }
                          className={inputClass}
                        />
                      </Field>
                    </div>

                    <label className="mt-3 flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={line.billable}
                        onChange={(event) =>
                          updateLine(
                            line.key,
                            "billable",
                            event.target.checked
                          )
                        }
                      />
                      Billable
                    </label>

                    <div className="mt-2 text-right font-semibold">
                      {form.currency} {formatMoney(lineAmount(line))}
                    </div>
                  </div>
                ))}

                {lines.length === 0 && (
                  <div className="py-8 text-center text-sm text-gray-500">
                    Add work, parts or a manual line.
                  </div>
                )}
              </div>
            </div>

            {/* NOTES / TOTALS */}

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_380px]">
              <div className="grid gap-3">
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
                    className={textareaClass}
                  />
                </Field>

                <Field label="Terms">
                  <textarea
                    rows={3}
                    value={form.terms}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        terms: event.target.value,
                      }))
                    }
                    className={textareaClass}
                  />
                </Field>
              </div>

              <div className="rounded-xl border border-[#dfe2e6] bg-white p-4">
                <TotalRow
                  label="Items subtotal"
                  value={`${form.currency} ${formatMoney(subtotal)}`}
                />

                <div className="my-3 grid grid-cols-2 gap-3">
                  <Field label="Bill Discount">
                    <input
                      type="number"
                      step="0.01"
                      value={form.discount}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          discount: event.target.value,
                        }))
                      }
                      className={`${inputClass} text-right`}
                    />
                  </Field>

                  <Field label="Bill Tax">
                    <input
                      type="number"
                      step="0.01"
                      value={form.tax}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          tax: event.target.value,
                        }))
                      }
                      className={`${inputClass} text-right`}
                    />
                  </Field>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[#e1e4e8] pt-3">
                  <span className="font-semibold">Total</span>

                  <span className="text-xl font-semibold">
                    {form.currency} {formatMoney(total)}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* FOOTER */}

          <div className="flex shrink-0 justify-end gap-2 border-t border-[#dfe2e6] bg-white px-4 py-2.5">
            <button
              type="button"
              onClick={onClose}
              className={secondaryButton}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => void saveBill()}
              disabled={saving}
              className="h-10 rounded-lg bg-[#1d2228] px-5 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : form.id
                  ? "Save Changes"
                  : `Create ${form.type}`}
            </button>
          </div>
        </div>
      </div>

      {showCustomerSearch && (
        <CustomerSearchModal
          customers={customers}
          onSelect={selectCustomer}
          onClose={() => setShowCustomerSearch(false)}
        />
      )}

      {showAddCustomer && (
        <AddCustomerModal
          onClose={() => setShowAddCustomer(false)}
          onCreated={(customer) => {
            setCustomers((current) =>
              [...current, customer].sort((a, b) =>
                a.name.localeCompare(b.name)
              )
            );

            selectCustomer(customer);
            setShowAddCustomer(false);
          }}
        />
      )}

      {showManualLine && (
        <ManualBillingLineModal
          currency={form.currency}
          onAdd={addManualLine}
          onClose={() => setShowManualLine(false)}
        />
      )}

      {sourceMode && (
        <BillingSourceModal
          mode={sourceMode}
          workItems={sourceData.workItems}
          parts={sourceData.parts}
          jobParts={sourceData.jobParts}
          onAdd={(line) => {
            setLines((current) => [...current, line]);
            setSourceMode(null);
          }}
          onClose={() => setSourceMode(null)}
        />
      )}
    </>
  );
}

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

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      {children}
    </label>
  );
}

function TotalRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

const inputClass =
  "h-10 w-full min-w-0 rounded-lg border border-[#d8dce1] bg-white px-3 text-sm text-[#1d2228] outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";

const gridInput =
  "h-9 w-full min-w-[70px] rounded-lg border border-[#d8dce1] bg-white px-2 text-sm outline-none focus:border-[#7c828a]";

const textareaClass =
  "min-h-[82px] w-full resize-y rounded-lg border border-[#d8dce1] bg-white px-3 py-2 text-sm outline-none focus:border-[#7c828a]";

const secondaryButton =
  "inline-flex h-10 w-auto shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-[#d8dce1] bg-white px-4 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40";
