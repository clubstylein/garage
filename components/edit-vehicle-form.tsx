"use client";

import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  SpecTemplate,
  SpecificationRow,
  Vehicle,
  VehicleCustomer,
} from "@/lib/mock-data";

export default function EditVehicleForm({
  vehicle,
  initialSpecifications,
  templates,
  customers,
}: {
  vehicle: Vehicle;

  initialSpecifications:
    SpecificationRow[];

  templates:
    SpecTemplate[];

  customers:
    VehicleCustomer[];
}) {
  const router =
    useRouter();

  /* =======================================================
     OWNERSHIP / CUSTOMER
     ======================================================= */

  const [
    ownershipStatus,
    setOwnershipStatus,
  ] =
    useState<
      "Owned" |
      "Wishlist"
    >(
      vehicle.ownershipStatus ===
        "Wishlist"
        ? "Wishlist"
        : "Owned"
    );

  const clubStyleCustomer =
    useMemo(
      () => {
        return (
          customers.find(
            (
              customer
            ) =>
              String(
                customer.customerCode ??
                  ""
              )
                .trim()
                .toUpperCase() ===
              "CLUBSTYLE"
          ) ??
          customers.find(
            (
              customer
            ) =>
              String(
                customer.category ??
                  ""
              )
                .trim()
                .toLowerCase() ===
              "self-owned"
          ) ??
          null
        );
      },
      [
        customers,
      ]
    );

  const [
    customerId,
    setCustomerId,
  ] =
    useState(
      vehicle.ownershipStatus ===
        "Wishlist"
        ? ""
        : vehicle.customerId ??
          vehicle.customer?.id ??
          clubStyleCustomer?.id ??
          ""
    );

  const sortedCustomers =
    useMemo(
      () => {
        const categoryOrder: Record<
          string,
          number
        > = {
          "self-owned": 1,
          vip: 2,
          general: 3,
        };

        return [
          ...customers,
        ].sort(
          (
            a,
            b
          ) => {
            const categoryA =
              String(
                a.category ??
                  ""
              )
                .trim()
                .toLowerCase();

            const categoryB =
              String(
                b.category ??
                  ""
              )
                .trim()
                .toLowerCase();

            const orderA =
              categoryOrder[
                categoryA
              ] ??
              99;

            const orderB =
              categoryOrder[
                categoryB
              ] ??
              99;

            if (
              orderA !==
              orderB
            ) {
              return (
                orderA -
                orderB
              );
            }

            return a.name.localeCompare(
              b.name
            );
          }
        );
      },
      [
        customers,
      ]
    );

  const selectedCustomer =
    useMemo(
      () => {
        return (
          customers.find(
            (
              customer
            ) =>
              String(
                customer.id
              ) ===
              String(
                customerId
              )
          ) ??
          null
        );
      },
      [
        customers,
        customerId,
      ]
    );

  /* =======================================================
     SPECIFICATIONS
     ======================================================= */

  const [
    selectedTemplate,
    setSelectedTemplate,
  ] =
    useState("");

  const [
    specifications,
    setSpecifications,
  ] =
    useState<
      SpecificationRow[]
    >(
      initialSpecifications.map(
        (
          item
        ) => ({
          ...item,
        })
      )
    );

  /* =======================================================
     IMAGE
     ======================================================= */

  const [
    coverImage,
    setCoverImage,
  ] =
    useState<
      File | null
    >(null);

  const [
    coverPreview,
    setCoverPreview,
  ] =
    useState("");

  const [
    removeExistingImage,
    setRemoveExistingImage,
  ] =
    useState(false);

  /* =======================================================
     FORM
     ======================================================= */

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

  const displayedImage =
    coverPreview ||
    (!removeExistingImage
      ? vehicle.coverImage
      : undefined);

  /* =======================================================
     CLEAN IMAGE PREVIEW
     ======================================================= */

  useEffect(
    () => {
      return () => {
        if (
          coverPreview
        ) {
          URL.revokeObjectURL(
            coverPreview
          );
        }
      };
    },
    [
      coverPreview,
    ]
  );

  /* =======================================================
     OWNERSHIP CHANGE
     ======================================================= */

  function handleOwnershipChange(
    value:
      | "Owned"
      | "Wishlist"
  ) {
    setOwnershipStatus(
      value
    );

    /*
     * Wishlist vehicles do not
     * have a customer.
     */

    if (
      value ===
      "Wishlist"
    ) {
      setCustomerId(
        ""
      );

      return;
    }

    /*
     * If switching back from
     * Wishlist to garage vehicle,
     * default to ClubStyle.
     */

    if (
      !customerId &&
      clubStyleCustomer
    ) {
      setCustomerId(
        clubStyleCustomer.id
      );
    }
  }

  /* =======================================================
     SAVE
     ======================================================= */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(
      true
    );

    setError("");

    try {
      /*
       * Every non-Wishlist vehicle
       * must have a customer.
       */

      if (
        ownershipStatus !==
          "Wishlist" &&
        !customerId
      ) {
        throw new Error(
          "Please select a customer."
        );
      }

      const form =
        new FormData(
          event.currentTarget
        );

      let coverImageId:
        | string
        | null
        | undefined =
        vehicle.coverImageId;

      /*
       * Upload replacement image first.
       */

      if (
        coverImage
      ) {
        const imageForm =
          new FormData();

        imageForm.append(
          "file",
          coverImage
        );

        imageForm.append(
          "title",
          `${
            form.get(
              "name"
            ) ||
            vehicle.name
          } Cover Image`
        );

        const uploadResponse =
          await fetch(
            "/api/files",
            {
              method:
                "POST",

              body:
                imageForm,
            }
          );

        let uploadResult;

        try {
          uploadResult =
            await uploadResponse.json();
        } catch {
          throw new Error(
            "Invalid response while uploading vehicle image."
          );
        }

        if (
          !uploadResponse.ok
        ) {
          throw new Error(
            uploadResult?.error ||
              "Unable to upload vehicle image"
          );
        }

        if (
          !uploadResult?.id
        ) {
          throw new Error(
            "Vehicle image uploaded but no file ID was returned."
          );
        }

        coverImageId =
          String(
            uploadResult.id
          );
      } else if (
        removeExistingImage
      ) {
        coverImageId =
          null;
      }

      /*
       * Build payload.
       */

      const data = {
        ...Object.fromEntries(
          form.entries()
        ),

        ownership_status:
          ownershipStatus,

        customer:
          ownershipStatus ===
          "Wishlist"
            ? null
            : customerId,

        cover_image:
          coverImageId ??
          null,

        specifications:
          specifications.filter(
            (
              item
            ) =>
              item.specification
                .trim() !==
                "" &&
              item.value
                .trim() !==
                ""
          ),
      };

      /*
       * Save vehicle.
       */

      const response =
        await fetch(
          `/api/vehicles/${vehicle.id}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                data
              ),
          }
        );

      let result;

      try {
        result =
          await response.json();
      } catch {
        throw new Error(
          "Invalid response while updating vehicle."
        );
      }

      if (
        !response.ok
      ) {
        throw new Error(
          result?.error ||
            "Unable to update vehicle"
        );
      }

      router.push(
        `/vehicles/${vehicle.id}`
      );

      router.refresh();
    } catch (
      err
    ) {
      console.error(
        "Edit vehicle error:",
        err
      );

      setError(
        err instanceof
          Error
          ? err.message
          : "Unable to update vehicle"
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     IMAGE
     ======================================================= */

  function handleCoverImage(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (
      !file
    ) {
      return;
    }

    const allowedTypes =
      [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setError(
        "Only JPG, PNG and WebP images are supported."
      );

      return;
    }

    const maxSize =
      10 *
      1024 *
      1024;

    if (
      file.size >
      maxSize
    ) {
      setError(
        "Vehicle image must be smaller than 10 MB."
      );

      return;
    }

    setError("");

    if (
      coverPreview
    ) {
      URL.revokeObjectURL(
        coverPreview
      );
    }

    setRemoveExistingImage(
      false
    );

    setCoverImage(
      file
    );

    setCoverPreview(
      URL.createObjectURL(
        file
      )
    );
  }

  function removeCoverImage() {
    if (
      coverPreview
    ) {
      URL.revokeObjectURL(
        coverPreview
      );
    }

    setCoverImage(
      null
    );

    setCoverPreview(
      ""
    );

    setRemoveExistingImage(
      true
    );
  }

  /* =======================================================
     SPECIFICATIONS
     ======================================================= */

  function applyTemplate() {
    const template =
      templates.find(
        (
          item
        ) =>
          String(
            item.id
          ) ===
          String(
            selectedTemplate
          )
      );

    if (
      !template
    ) {
      setError(
        "Specification template could not be found."
      );

      return;
    }

    if (
      !template.items ||
      template.items
        .length ===
        0
    ) {
      setError(
        `The "${template.name}" template does not contain any specification items.`
      );

      return;
    }

    setError("");

    /*
     * Edit mode merges template
     * fields instead of wiping
     * existing values.
     */

    setSpecifications(
      (
        current
      ) => {
        const updated =
          [
            ...current,
          ];

        template.items.forEach(
          (
            templateItem
          ) => {
            const alreadyExists =
              updated.some(
                (
                  existing
                ) =>
                  existing.category
                    .trim()
                    .toLowerCase() ===
                    (
                      templateItem.category ||
                      ""
                    )
                      .trim()
                      .toLowerCase() &&
                  existing.specification
                    .trim()
                    .toLowerCase() ===
                    (
                      templateItem.specification ||
                      ""
                    )
                      .trim()
                      .toLowerCase()
              );

            if (
              !alreadyExists
            ) {
              updated.push(
                {
                  category:
                    templateItem.category ||
                    "",

                  specification:
                    templateItem.specification ||
                    "",

                  value:
                    "",

                  unit:
                    templateItem.defaultUnit ??
                    "",

                  notes:
                    "",

                  sort:
                    templateItem.sort ??
                    updated.length +
                      1,
                }
              );
            }
          }
        );

        return updated;
      }
    );
  }

  function addSpecification() {
    setSpecifications(
      (
        current
      ) => [
        ...current,

        {
          category:
            "",

          specification:
            "",

          value:
            "",

          unit:
            "",

          notes:
            "",

          sort:
            current.length +
            1,
        },
      ]
    );
  }

  function removeSpecification(
    index:
      number
  ) {
    setSpecifications(
      (
        current
      ) =>
        current.filter(
          (
            _,
            i
          ) =>
            i !==
            index
        )
    );
  }

  function updateSpecification(
    index:
      number,

    field:
      keyof SpecificationRow,

    value:
      string
  ) {
    setSpecifications(
      (
        current
      ) =>
        current.map(
          (
            item,
            i
          ) =>
            i ===
            index
              ? {
                  ...item,

                  [field]:
                    value,
                }
              : item
        )
    );
  }

  /* =======================================================
     UI
     ======================================================= */

  return (
    <form
      onSubmit={
        handleSubmit
      }
    >
      <div className="grid gap-5 xl:grid-cols-3">
        {/* =================================================
            VEHICLE IMAGE
            ================================================= */}

        <FormCard title="Vehicle Image">
          <div className="overflow-hidden rounded-xl border border-[#e0e3e7] bg-[#f5f6f8]">
            {displayedImage ? (
              <img
                src={
                  displayedImage
                }
                alt={
                  vehicle.name
                }
                className="h-52 w-full object-cover"
              />
            ) : (
              <div className="flex h-52 items-center justify-center text-sm text-gray-400">
                No vehicle image
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Replace Image
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={
                handleCoverImage
              }
              disabled={
                saving
              }
              className="block w-full cursor-pointer rounded-lg border border-[#d8dce1] bg-white px-3 py-2.5 text-sm text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <p className="mt-2 text-xs text-gray-400">
              JPG, PNG or WebP. Maximum 10 MB.
            </p>

            {coverImage && (
              <p className="mt-2 truncate text-xs text-gray-500">
                {
                  coverImage.name
                }
              </p>
            )}
          </div>

          {displayedImage && (
            <button
              type="button"
              onClick={
                removeCoverImage
              }
              disabled={
                saving
              }
              className="text-left text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Remove Image
            </button>
          )}
        </FormCard>

        {/* =================================================
            VEHICLE
            ================================================= */}

        <FormCard title="Vehicle">
          <Field
            label="Vehicle Name"
            required
          >
            <input
              name="name"
              required
              defaultValue={
                vehicle.name
              }
              className={
                inputClass
              }
            />
          </Field>

          <Field label="Asset Type">
            <select
              name="asset_type"
              defaultValue={
                vehicle.assetType ||
                "Motorcycle"
              }
              className={
                inputClass
              }
            >
              <option>
                Motorcycle
              </option>

              <option>
                Car
              </option>

              <option>
                ATV
              </option>

              <option>
                Engine
              </option>

              <option>
                Other
              </option>
            </select>
          </Field>

          {/* OWNERSHIP */}

          <Field
            label="Ownership"
            required
          >
            <select
              value={
                ownershipStatus
              }
              onChange={(
                event
              ) =>
                handleOwnershipChange(
                  event
                    .target
                    .value as
                    | "Owned"
                    | "Wishlist"
                )
              }
              className={
                inputClass
              }
            >
              <option value="Owned">
                Garage Vehicle
              </option>

              <option value="Wishlist">
                Wishlist
              </option>
            </select>
          </Field>

          {/* CUSTOMER */}

          <Field
            label="Customer"
            required={
              ownershipStatus !==
              "Wishlist"
            }
          >
            <select
              value={
                customerId
              }
              onChange={(
                event
              ) =>
                setCustomerId(
                  event
                    .target
                    .value
                )
              }
              disabled={
                ownershipStatus ===
                "Wishlist"
              }
              className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-400`}
            >
              <option value="">
                {ownershipStatus ===
                "Wishlist"
                  ? "Not applicable"
                  : "Select customer..."}
              </option>

              {sortedCustomers.map(
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
                    {
                      customer.name
                    }
                    {" — "}
                    {formatCategory(
                      customer.category
                    )}
                  </option>
                )
              )}
            </select>
          </Field>

          {selectedCustomer &&
            ownershipStatus !==
              "Wishlist" && (
              <div className="rounded-lg border border-[#e1e4e8] bg-[#f8f9fa] px-3 py-3">
                <div className="text-sm font-medium">
                  {
                    selectedCustomer.name
                  }
                </div>

                <div className="mt-1 text-xs text-gray-500">
                  {formatCategory(
                    selectedCustomer.category
                  )}

                  {selectedCustomer.phone
                    ? ` · ${selectedCustomer.phone}`
                    : ""}
                </div>
              </div>
            )}

          <Field
            label="Make"
            required
          >
            <input
              name="make"
              required
              defaultValue={
                vehicle.make
              }
              className={
                inputClass
              }
            />
          </Field>

          <Field
            label="Model"
            required
          >
            <input
              name="model"
              required
              defaultValue={
                vehicle.model
              }
              className={
                inputClass
              }
            />
          </Field>

          <Field label="Variant">
            <input
              name="variant"
              defaultValue={
                vehicle.variant ||
                ""
              }
              className={
                inputClass
              }
            />
          </Field>

          <Field
            label="Year"
            required
          >
            <input
              name="year"
              type="number"
              required
              min="1900"
              max="2100"
              defaultValue={
                vehicle.year
              }
              className={
                inputClass
              }
            />
          </Field>
        </FormCard>

        {/* =================================================
            STATUS
            ================================================= */}

        <FormCard title="Status & Location">
          <Field label="Status">
            <select
              name="status"
              defaultValue={
                vehicle.status ||
                "Running"
              }
              className={
                inputClass
              }
            >
              <option>
                Running
              </option>

              <option>
                Repair
              </option>

              <option>
                Custom Project
              </option>

              <option>
                For Parts
              </option>

              <option>
                Stored
              </option>

              <option>
                Sold
              </option>
            </select>
          </Field>

          <Field label="Location">
            <input
              name="location"
              defaultValue={
                vehicle.location ||
                ""
              }
              className={
                inputClass
              }
            />
          </Field>

          <Field label="Odometer">
            <input
              name="odometer"
              type="number"
              min="0"
              defaultValue={
                vehicle.odometer
              }
              className={
                inputClass
              }
            />
          </Field>

          <Field label="Odometer Unit">
            <select
              name="odometer_unit"
              defaultValue={
                vehicle.odometerUnit ||
                "km"
              }
              className={
                inputClass
              }
            >
              <option value="km">
                km
              </option>

              <option value="mi">
                miles
              </option>
            </select>
          </Field>

          <Field label="Registration Number">
            <input
              name="registration_number"
              defaultValue={
                vehicle.registrationNumber ||
                ""
              }
              className={
                inputClass
              }
            />
          </Field>

          <Field label="VIN">
            <input
              name="vin"
              defaultValue={
                vehicle.vin ||
                ""
              }
              className={
                inputClass
              }
            />
          </Field>
        </FormCard>

        {/* =================================================
            ENGINE
            ================================================= */}

        <FormCard title="Engine">
          <Field label="Engine Platform">
            <input
              name="engine_platform"
              defaultValue={
                vehicle.engine ||
                ""
              }
              className={
                inputClass
              }
            />
          </Field>

          <Field label="Engine Capacity (cc)">
            <input
              name="engine_cc"
              type="number"
              min="0"
              defaultValue={
                vehicle.engineCc ||
                ""
              }
              className={
                inputClass
              }
            />
          </Field>

          <Field label="Engine Number">
            <input
              name="engine_number"
              defaultValue={
                vehicle.engineNumber ||
                ""
              }
              className={
                inputClass
              }
            />
          </Field>
        </FormCard>

        {/* =================================================
            OWNERSHIP DETAILS
            ================================================= */}

        <FormCard title="Ownership Details">
          <Field label="Purchase Date">
            <input
              name="purchase_date"
              type="date"
              defaultValue={
                vehicle.purchaseDate ||
                ""
              }
              className={
                inputClass
              }
            />
          </Field>

          <Field label="Purchase Price">
            <input
              name="purchase_price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={
                vehicle.purchasePrice ||
                ""
              }
              className={
                inputClass
              }
            />
          </Field>

          <Field label="Currency">
            <select
              name="currency"
              defaultValue={
                vehicle.currency ||
                "INR"
              }
              className={
                inputClass
              }
            >
              <option value="INR">
                INR
              </option>

              <option value="AED">
                AED
              </option>

              <option value="USD">
                USD
              </option>
            </select>
          </Field>
        </FormCard>

        {/* =================================================
            NOTES
            ================================================= */}

        <div className="xl:col-span-2">
          <FormCard title="Notes">
            <textarea
              name="notes"
              rows={
                7
              }
              defaultValue={
                vehicle.notes ||
                ""
              }
              placeholder="General vehicle notes..."
              className={`${inputClass} resize-y`}
            />
          </FormCard>
        </div>

        {/* =================================================
            SPECIFICATIONS
            ================================================= */}

        <div className="xl:col-span-2">
          <FormCard title="Specifications">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-72 flex-1">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Add From Template
                </label>

                <select
                  value={
                    selectedTemplate
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedTemplate(
                      event
                        .target
                        .value
                    )
                  }
                  className={
                    inputClass
                  }
                >
                  <option value="">
                    Select template...
                  </option>

                  {templates.map(
                    (
                      template
                    ) => (
                      <option
                        key={
                          template.id
                        }
                        value={
                          template.id
                        }
                      >
                        {
                          template.name
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <button
                type="button"
                onClick={
                  applyTemplate
                }
                disabled={
                  !selectedTemplate ||
                  saving
                }
                className="rounded-lg border border-[#d8dce1] bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add Template Fields
              </button>

              <button
                type="button"
                onClick={
                  addSpecification
                }
                disabled={
                  saving
                }
                className="rounded-lg border border-[#d8dce1] bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                + Add Specification
              </button>
            </div>

            {specifications.length >
            0 ? (
              <div className="mt-5">
                <div className="mb-2 hidden gap-2 px-3 text-xs font-medium uppercase tracking-wide text-gray-400 md:grid md:grid-cols-[1fr_1.4fr_1.4fr_0.6fr_auto]">
                  <div>
                    Category
                  </div>

                  <div>
                    Specification
                  </div>

                  <div>
                    Value
                  </div>

                  <div>
                    Unit
                  </div>

                  <div />
                </div>

                <div className="space-y-2">
                  {specifications.map(
                    (
                      spec,
                      index
                    ) => (
                      <div
                        key={
                          index
                        }
                        className="grid gap-2 rounded-lg border border-[#e5e7ea] bg-[#fafafa] p-3 md:grid-cols-[1fr_1.4fr_1.4fr_0.6fr_auto]"
                      >
                        <input
                          value={
                            spec.category
                          }
                          onChange={(
                            event
                          ) =>
                            updateSpecification(
                              index,
                              "category",
                              event
                                .target
                                .value
                            )
                          }
                          placeholder="Category"
                          className={
                            inputClass
                          }
                        />

                        <input
                          value={
                            spec.specification
                          }
                          onChange={(
                            event
                          ) =>
                            updateSpecification(
                              index,
                              "specification",
                              event
                                .target
                                .value
                            )
                          }
                          placeholder="Specification"
                          className={
                            inputClass
                          }
                        />

                        <input
                          value={
                            spec.value
                          }
                          onChange={(
                            event
                          ) =>
                            updateSpecification(
                              index,
                              "value",
                              event
                                .target
                                .value
                            )
                          }
                          placeholder="Value"
                          className={
                            inputClass
                          }
                        />

                        <input
                          value={
                            spec.unit ??
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            updateSpecification(
                              index,
                              "unit",
                              event
                                .target
                                .value
                            )
                          }
                          placeholder="Unit"
                          className={
                            inputClass
                          }
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeSpecification(
                              index
                            )
                          }
                          disabled={
                            saving
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500">
                No specifications have been added.
              </div>
            )}
          </FormCard>
        </div>
      </div>

      {/* ===================================================
          ERROR
          =================================================== */}

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ===================================================
          ACTIONS
          =================================================== */}

      <div className="mt-6 flex justify-end gap-3">
        <Link
          href={`/vehicles/${vehicle.id}`}
          className="rounded-lg border border-[#d8dce1] bg-white px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={
            saving
          }
          className="rounded-lg bg-[#1d2228] px-5 py-2.5 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? coverImage
              ? "Uploading & Saving..."
              : "Saving..."
            : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

/* =========================================================
   CUSTOMER CATEGORY LABEL
   ========================================================= */

function formatCategory(
  category:
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

  return category;
}

/* =========================================================
   COMMON FORM STYLES
   ========================================================= */

const inputClass =
  "w-full rounded-lg border border-[#d8dce1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";

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
    ReactNode;
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

function FormCard({
  title,
  children,
}: {
  title:
    string;

  children:
    ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#e0e3e7] bg-white p-5">
      <h2 className="mb-5 font-semibold">
        {title}
      </h2>

      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}