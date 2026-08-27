"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Vehicle,
  VehicleCustomer,
  WorkItem,
} from "@/lib/mock-data";

import AddCustomerModal from "@/components/add-customer-modal";
import CustomerSearchModal from "@/components/customer-search-modal";

type Mode = "create" | "edit";
type VehicleMode = "existing" | "free-text";

type WorkForm = {
  id?: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  work_description: string;
  odometer: string;
  target_date: string;
  started_date: string;
  completed_date: string;
  estimated_cost: string;
  notes: string;
};

const emptyForm: WorkForm = {
  title: "",
  category: "",
  priority: "3",
  status: "Planned",
  work_description: "",
  odometer: "",
  target_date: "",
  started_date: "",
  completed_date: "",
  estimated_cost: "",
  notes: "",
};

export default function VehicleWorkModal({
  vehicle,
  vehicles = [],
  initialWorkItemId,
  onClose,
  onChanged,
}: {
  vehicle?: Vehicle;
  vehicles?: Vehicle[];
  initialWorkItemId?: string;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const selectableVehicles = useMemo(
    () =>
      vehicles.filter(
        (item) =>
          String(item.ownershipStatus || "").trim().toLowerCase() !==
          "wishlist"
      ),
    [vehicles]
  );

  const vehicleMap = useMemo(
    () =>
      new Map(
        selectableVehicles.map((item) => [String(item.id), item] as const)
      ),
    [selectableVehicles]
  );

  const [customers, setCustomers] = useState<VehicleCustomer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const customerBoxRef = useRef<HTMLDivElement | null>(null);

  const [items, setItems] = useState<WorkItem[]>([]);
  const [mode, setMode] = useState<Mode>("create");
  const [vehicleMode, setVehicleMode] = useState<VehicleMode>("existing");

  const initialCustomerId = vehicle
    ? String(vehicle.customerId ?? vehicle.customer?.id ?? "")
    : "";

  const [selectedCustomerId, setSelectedCustomerId] =
    useState(initialCustomerId);
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    vehicle?.id ? String(vehicle.id) : ""
  );
  const [vehicleText, setVehicleText] = useState("");

  const [form, setForm] = useState<WorkForm>({
    ...emptyForm,
    odometer:
      vehicle?.odometer !== undefined && vehicle?.odometer !== null
        ? String(vehicle.odometer)
        : "",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedCustomer =
    customers.find(
      (customer) => String(customer.id) === String(selectedCustomerId)
    ) ?? null;

  const customerVehicles = useMemo(() => {
    if (!selectedCustomerId) return [];

    return selectableVehicles
      .filter(
        (item) =>
          String(item.customerId ?? item.customer?.id ?? "") ===
          String(selectedCustomerId)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectableVehicles, selectedCustomerId]);

  const selectedVehicle = selectedVehicleId
    ? vehicleMap.get(String(selectedVehicleId)) ?? null
    : null;

  const quickCustomerResults = useMemo(() => {
    const query = customerQuery.trim().toLowerCase();

    if (!query) return [];

    return customers
      .filter((customer) => {
        const text = [
          customer.name,
          customer.customerCode,
          customer.phone,
          customer.email,
          customer.city,
          customer.state,
          customer.pincode,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(query);
      })
      .slice(0, 8);
  }, [customers, customerQuery]);

  useEffect(() => {
    void loadCustomers();
  }, []);

  useEffect(() => {
    if (!vehicle?.id) return;

    const customerId = String(vehicle.customerId ?? vehicle.customer?.id ?? "");
    setSelectedCustomerId(customerId);
    setSelectedVehicleId(String(vehicle.id));
    setVehicleMode("existing");
    setVehicleText("");
  }, [vehicle]);

  useEffect(() => {
    if (!selectedCustomerId) {
      setItems([]);
      return;
    }

    void loadCustomerWorkItems(selectedCustomerId);
  }, [selectedCustomerId]);

  useEffect(() => {
    if (!initialWorkItemId) return;
    void loadInitialWorkItem(initialWorkItemId);
  }, [initialWorkItemId, customers.length, selectableVehicles.length]);

  useEffect(() => {
    if (selectedCustomer) {
      setCustomerQuery(selectedCustomer.name);
    }
  }, [selectedCustomer?.id]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        customerBoxRef.current &&
        !customerBoxRef.current.contains(event.target as Node)
      ) {
        setCustomerSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key === "Escape" &&
        !showAddCustomer &&
        !showCustomerSearch
      ) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, showAddCustomer, showCustomerSearch]);

  async function loadCustomers() {
    setLoadingCustomers(true);

    try {
      const response = await fetch("/api/customers", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Unable to load customers");
      }

      setCustomers(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("Load customers error:", err);
      setError(err instanceof Error ? err.message : "Unable to load customers");
    } finally {
      setLoadingCustomers(false);
    }
  }

  async function loadCustomerWorkItems(customerId: string) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/work-items?customer=${encodeURIComponent(customerId)}`,
        { cache: "no-store" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Unable to load work items");
      }

      setItems(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("Load work items error:", err);
      setError(err instanceof Error ? err.message : "Unable to load work items");
    } finally {
      setLoading(false);
    }
  }

  async function loadInitialWorkItem(id: string) {
    try {
      const response = await fetch(`/api/work-items?id=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const item = await response.json();

      if (!response.ok) {
        throw new Error(item?.error || "Unable to load work item");
      }

      if (item) {
        fillEditForm(item as WorkItem);
      }
    } catch (err) {
      console.error("Initial work item error:", err);
      setError(err instanceof Error ? err.message : "Unable to load work item");
    }
  }

  function inferCustomerId(item: WorkItem) {
    if (item.customerId) return String(item.customerId);

    if (item.vehicleId) {
      const itemVehicle = vehicleMap.get(String(item.vehicleId));
      return String(itemVehicle?.customerId ?? itemVehicle?.customer?.id ?? "");
    }

    return "";
  }

  function selectCustomer(customer: VehicleCustomer) {
    const changed = String(customer.id) !== String(selectedCustomerId);

    setSelectedCustomerId(String(customer.id));
    setCustomerQuery(customer.name);
    setCustomerSearchOpen(false);
    setShowCustomerSearch(false);

    if (changed) {
      setSelectedVehicleId("");
      setVehicleText("");
      setVehicleMode("existing");

      if (mode === "create") {
        setForm({ ...emptyForm });
      }
    }

    setError("");
  }

  function handleCustomerCreated(customer: VehicleCustomer) {
    setCustomers((current) => {
      const withoutDuplicate = current.filter(
        (item) => String(item.id) !== String(customer.id)
      );
      return [...withoutDuplicate, customer].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    });

    setShowAddCustomer(false);
    selectCustomer(customer);
  }

  function handleVehicleModeChange(nextMode: VehicleMode) {
    setVehicleMode(nextMode);
    setError("");

    if (nextMode === "existing") {
      setVehicleText("");
    } else {
      setSelectedVehicleId("");
      setForm((current) => ({ ...current, odometer: "" }));
    }
  }

  function handleVehicleChange(vehicleId: string) {
    setSelectedVehicleId(vehicleId);
    setError("");

    const nextVehicle = vehicleMap.get(String(vehicleId));

    setForm((current) => ({
      ...current,
      odometer:
        nextVehicle?.odometer !== undefined && nextVehicle?.odometer !== null
          ? String(nextVehicle.odometer)
          : "",
    }));
  }

  function newWorkItem() {
    setMode("create");
    setError("");
    setVehicleMode("existing");
    setVehicleText("");
    setSelectedVehicleId(vehicle?.id ? String(vehicle.id) : "");

    setForm({
      ...emptyForm,
      odometer:
        vehicle?.odometer !== undefined && vehicle?.odometer !== null
          ? String(vehicle.odometer)
          : "",
    });
  }

  function fillEditForm(item: WorkItem) {
    const customerId = inferCustomerId(item);
    const itemVehicleId = item.vehicleId ? String(item.vehicleId) : "";
    const freeText = String(item.vehicleText || "");

    setSelectedCustomerId(customerId);
    setSelectedVehicleId(itemVehicleId);
    setVehicleMode(itemVehicleId ? "existing" : "free-text");
    setVehicleText(freeText);

    const foundCustomer = customers.find(
      (customer) => String(customer.id) === customerId
    );
    if (foundCustomer) setCustomerQuery(foundCustomer.name);

    setForm({
      id: item.id,
      title: item.title ?? "",
      category: item.category ?? "",
      priority: String(item.priority ?? 3),
      status: item.status ?? "Planned",
      work_description: item.workDescription ?? "",
      odometer:
        item.odometer !== undefined && item.odometer !== null
          ? String(item.odometer)
          : "",
      target_date: item.targetDate ?? "",
      started_date: item.startedDate ?? "",
      completed_date: item.completedDate ?? "",
      estimated_cost:
        item.estimatedCost !== undefined && item.estimatedCost !== null
          ? String(item.estimatedCost)
          : "",
      notes: item.notes ?? "",
    });

    setMode("edit");
    setError("");
  }

  function updateField(field: keyof WorkForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCustomerId) {
      setError("Select a customer first.");
      return;
    }

    if (vehicleMode === "existing" && !selectedVehicleId) {
      setError("Select an existing vehicle or change Vehicle Type to Free Text.");
      return;
    }

    if (vehicleMode === "free-text" && !vehicleText.trim()) {
      setError("Enter the vehicle description.");
      return;
    }

    if (!form.title.trim()) {
      setError("Work title is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/work-items", {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          customer: selectedCustomerId,
          vehicle_mode: vehicleMode,
          vehicle: vehicleMode === "existing" ? selectedVehicleId : null,
          vehicle_text: vehicleMode === "free-text" ? vehicleText.trim() : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Unable to save work item");
      }

      await loadCustomerWorkItems(selectedCustomerId);
      fillEditForm(result as WorkItem);
      onChanged?.();
    } catch (err) {
      console.error("Save work item error:", err);
      setError(err instanceof Error ? err.message : "Unable to save work item");
    } finally {
      setSaving(false);
    }
  }

  const formDisabled = !selectedCustomerId;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-3"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-[#f5f6f8] shadow-2xl sm:max-h-[94vh]">
          <div className="flex shrink-0 items-center justify-between border-b border-[#dfe2e6] bg-white px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">Work Items</h2>
              <p className="mt-0.5 truncate text-xs text-gray-500">
                {selectedCustomer
                  ? `${selectedCustomer.name} · ${
                      vehicleMode === "existing"
                        ? selectedVehicle?.name || "select a vehicle"
                        : vehicleText || "enter vehicle"
                    }`
                  : "Select customer and vehicle"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#d8dce1] bg-white text-lg text-gray-500 hover:bg-gray-50 hover:text-black"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[285px_1fr]">
            <aside className="order-2 max-h-[30vh] overflow-y-auto border-t border-[#dfe2e6] bg-white p-3 lg:order-1 lg:max-h-none lg:border-r lg:border-t-0">
              <button
                type="button"
                onClick={newWorkItem}
                disabled={!selectedCustomerId}
                className="mb-3 w-full rounded-lg bg-[#1d2228] px-3 py-2 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                + Add Work
              </button>

              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Customer Work
                </span>
                <span className="text-xs text-gray-400">{items.length}</span>
              </div>

              {!selectedCustomerId ? (
                <EmptyBox>Select a customer to view work.</EmptyBox>
              ) : loading ? (
                <div className="py-6 text-center text-xs text-gray-500">
                  Loading...
                </div>
              ) : items.length === 0 ? (
                <EmptyBox>No work items yet.</EmptyBox>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => {
                    const itemVehicle = item.vehicleId
                      ? vehicleMap.get(String(item.vehicleId))
                      : null;
                    const selected =
                      mode === "edit" && String(form.id) === String(item.id);

                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => fillEditForm(item)}
                        className={`w-full rounded-lg border p-2.5 text-left transition ${
                          selected
                            ? "border-[#1d2228] bg-[#f5f6f8]"
                            : "border-[#e2e4e7] bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                              {item.title}
                            </div>
                            <div className="mt-0.5 truncate text-[11px] text-gray-500">
                              {itemVehicle?.name || item.vehicleText || "Vehicle"}
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                            P{item.priority ?? 3}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </aside>

            <div className="order-1 min-h-0 overflow-y-auto p-3 sm:p-4 lg:order-2">
              <form onSubmit={handleSave}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">
                      {mode === "edit" ? "Edit Work" : "Add Work"}
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {mode === "edit"
                        ? "Update work item."
                        : "Create a new work item."}
                    </p>
                  </div>

                  {mode === "edit" && (
                    <button
                      type="button"
                      onClick={newWorkItem}
                      className="shrink-0 rounded-lg border border-[#d8dce1] bg-white px-3 py-2 text-xs font-medium hover:bg-gray-50"
                    >
                      + New
                    </button>
                  )}
                </div>

                <div className="grid gap-3 xl:grid-cols-4">
                  <div className="xl:col-span-4">
                    <Field label="Customer" required>
                      <div className="flex flex-wrap gap-2">
                        <div
                          ref={customerBoxRef}
                          className="relative min-w-[220px] flex-1"
                        >
                          <input
                            type="search"
                            value={customerQuery}
                            onFocus={() => setCustomerSearchOpen(true)}
                            onChange={(event) => {
                              const value = event.target.value;
                              setCustomerQuery(value);
                              setCustomerSearchOpen(true);

                              if (
                                selectedCustomer &&
                                value.trim() !== selectedCustomer.name.trim()
                              ) {
                                setSelectedCustomerId("");
                                setSelectedVehicleId("");
                                setVehicleText("");
                                setItems([]);
                                setMode("create");
                                setForm({ ...emptyForm });
                              }
                            }}
                            placeholder={
                              loadingCustomers
                                ? "Loading customers..."
                                : "Search name, phone, email or code..."
                            }
                            className={inputClass}
                          />

                          {customerSearchOpen && customerQuery.trim() && (
                            <div className="absolute left-0 right-0 top-[42px] z-30 max-h-72 overflow-y-auto rounded-xl border border-[#d8dce1] bg-white p-1 shadow-xl sm:top-[40px]">
                              {quickCustomerResults.length > 0 ? (
                                quickCustomerResults.map((customer) => (
                                  <button
                                    key={customer.id}
                                    type="button"
                                    onClick={() => selectCustomer(customer)}
                                    className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-50"
                                  >
                                    <div className="min-w-0">
                                      <div className="truncate text-sm font-medium">
                                        {customer.name}
                                      </div>
                                      <div className="mt-0.5 truncate text-xs text-gray-500">
                                        {[
                                          customer.customerCode,
                                          customer.phone,
                                          customer.city,
                                        ]
                                          .filter(Boolean)
                                          .join(" · ")}
                                      </div>
                                    </div>
                                    <span className="shrink-0 text-[11px] text-gray-400">
                                      {formatCategory(customer.category)}
                                    </span>
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-4 text-center text-xs text-gray-500">
                                  No matching customers. Use detailed search or Add.
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowCustomerSearch(true)}
                          className="h-11 shrink-0 rounded-lg border border-[#d8dce1] bg-white px-4 text-sm font-medium hover:bg-gray-50 sm:h-[38px]"
                          title="Detailed customer search"
                        >
                          ⌕ Search
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowAddCustomer(true)}
                          className="h-11 shrink-0 rounded-lg border border-[#d8dce1] bg-white px-4 text-sm font-medium hover:bg-gray-50 sm:h-[38px]"
                        >
                          + Add
                        </button>
                      </div>

                      {selectedCustomer && (
                        <div className="mt-1.5 text-xs text-gray-500">
                          {selectedCustomer.customerCode || "—"} ·{" "}
                          {formatCategory(selectedCustomer.category)}
                          {selectedCustomer.phone
                            ? ` · ${selectedCustomer.phone}`
                            : ""}
                        </div>
                      )}
                    </Field>
                  </div>

                  <div className="xl:col-span-4">
                    <Field label="Vehicle" required>
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={vehicleMode}
                          onChange={(event) =>
                            handleVehicleModeChange(
                              event.target.value as VehicleMode
                            )
                          }
                          disabled={!selectedCustomerId}
                          className={`${selectClass} w-full shrink-0 sm:w-[170px]`}
                        >
                          <option value="existing">Existing Vehicle</option>
                          <option value="free-text">Free Text</option>
                        </select>

                        <div className="min-w-[220px] flex-1">
                          {vehicleMode === "existing" ? (
                            <select
                              value={selectedVehicleId}
                              onChange={(event) =>
                                handleVehicleChange(event.target.value)
                              }
                              disabled={!selectedCustomerId}
                              className={selectClass}
                            >
                              <option value="">
                                {!selectedCustomerId
                                  ? "Select customer first..."
                                  : customerVehicles.length === 0
                                    ? "No saved vehicles for this customer"
                                    : "Select vehicle..."}
                              </option>

                              {customerVehicles.map((item) => (
                                <option key={item.id} value={String(item.id)}>
                                  {item.name} — {item.year} {item.make} {item.model}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              value={vehicleText}
                              onChange={(event) =>
                                setVehicleText(event.target.value)
                              }
                              disabled={!selectedCustomerId}
                              placeholder="e.g. 2020 Royal Enfield Himalayan 411 · TN43..."
                              className={inputClass}
                            />
                          )}
                        </div>
                      </div>
                    </Field>
                  </div>

                  <div className="xl:col-span-4">
                    <Field label="Work Title" required>
                      <input
                        value={form.title}
                        onChange={(event) =>
                          updateField("title", event.target.value)
                        }
                        disabled={formDisabled}
                        placeholder="Replace rear cylinder and piston"
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <Field label="Category">
                    <input
                      value={form.category}
                      onChange={(event) =>
                        updateField("category", event.target.value)
                      }
                      disabled={formDisabled}
                      list="work-category-options"
                      placeholder="Engine"
                      className={inputClass}
                    />
                    <datalist id="work-category-options">
                      <option value="Engine" />
                      <option value="Electrical" />
                      <option value="Brakes" />
                      <option value="Suspension" />
                      <option value="Drivetrain" />
                      <option value="Controls" />
                      <option value="Wheels & Tyres" />
                      <option value="Body" />
                      <option value="Service" />
                      <option value="Fabrication" />
                      <option value="Accessories" />
                      <option value="Other" />
                    </datalist>
                  </Field>

                  <Field label="Status">
                    <select
                      value={form.status}
                      disabled={formDisabled}
                      onChange={(event) =>
                        updateField("status", event.target.value)
                      }
                      className={selectClass}
                    >
                      <option value="Idea">Idea</option>
                      <option value="Planned">Planned</option>
                      <option value="Parts Required">Parts Required</option>
                      <option value="Parts Ordered">Parts Ordered</option>
                      <option value="Ready">Ready</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </Field>

                  <Field label="Priority">
                    <select
                      value={form.priority}
                      disabled={formDisabled}
                      onChange={(event) =>
                        updateField("priority", event.target.value)
                      }
                      className={selectClass}
                    >
                      <option value="1">1 — Urgent</option>
                      <option value="2">2 — High</option>
                      <option value="3">3 — Normal</option>
                      <option value="4">4 — Low</option>
                    </select>
                  </Field>

                  <Field label="Odometer">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={form.odometer}
                        disabled={formDisabled}
                        onChange={(event) =>
                          updateField("odometer", event.target.value)
                        }
                        className={inputClass}
                      />
                      {vehicleMode === "existing" && (
                        <span className="shrink-0 text-xs text-gray-500">
                          {selectedVehicle?.odometerUnit || "km"}
                        </span>
                      )}
                    </div>
                  </Field>

                  <Field label="Target Date">
                    <input
                      type="date"
                      value={form.target_date}
                      disabled={formDisabled}
                      onChange={(event) =>
                        updateField("target_date", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Started Date">
                    <input
                      type="date"
                      value={form.started_date}
                      disabled={formDisabled}
                      onChange={(event) =>
                        updateField("started_date", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Completed Date">
                    <input
                      type="date"
                      value={form.completed_date}
                      disabled={formDisabled}
                      onChange={(event) =>
                        updateField("completed_date", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Estimated Cost">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.estimated_cost}
                      disabled={formDisabled}
                      onChange={(event) =>
                        updateField("estimated_cost", event.target.value)
                      }
                      placeholder="0"
                      className={inputClass}
                    />
                  </Field>

                  <div className="xl:col-span-2">
                    <Field label="Work Description">
                      <textarea
                        rows={3}
                        value={form.work_description}
                        disabled={formDisabled}
                        onChange={(event) =>
                          updateField("work_description", event.target.value)
                        }
                        placeholder="Problem, diagnosis and planned work..."
                        className={textareaClass}
                      />
                    </Field>
                  </div>

                  <div className="xl:col-span-2">
                    <Field label="Notes">
                      <textarea
                        rows={3}
                        value={form.notes}
                        disabled={formDisabled}
                        onChange={(event) =>
                          updateField("notes", event.target.value)
                        }
                        placeholder="Workshop notes..."
                        className={textareaClass}
                      />
                    </Field>
                  </div>
                </div>

                {error && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </div>
                )}

                <div className="mt-4 flex justify-end gap-2 border-t border-[#dfe2e6] pt-3">
                  <button
                    type="button"
                    onClick={newWorkItem}
                    disabled={formDisabled}
                    className="rounded-lg border border-[#d8dce1] bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Clear
                  </button>

                  <button
                    type="submit"
                    disabled={saving || formDisabled}
                    className="rounded-lg bg-[#1d2228] px-5 py-2 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saving
                      ? "Saving..."
                      : mode === "edit"
                        ? "Save Changes"
                        : "Add Work"}
                  </button>
                </div>
              </form>
            </div>
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
          onCreated={handleCustomerCreated}
        />
      )}
    </>
  );
}

function EmptyBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-xs text-gray-500">
      {children}
    </div>
  );
}

function formatCategory(category?: string) {
  const value = String(category || "").trim().toLowerCase();
  if (value === "self-owned") return "Self-owned";
  if (value === "vip") return "VIP";
  if (value === "general") return "General";
  return category || "Customer";
}

const inputClass =
  "h-11 w-full min-w-0 rounded-lg border border-[#d8dce1] bg-white px-3 text-sm text-[#1d2228] outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a] disabled:bg-gray-50 disabled:text-gray-400 sm:h-[38px]";

const selectClass =
  "h-11 w-full min-w-0 rounded-lg border border-[#d8dce1] bg-white px-3 text-sm text-[#1d2228] outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a] disabled:bg-gray-50 disabled:text-gray-400 sm:h-[38px]";

const textareaClass =
  "min-h-[82px] w-full rounded-lg border border-[#d8dce1] bg-white px-3 py-2 text-sm text-[#1d2228] outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a] disabled:bg-gray-50 disabled:text-gray-400";

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
