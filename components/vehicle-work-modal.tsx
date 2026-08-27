"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Vehicle,
  VehicleCustomer,
  WorkItem,
} from "@/lib/mock-data";

import AddCustomerModal from "@/components/add-customer-modal";

type Mode =
  | "create"
  | "edit";

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

  onClose:
    () => void;

  onChanged?:
    () => void;
}) {
  /* =======================================================
     VEHICLES
     ======================================================= */

  const selectableVehicles =
    useMemo(
      () =>
        vehicles.filter(
          (item) =>
            String(
              item.ownershipStatus ||
                ""
            )
              .trim()
              .toLowerCase() !==
            "wishlist"
        ),
      [vehicles]
    );

  /* =======================================================
     CUSTOMERS
     ======================================================= */

  const [
    customers,
    setCustomers,
  ] =
    useState<
      VehicleCustomer[]
    >([]);

  const [
    loadingCustomers,
    setLoadingCustomers,
  ] =
    useState(
      true
    );

  const [
    showAddCustomer,
    setShowAddCustomer,
  ] =
    useState(
      false
    );

  /* =======================================================
     STATE
     ======================================================= */

  const [
    items,
    setItems,
  ] =
    useState<
      WorkItem[]
    >([]);

  const [
    mode,
    setMode,
  ] =
    useState<Mode>(
      "create"
    );

  const [
    selectedCustomerId,
    setSelectedCustomerId,
  ] =
    useState(
      vehicle
        ? String(
            vehicle.customerId ??
              vehicle.customer
                ?.id ??
              ""
          )
        : ""
    );

  const [
    selectedVehicleId,
    setSelectedVehicleId,
  ] =
    useState(
      vehicle?.id
        ? String(
            vehicle.id
          )
        : ""
    );

  const [
    form,
    setForm,
  ] =
    useState<WorkForm>({
      ...emptyForm,

      odometer:
        vehicle?.odometer !==
          undefined &&
        vehicle?.odometer !==
          null
          ? String(
              vehicle.odometer
            )
          : "",
    });

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  /* =======================================================
     LOAD CUSTOMERS
     ======================================================= */

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoadingCustomers(
      true
    );

    try {
      const response =
        await fetch(
          "/api/customers",
          {
            cache:
              "no-store",
          }
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result?.error ||
            "Unable to load customers"
        );
      }

      setCustomers(
        Array.isArray(
          result
        )
          ? result
          : []
      );
    } catch (
      err
    ) {
      console.error(
        "Load customers error:",
        err
      );

      setError(
        err instanceof
          Error
          ? err.message
          : "Unable to load customers"
      );
    } finally {
      setLoadingCustomers(
        false
      );
    }
  }

  /* =======================================================
     SELECTED CUSTOMER
     ======================================================= */

  const selectedCustomer =
    customers.find(
      (customer) =>
        String(
          customer.id
        ) ===
        String(
          selectedCustomerId
        )
    ) ??
    null;

  /* =======================================================
     CUSTOMER VEHICLES
     ======================================================= */

  const customerVehicles =
    useMemo(() => {
      if (
        !selectedCustomerId
      ) {
        return [];
      }

      return selectableVehicles
        .filter(
          (item) =>
            String(
              item.customerId ??
                item.customer
                  ?.id ??
                ""
            ) ===
            String(
              selectedCustomerId
            )
        )
        .sort(
          (
            a,
            b
          ) =>
            a.name.localeCompare(
              b.name
            )
        );
    }, [
      selectableVehicles,
      selectedCustomerId,
    ]);

  const selectedVehicle =
    vehicle ??
    selectableVehicles.find(
      (item) =>
        String(
          item.id
        ) ===
        String(
          selectedVehicleId
        )
    ) ??
    null;

  /* =======================================================
     SUPPLIED VEHICLE
     ======================================================= */

  useEffect(() => {
    if (
      !vehicle?.id
    ) {
      return;
    }

    setSelectedVehicleId(
      String(
        vehicle.id
      )
    );

    setSelectedCustomerId(
      String(
        vehicle.customerId ??
          vehicle.customer
            ?.id ??
          ""
      )
    );
  }, [
    vehicle,
  ]);

  /* =======================================================
     WORK ITEMS
     ======================================================= */

  useEffect(() => {
    if (
      !selectedVehicleId
    ) {
      setItems(
        []
      );

      return;
    }

    loadWorkItems(
      selectedVehicleId,
      true
    );
  }, [
    selectedVehicleId,
    initialWorkItemId,
  ]);

  /* =======================================================
     ESC
     ======================================================= */

  useEffect(() => {
    function handleKeyDown(
      event:
        KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape" &&
      !showAddCustomer
      ) {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    onClose,
    showAddCustomer,
  ]);

  /* =======================================================
     LOAD VEHICLE WORK
     ======================================================= */

  async function loadWorkItems(
    vehicleId:
      string,

    openInitial =
      false
  ) {
    if (!vehicleId) {
      setItems(
        []
      );

      return;
    }

    setLoading(
      true
    );

    setError("");

    try {
      const response =
        await fetch(
          `/api/vehicles/${encodeURIComponent(
            vehicleId
          )}/work-items`,
          {
            cache:
              "no-store",
          }
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result?.error ||
            "Unable to load work items"
        );
      }

      const loadedItems =
        Array.isArray(
          result
        )
          ? result as
              WorkItem[]
          : [];

      setItems(
        loadedItems
      );

      if (
        openInitial &&
        initialWorkItemId
      ) {
        const selected =
          loadedItems.find(
            (item) =>
              String(
                item.id
              ) ===
              String(
                initialWorkItemId
              )
          );

        if (
          selected
        ) {
          fillEditForm(
            selected
          );
        }
      }
    } catch (
      err
    ) {
      setError(
        err instanceof
          Error
          ? err.message
          : "Unable to load work items"
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  /* =======================================================
     NEW CUSTOMER CREATED
     ======================================================= */

  function handleCustomerCreated(
    customer:
      VehicleCustomer
  ) {
    setCustomers(
      (
        current
      ) => {
        const exists =
          current.some(
            (item) =>
              String(
                item.id
              ) ===
              String(
                customer.id
              )
          );

        if (exists) {
          return current;
        }

        return [
          ...current,
          customer,
        ].sort(
          (
            a,
            b
          ) =>
            a.name.localeCompare(
              b.name
            )
        );
      }
    );

    setSelectedCustomerId(
      String(
        customer.id
      )
    );

    setSelectedVehicleId(
      ""
    );

    setItems(
      []
    );

    setMode(
      "create"
    );

    setForm({
      ...emptyForm,
    });

    setShowAddCustomer(
      false
    );

    setError("");
  }

  /* =======================================================
     CUSTOMER CHANGE
     ======================================================= */

  function handleCustomerChange(
    customerId:
      string
  ) {
    setSelectedCustomerId(
      customerId
    );

    setSelectedVehicleId(
      ""
    );

    setItems(
      []
    );

    setMode(
      "create"
    );

    setForm({
      ...emptyForm,
    });

    setError("");
  }

  /* =======================================================
     VEHICLE CHANGE
     ======================================================= */

  function handleVehicleChange(
    vehicleId:
      string
  ) {
    const nextVehicleId =
      String(
        vehicleId
      );

    setSelectedVehicleId(
      nextVehicleId
    );

    setMode(
      "create"
    );

    setError("");

    if (!nextVehicleId) {
      setItems(
        []
      );

      setForm({
        ...emptyForm,
      });

      return;
    }

    const selected =
      customerVehicles.find(
        (item) =>
          String(
            item.id
          ) ===
          nextVehicleId
      );

    if (!selected) {
      setSelectedVehicleId(
        ""
      );

      setError(
        "This vehicle is not available for workshop work."
      );

      return;
    }

    setForm({
      ...emptyForm,

      odometer:
        selected.odometer !==
          undefined &&
        selected.odometer !==
          null
          ? String(
              selected.odometer
            )
          : "",
    });
  }

  /* =======================================================
     NEW WORK
     ======================================================= */

  function newWorkItem() {
    setMode(
      "create"
    );

    setError("");

    setForm({
      ...emptyForm,

      odometer:
        selectedVehicle
          ?.odometer !==
          undefined &&
        selectedVehicle
          ?.odometer !==
          null
          ? String(
              selectedVehicle.odometer
            )
          : "",
    });
  }

  /* =======================================================
     EDIT WORK
     ======================================================= */

  function fillEditForm(
    item:
      WorkItem
  ) {
    setForm({
      id:
        item.id,

      title:
        item.title ??
        "",

      category:
        item.category ??
        "",

      priority:
        String(
          item.priority ??
            3
        ),

      status:
        item.status ??
        "Planned",

      work_description:
        item.workDescription ??
        "",

      odometer:
        item.odometer !==
          undefined &&
        item.odometer !==
          null
          ? String(
              item.odometer
            )
          : "",

      target_date:
        item.targetDate ??
        "",

      started_date:
        item.startedDate ??
        "",

      completed_date:
        item.completedDate ??
        "",

      estimated_cost:
        item.estimatedCost !==
          undefined &&
        item.estimatedCost !==
          null
          ? String(
              item.estimatedCost
            )
          : "",

      notes:
        item.notes ??
        "",
    });

    setMode(
      "edit"
    );

    setError("");
  }

  function updateField(
    field:
      keyof WorkForm,

    value:
      string
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,

        [field]:
          value,
      })
    );
  }

  /* =======================================================
     SAVE
     ======================================================= */

  async function handleSave(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !selectedCustomerId
    ) {
      setError(
        "Select a customer first."
      );

      return;
    }

    if (
      !selectedVehicleId ||
      !selectedVehicle
    ) {
      setError(
        "Select a vehicle first."
      );

      return;
    }

    if (
      !form.title.trim()
    ) {
      setError(
        "Work title is required."
      );

      return;
    }

    setSaving(
      true
    );

    setError("");

    try {
      const response =
        await fetch(
          `/api/vehicles/${encodeURIComponent(
            selectedVehicleId
          )}/work-items`,
          {
            method:
              mode ===
              "edit"
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                ...form,

                vehicle:
                  selectedVehicleId,
              }),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result?.error ||
            "Unable to save work item"
        );
      }

      await loadWorkItems(
        selectedVehicleId,
        false
      );

      fillEditForm(
        result
      );

      onChanged?.();
    } catch (
      err
    ) {
      setError(
        err instanceof
          Error
          ? err.message
          : "Unable to save work item"
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     LOCKING
     ======================================================= */

  const customerLocked =
    Boolean(
      vehicle
    ) ||
    mode ===
      "edit";

  const vehicleLocked =
    Boolean(
      vehicle
    ) ||
    mode ===
      "edit";

  const formDisabled =
    !selectedVehicleId;

  /* =======================================================
     UI
     ======================================================= */

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
        onMouseDown={(
          event
        ) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            onClose();
          }
        }}
      >
        <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-[#f5f6f8] shadow-2xl">
          {/* HEADER */}

          <div className="flex items-center justify-between border-b border-[#dfe2e6] bg-white px-5 py-3">
            <div>
              <h2 className="text-lg font-semibold">
                Work Items
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                {selectedVehicle
                  ? `${selectedVehicle.name} · ${selectedVehicle.year} ${selectedVehicle.make}`
                  : selectedCustomer
                    ? `${selectedCustomer.name} · select a vehicle`
                    : "Select customer and vehicle"}
              </p>
            </div>

            <button
              type="button"
              onClick={
                onClose
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8dce1] bg-white text-lg text-gray-500 hover:bg-gray-50"
            >
              ×
            </button>
          </div>

          {/* BODY */}

          <div className="grid min-h-0 flex-1 lg:grid-cols-[285px_1fr]">
            {/* LEFT */}

            <aside className="overflow-y-auto border-r border-[#dfe2e6] bg-white p-3">
              <button
                type="button"
                onClick={
                  newWorkItem
                }
                disabled={
                  formDisabled
                }
                className="mb-3 w-full rounded-lg bg-[#1d2228] px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                + Add Work
              </button>

              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Work Items
                </span>

                <span className="text-xs text-gray-400">
                  {items.length}
                </span>
              </div>

              {!selectedVehicleId ? (
                <div className="rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-xs text-gray-500">
                  Select customer and vehicle.
                </div>
              ) : loading ? (
                <div className="py-6 text-center text-xs text-gray-500">
                  Loading...
                </div>
              ) : items.length ===
                0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-xs text-gray-500">
                  No work items yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map(
                    (
                      item
                    ) => (
                      <button
                        type="button"
                        key={
                          item.id
                        }
                        onClick={() =>
                          fillEditForm(
                            item
                          )
                        }
                        className="w-full rounded-lg border border-[#e2e4e7] bg-white p-2.5 text-left hover:bg-gray-50"
                      >
                        <div className="text-sm font-semibold">
                          {
                            item.title
                          }
                        </div>

                        <div className="mt-1 text-[11px] text-gray-500">
                          {item.category ||
                            "General"}
                        </div>
                      </button>
                    )
                  )}
                </div>
              )}
            </aside>

            {/* RIGHT */}

            <div className="overflow-y-auto p-4">
              <form
                onSubmit={
                  handleSave
                }
              >
                <div className="mb-3">
                  <h3 className="text-base font-semibold">
                    {mode ===
                    "edit"
                      ? "Edit Work"
                      : "Add Work"}
                  </h3>
                </div>

                <div className="grid gap-3 xl:grid-cols-4">
                  {/* CUSTOMER */}

                  <div className="xl:col-span-2">
                    <Field
                      label="Customer"
                      required
                    >
                      <div className="flex gap-2">
                        {customerLocked ? (
                          <div className={`${lockedClass} flex-1`}>
                            {selectedCustomer
                              ? `${selectedCustomer.name} — ${formatCategory(
                                  selectedCustomer.category
                                )}`
                              : "Unknown customer"}
                          </div>
                        ) : (
                          <select
                            value={
                              selectedCustomerId
                            }
                            onChange={(
                              event
                            ) =>
                              handleCustomerChange(
                                event.target
                                  .value
                              )
                            }
                            className={`${inputClass} flex-1`}
                          >
                            <option value="">
                              {loadingCustomers
                                ? "Loading customers..."
                                : "Select customer..."}
                            </option>

                            {customers.map(
                              (
                                customer
                              ) => (
                                <option
                                  key={
                                    customer.id
                                  }
                                  value={
                                    customer.id
                                  }
                                >
                                  {customer.name} — {formatCategory(
                                    customer.category
                                  )}
                                </option>
                              )
                            )}
                          </select>
                        )}

                        {!customerLocked && (
                          <button
                            type="button"
                            onClick={() =>
                              setShowAddCustomer(
                                true
                              )
                            }
                            className="h-[36px] shrink-0 rounded-lg border border-[#d8dce1] bg-white px-3 text-xs font-medium hover:bg-gray-50"
                          >
                            + Add Customer
                          </button>
                        )}
                      </div>
                    </Field>
                  </div>

                  {/* VEHICLE */}

                  <div className="xl:col-span-2">
                    <Field
                      label="Vehicle"
                      required
                    >
                      {vehicleLocked ? (
                        <div className={lockedClass}>
                          {selectedVehicle
                            ? `${selectedVehicle.name} — ${selectedVehicle.year} ${selectedVehicle.make}`
                            : "Unknown vehicle"}
                        </div>
                      ) : (
                        <select
                          value={
                            selectedVehicleId
                          }
                          onChange={(
                            event
                          ) =>
                            handleVehicleChange(
                              event.target
                                .value
                            )
                          }
                          disabled={
                            !selectedCustomerId
                          }
                          className={
                            inputClass
                          }
                        >
                          <option value="">
                            {!selectedCustomerId
                              ? "Select customer first..."
                              : customerVehicles.length ===
                                  0
                                ? "No vehicles for this customer"
                                : "Select vehicle..."}
                          </option>

                          {customerVehicles.map(
                            (
                              item
                            ) => (
                              <option
                                key={
                                  item.id
                                }
                                value={String(
                                  item.id
                                )}
                              >
                                {item.name} — {item.year} {item.make}
                              </option>
                            )
                          )}
                        </select>
                      )}
                    </Field>
                  </div>

                  {/* TITLE */}

                  <div className="xl:col-span-4">
                    <Field
                      label="Work Title"
                      required
                    >
                      <input
                        value={
                          form.title
                        }
                        onChange={(
                          event
                        ) =>
                          updateField(
                            "title",
                            event.target
                              .value
                          )
                        }
                        disabled={
                          formDisabled
                        }
                        className={
                          inputClass
                        }
                      />
                    </Field>
                  </div>

                  <Field label="Category">
                    <input
                      value={
                        form.category
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "category",
                          event.target
                            .value
                        )
                      }
                      disabled={
                        formDisabled
                      }
                      className={
                        inputClass
                      }
                    />
                  </Field>

                  <Field label="Status">
                    <select
                      value={
                        form.status
                      }
                      disabled={
                        formDisabled
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "status",
                          event.target
                            .value
                        )
                      }
                      className={
                        inputClass
                      }
                    >
                      <option>
                        Idea
                      </option>

                      <option>
                        Planned
                      </option>

                      <option>
                        Parts Required
                      </option>

                      <option>
                        Parts Ordered
                      </option>

                      <option>
                        Ready
                      </option>

                      <option>
                        In Progress
                      </option>

                      <option>
                        On Hold
                      </option>

                      <option>
                        Completed
                      </option>

                      <option>
                        Cancelled
                      </option>
                    </select>
                  </Field>

                  <Field label="Priority">
                    <select
                      value={
                        form.priority
                      }
                      disabled={
                        formDisabled
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "priority",
                          event.target
                            .value
                        )
                      }
                      className={
                        inputClass
                      }
                    >
                      <option value="1">
                        1 — Urgent
                      </option>

                      <option value="2">
                        2 — High
                      </option>

                      <option value="3">
                        3 — Normal
                      </option>

                      <option value="4">
                        4 — Low
                      </option>
                    </select>
                  </Field>

                  <Field label="Odometer">
                    <input
                      type="number"
                      value={
                        form.odometer
                      }
                      disabled={
                        formDisabled
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "odometer",
                          event.target
                            .value
                        )
                      }
                      className={
                        inputClass
                      }
                    />
                  </Field>

                  <Field label="Target Date">
                    <input
                      type="date"
                      value={
                        form.target_date
                      }
                      disabled={
                        formDisabled
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "target_date",
                          event.target
                            .value
                        )
                      }
                      className={
                        inputClass
                      }
                    />
                  </Field>

                  <Field label="Started Date">
                    <input
                      type="date"
                      value={
                        form.started_date
                      }
                      disabled={
                        formDisabled
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "started_date",
                          event.target
                            .value
                        )
                      }
                      className={
                        inputClass
                      }
                    />
                  </Field>

                  <Field label="Completed Date">
                    <input
                      type="date"
                      value={
                        form.completed_date
                      }
                      disabled={
                        formDisabled
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "completed_date",
                          event.target
                            .value
                        )
                      }
                      className={
                        inputClass
                      }
                    />
                  </Field>

                  <Field label="Estimated Cost">
                    <input
                      type="number"
                      value={
                        form.estimated_cost
                      }
                      disabled={
                        formDisabled
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "estimated_cost",
                          event.target
                            .value
                        )
                      }
                      className={
                        inputClass
                      }
                    />
                  </Field>

                  <div className="xl:col-span-2">
                    <Field label="Work Description">
                      <textarea
                        rows={3}
                        value={
                          form.work_description
                        }
                        disabled={
                          formDisabled
                        }
                        onChange={(
                          event
                        ) =>
                          updateField(
                            "work_description",
                            event.target
                              .value
                          )
                        }
                        className={`${inputClass} min-h-[78px] resize-y`}
                      />
                    </Field>
                  </div>

                  <div className="xl:col-span-2">
                    <Field label="Notes">
                      <textarea
                        rows={3}
                        value={
                          form.notes
                        }
                        disabled={
                          formDisabled
                        }
                        onChange={(
                          event
                        ) =>
                          updateField(
                            "notes",
                            event.target
                              .value
                          )
                        }
                        className={`${inputClass} min-h-[78px] resize-y`}
                      />
                    </Field>
                  </div>
                </div>

                {error && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </div>
                )}

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={
                      newWorkItem
                    }
                    disabled={
                      formDisabled
                    }
                    className="rounded-lg border px-4 py-2 text-sm"
                  >
                    Clear
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving ||
                      formDisabled
                    }
                    className="rounded-lg bg-[#1d2228] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                  >
                    {saving
                      ? "Saving..."
                      : mode ===
                          "edit"
                        ? "Save Changes"
                        : "Add Work"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {showAddCustomer && (
        <AddCustomerModal
          onClose={() =>
            setShowAddCustomer(
              false
            )
          }
          onCreated={
            handleCustomerCreated
          }
        />
      )}
    </>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function formatCategory(
  category?:
    string
) {
  const value =
    String(
      category ??
        ""
    )
      .trim()
      .toLowerCase();

  if (
    value ===
    "self-owned"
  ) {
    return "Self-owned";
  }

  if (
    value ===
    "vip"
  ) {
    return "VIP";
  }

  if (
    value ===
    "general"
  ) {
    return "General";
  }

  return (
    category ||
    "Customer"
  );
}

const inputClass =
  "h-[36px] w-full min-w-0 rounded-lg border border-[#d8dce1] bg-white px-2.5 text-sm outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a] disabled:bg-gray-50 disabled:text-gray-400";

const lockedClass =
  "flex h-[36px] items-center rounded-lg border border-[#d8dce1] bg-[#f5f6f8] px-2.5 text-sm";

function Field({
  label,
  required = false,
  children,
}: {
  label:
    string;

  required?:
    boolean;

  children:
    React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}