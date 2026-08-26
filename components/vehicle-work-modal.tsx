"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Vehicle,
  WorkItem,
} from "@/lib/mock-data";

type Mode = "create" | "edit";

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
  /*
   * Vehicles with ownership status
   * Wishlist must not appear in the
   * Work page vehicle selector.
   */
  const selectableVehicles =
    useMemo(
      () =>
        vehicles.filter(
          (item) =>
            String(
              item.ownershipStatus ||
                ""
            ).toLowerCase() !==
            "wishlist"
        ),
      [vehicles]
    );

  const [items, setItems] =
    useState<WorkItem[]>([]);

  const [mode, setMode] =
    useState<Mode>("create");

  /*
   * Vehicle ID is the source of truth.
   *
   * Vehicle-specific popup:
   *   vehicle.id is automatically selected.
   *
   * Work page popup:
   *   starts blank and user selects vehicle.
   */
  const [
    selectedVehicleId,
    setSelectedVehicleId,
  ] = useState(
    vehicle?.id
      ? String(vehicle.id)
      : ""
  );

  /*
   * Find selected vehicle.
   *
   * If popup was opened from a vehicle
   * card, use that supplied vehicle.
   *
   * Otherwise only search selectable
   * non-Wishlist vehicles.
   */
  const selectedVehicle =
    vehicle ??
    selectableVehicles.find(
      (item) =>
        String(item.id) ===
        String(selectedVehicleId)
    ) ??
    null;

  const [form, setForm] =
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

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * If supplied vehicle changes,
   * keep selected ID synced.
   */
  useEffect(() => {
    if (!vehicle?.id) {
      return;
    }

    setSelectedVehicleId(
      String(vehicle.id)
    );
  }, [vehicle?.id]);

  /*
   * LOAD WORK ITEMS WHEN VEHICLE CHANGES
   */

  useEffect(() => {
    if (!selectedVehicleId) {
      setItems([]);
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

  /*
   * ESCAPE CLOSE
   */

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
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
  }, [onClose]);

  /*
   * LOAD VEHICLE WORK ITEMS
   */

  async function loadWorkItems(
    vehicleId: string,
    openInitial = false
  ) {
    if (!vehicleId) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/vehicles/${encodeURIComponent(
          vehicleId
        )}/work-items`,
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to load work items"
        );
      }

      const loadedItems =
        Array.isArray(result)
          ? (result as WorkItem[])
          : [];

      setItems(
        loadedItems
      );

      /*
       * If Work page Edit was clicked,
       * automatically open that item.
       */
      if (
        openInitial &&
        initialWorkItemId
      ) {
        const selected =
          loadedItems.find(
            (item) =>
              String(item.id) ===
              String(
                initialWorkItemId
              )
          );

        if (selected) {
          fillEditForm(
            selected
          );
        }
      }
    } catch (err) {
      console.error(
        "Load work items error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load work items"
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * VEHICLE SELECT
   */

  function handleVehicleChange(
    vehicleId: string
  ) {
    const nextVehicleId =
      String(vehicleId);

    setSelectedVehicleId(
      nextVehicleId
    );

    setMode("create");
    setError("");

    /*
     * No vehicle selected.
     */
    if (!nextVehicleId) {
      setItems([]);

      setForm({
        ...emptyForm,
      });

      return;
    }

    /*
     * Only allow vehicles from the
     * non-Wishlist selectable list.
     */
    const selected =
      selectableVehicles.find(
        (item) =>
          String(item.id) ===
          nextVehicleId
      );

    /*
     * Extra safety in case an invalid /
     * Wishlist vehicle ID somehow reaches
     * the change handler.
     */
    if (!selected) {
      setSelectedVehicleId("");
      setItems([]);

      setForm({
        ...emptyForm,
      });

      setError(
        "This vehicle is not available for workshop work."
      );

      return;
    }

    /*
     * Start fresh Add form
     * for selected vehicle.
     */
    setForm({
      ...emptyForm,

      odometer:
        selected?.odometer !==
          undefined &&
        selected?.odometer !==
          null
          ? String(
              selected.odometer
            )
          : "",
    });

    /*
     * Work items are loaded by
     * selectedVehicleId useEffect.
     */
  }

  /*
   * NEW WORK
   */

  function newWorkItem() {
    setMode("create");
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

  /*
   * EDIT WORK
   */

  function fillEditForm(
    item: WorkItem
  ) {
    setForm({
      id: item.id,

      title:
        item.title ?? "",

      category:
        item.category ?? "",

      priority:
        String(
          item.priority ?? 3
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
        item.notes ?? "",
    });

    setMode("edit");
    setError("");
  }

  /*
   * UPDATE FORM FIELD
   */

  function updateField(
    field: keyof WorkForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /*
   * SAVE
   */

  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !selectedVehicleId ||
      !selectedVehicle
    ) {
      setError(
        "Select a vehicle first."
      );
      return;
    }

    if (!form.title.trim()) {
      setError(
        "Work title is required."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/vehicles/${encodeURIComponent(
          selectedVehicleId
        )}/work-items`,
        {
          method:
            mode === "edit"
              ? "PATCH"
              : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            ...form,

            vehicle:
              selectedVehicleId,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to save work item"
        );
      }

      /*
       * Reload left list.
       */
      await loadWorkItems(
        selectedVehicleId,
        false
      );

      /*
       * Keep saved item open
       * in Edit mode.
       */
      fillEditForm(
        result
      );

      /*
       * Notify parent Work page
       * so table can refresh.
       */
      onChanged?.();
    } catch (err) {
      console.error(
        "Save work item error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save work item"
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * If popup came from vehicle card
   * or we're editing an existing item,
   * don't allow vehicle to be changed.
   */
  const vehicleLocked =
    Boolean(vehicle) ||
    mode === "edit";

  /*
   * Form controls enabled only
   * after a vehicle is selected.
   */
  const formDisabled =
    !selectedVehicleId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-[#f5f6f8] shadow-2xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-[#dfe2e6] bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold">
              Work Items
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {selectedVehicle
                ? `${selectedVehicle.name} · ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`
                : "Select a vehicle and add a work item"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8dce1] bg-white text-xl text-gray-500 hover:bg-gray-50 hover:text-black"
            aria-label="Close work items"
          >
            ×
          </button>
        </div>

        {/* BODY */}

        <div className="grid min-h-0 flex-1 lg:grid-cols-[340px_1fr]">
          {/* LEFT COLUMN */}

          <aside className="overflow-y-auto border-r border-[#dfe2e6] bg-white p-4">
            <button
              type="button"
              onClick={newWorkItem}
              disabled={
                formDisabled
              }
              className="mb-4 w-full rounded-lg bg-[#1d2228] px-4 py-2.5 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              + Add Work
            </button>

            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Work Items
              </span>

              <span className="text-xs text-gray-400">
                {items.length}
              </span>
            </div>

            {!selectedVehicleId ? (
              <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                Select a vehicle to view its work items.
              </div>
            ) : loading ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Loading work items...
              </div>
            ) : items.length ===
              0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                No work items yet.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map(
                  (item) => {
                    const selected =
                      mode ===
                        "edit" &&
                      String(
                        item.id
                      ) ===
                        String(
                          form.id
                        );

                    return (
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
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          selected
                            ? "border-[#1d2228] bg-[#f5f6f8]"
                            : "border-[#e2e4e7] bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                              {
                                item.title
                              }
                            </div>

                            <div className="mt-1 text-xs text-gray-500">
                              {item.category ||
                                "General"}
                            </div>
                          </div>

                          <PriorityBadge
                            priority={
                              item.priority ??
                              3
                            }
                          />
                        </div>

                        <div className="mt-3">
                          <StatusBadge
                            status={
                              item.status ||
                              "Planned"
                            }
                          />
                        </div>

                        {item.targetDate && (
                          <div className="mt-2 text-xs text-gray-400">
                            Target:{" "}
                            {
                              item.targetDate
                            }
                          </div>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </aside>

          {/* RIGHT COLUMN */}

          <div className="overflow-y-auto p-5">
            <form
              onSubmit={
                handleSave
              }
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {mode ===
                    "edit"
                      ? "Edit Work"
                      : "Add Work"}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {mode ===
                    "edit"
                      ? "View or update this work item."
                      : "Create a new work item."}
                  </p>
                </div>

                {mode ===
                  "edit" && (
                  <button
                    type="button"
                    onClick={
                      newWorkItem
                    }
                    className="rounded-lg border border-[#d8dce1] bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    + New
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* VEHICLE */}

                <div className="md:col-span-2">
                  <Field
                    label="Vehicle"
                    required
                  >
                    {vehicleLocked ? (
                      <div className="rounded-lg border border-[#d8dce1] bg-[#f5f6f8] px-3 py-2.5 text-sm">
                        {selectedVehicle
                          ? `${selectedVehicle.name} — ${selectedVehicle.year} ${selectedVehicle.make}`
                          : "Unknown vehicle"}
                      </div>
                    ) : (
                      <select
                        value={
                          selectedVehicleId
                        }
                        onChange={(e) =>
                          handleVehicleChange(
                            e.target.value
                          )
                        }
                        className={
                          inputClass
                        }
                      >
                        <option value="">
                          Select vehicle...
                        </option>

                        {selectableVehicles
                          .slice()
                          .sort(
                            (
                              a,
                              b
                            ) =>
                              a.name.localeCompare(
                                b.name
                              )
                          )
                          .map(
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
                                {
                                  item.name
                                }{" "}
                                —{" "}
                                {
                                  item.year
                                }{" "}
                                {
                                  item.make
                                }
                              </option>
                            )
                          )}
                      </select>
                    )}
                  </Field>
                </div>

                {/* TITLE */}

                <div className="md:col-span-2">
                  <Field
                    label="Work Title"
                    required
                  >
                    <input
                      value={
                        form.title
                      }
                      onChange={(e) =>
                        updateField(
                          "title",
                          e.target.value
                        )
                      }
                      disabled={
                        formDisabled
                      }
                      placeholder="Replace rear cylinder and piston"
                      className={
                        inputClass
                      }
                    />
                  </Field>
                </div>

                {/* CATEGORY */}

                <Field label="Category">
                  <input
                    value={
                      form.category
                    }
                    onChange={(e) =>
                      updateField(
                        "category",
                        e.target.value
                      )
                    }
                    disabled={
                      formDisabled
                    }
                    list="work-category-options"
                    placeholder="Engine"
                    className={
                      inputClass
                    }
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

                {/* STATUS */}

                <Field label="Status">
                  <select
                    value={
                      form.status
                    }
                    disabled={
                      formDisabled
                    }
                    onChange={(e) =>
                      updateField(
                        "status",
                        e.target.value
                      )
                    }
                    className={
                      inputClass
                    }
                  >
                    <option value="Idea">
                      Idea
                    </option>

                    <option value="Planned">
                      Planned
                    </option>

                    <option value="Parts Required">
                      Parts Required
                    </option>

                    <option value="Parts Ordered">
                      Parts Ordered
                    </option>

                    <option value="Ready">
                      Ready
                    </option>

                    <option value="In Progress">
                      In Progress
                    </option>

                    <option value="On Hold">
                      On Hold
                    </option>

                    <option value="Completed">
                      Completed
                    </option>

                    <option value="Cancelled">
                      Cancelled
                    </option>
                  </select>
                </Field>

                {/* PRIORITY */}

                <Field label="Priority">
                  <select
                    value={
                      form.priority
                    }
                    disabled={
                      formDisabled
                    }
                    onChange={(e) =>
                      updateField(
                        "priority",
                        e.target.value
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

                {/* ODOMETER */}

                <Field label="Odometer">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={
                        form.odometer
                      }
                      disabled={
                        formDisabled
                      }
                      onChange={(e) =>
                        updateField(
                          "odometer",
                          e.target.value
                        )
                      }
                      className={
                        inputClass
                      }
                    />

                    <span className="shrink-0 text-sm text-gray-500">
                      {selectedVehicle
                        ?.odometerUnit ||
                        "km"}
                    </span>
                  </div>
                </Field>

                {/* TARGET */}

                <Field label="Target Date">
                  <input
                    type="date"
                    value={
                      form.target_date
                    }
                    disabled={
                      formDisabled
                    }
                    onChange={(e) =>
                      updateField(
                        "target_date",
                        e.target.value
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </Field>

                {/* STARTED */}

                <Field label="Started Date">
                  <input
                    type="date"
                    value={
                      form.started_date
                    }
                    disabled={
                      formDisabled
                    }
                    onChange={(e) =>
                      updateField(
                        "started_date",
                        e.target.value
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </Field>

                {/* COMPLETED */}

                <Field label="Completed Date">
                  <input
                    type="date"
                    value={
                      form.completed_date
                    }
                    disabled={
                      formDisabled
                    }
                    onChange={(e) =>
                      updateField(
                        "completed_date",
                        e.target.value
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </Field>

                {/* COST */}

                <Field label="Estimated Cost">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.estimated_cost
                    }
                    disabled={
                      formDisabled
                    }
                    onChange={(e) =>
                      updateField(
                        "estimated_cost",
                        e.target.value
                      )
                    }
                    placeholder="0"
                    className={
                      inputClass
                    }
                  />
                </Field>

                {/* DESCRIPTION */}

                <div className="md:col-span-2">
                  <Field label="Work Description">
                    <textarea
                      rows={5}
                      value={
                        form.work_description
                      }
                      disabled={
                        formDisabled
                      }
                      onChange={(e) =>
                        updateField(
                          "work_description",
                          e.target.value
                        )
                      }
                      placeholder="Problem, diagnosis and planned work..."
                      className={`${inputClass} resize-y`}
                    />
                  </Field>
                </div>

                {/* NOTES */}

                <div className="md:col-span-2">
                  <Field label="Notes">
                    <textarea
                      rows={3}
                      value={
                        form.notes
                      }
                      disabled={
                        formDisabled
                      }
                      onChange={(e) =>
                        updateField(
                          "notes",
                          e.target.value
                        )
                      }
                      placeholder="Workshop notes..."
                      className={`${inputClass} resize-y`}
                    />
                  </Field>
                </div>
              </div>

              {/* ERROR */}

              {error && (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* ACTIONS */}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={
                    newWorkItem
                  }
                  disabled={
                    formDisabled
                  }
                  className="rounded-lg border border-[#d8dce1] bg-white px-5 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {mode ===
                  "edit"
                    ? "Cancel Edit"
                    : "Clear"}
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    formDisabled
                  }
                  className="rounded-lg bg-[#1d2228] px-5 py-2.5 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
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
  );
}

/*
 * INPUT
 */

const inputClass =
  "w-full rounded-lg border border-[#d8dce1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a] disabled:bg-gray-50 disabled:text-gray-400";

/*
 * FIELD
 */

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children:
    React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
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

/*
 * PRIORITY
 */

function PriorityBadge({
  priority,
}: {
  priority: number;
}) {
  const styles: Record<
    number,
    string
  > = {
    1: "bg-red-100 text-red-700",
    2: "bg-orange-100 text-orange-700",
    3: "bg-gray-100 text-gray-600",
    4: "bg-gray-50 text-gray-400",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
        styles[priority] ||
        styles[3]
      }`}
    >
      P{priority}
    </span>
  );
}

/*
 * STATUS
 */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<
    string,
    string
  > = {
    Idea:
      "bg-gray-100 text-gray-600",

    Planned:
      "bg-blue-100 text-blue-700",

    "Parts Required":
      "bg-orange-100 text-orange-700",

    "Parts Ordered":
      "bg-yellow-100 text-yellow-700",

    Ready:
      "bg-cyan-100 text-cyan-700",

    "In Progress":
      "bg-purple-100 text-purple-700",

    "On Hold":
      "bg-gray-100 text-gray-600",

    Completed:
      "bg-green-100 text-green-700",

    Cancelled:
      "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] ||
        "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}