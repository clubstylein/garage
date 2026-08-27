"use client";

import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import Link from "next/link";

import {
  SpecTemplate,
  SpecificationRow,
  VehicleCustomer,
} from "@/lib/mock-data";

type AiSpecification = {
  category: string;
  specification: string;
  value: string;
  unit: string;
  confidence:
    | "high"
    | "medium"
    | "low";
};

type AiSource = {
  title: string;
  url: string;
};

type AiVehicleResult = {
  identified: boolean;
  make: string;
  model: string;
  variant: string;
  year: number;
  asset_type: string;
  engine_platform: string;
  engine_cc:
    | number
    | null;
  confidence:
    | "high"
    | "medium"
    | "low";
  identification_notes: string;
  warnings: string[];
  specifications:
    AiSpecification[];
  sources?: AiSource[];
  researched_at?: string;
};

export default function AddVehicleForm({
  templates,
  customers,
}: {
  templates:
    SpecTemplate[];

  customers:
    VehicleCustomer[];
}) {
  const router =
    useRouter();

  /* =======================================================
     VEHICLE
     ======================================================= */

  const [
    assetType,
    setAssetType,
  ] =
    useState(
      "Motorcycle"
    );

  const [
    make,
    setMake,
  ] =
    useState("");

  const [
    model,
    setModel,
  ] =
    useState("");

  const [
    variant,
    setVariant,
  ] =
    useState("");

  const [
    year,
    setYear,
  ] =
    useState("");

  const [
    location,
    setLocation,
  ] =
    useState("");

  const [
    enginePlatform,
    setEnginePlatform,
  ] =
    useState("");

  const [
    engineCc,
    setEngineCc,
  ] =
    useState("");

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
      "Owned"
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
      clubStyleCustomer
        ?.id ??
        ""
    );

  const sortedCustomers =
    useMemo(
      () => {
        return [
          ...customers,
        ].sort(
          (
            a,
            b
          ) => {
            const categoryOrder: Record<
              string,
              number
            > = {
              "self-owned": 1,
              vip: 2,
              general: 3,
            };

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
      () =>
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
        null,
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
    >([]);

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

  /* =======================================================
     AI
     ======================================================= */

  const [
    researching,
    setResearching,
  ] =
    useState(false);

  const [
    aiResult,
    setAiResult,
  ] =
    useState<
      AiVehicleResult |
      null
    >(null);

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

    if (
      value ===
      "Wishlist"
    ) {
      setCustomerId(
        ""
      );

      return;
    }

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
     AI LOOKUP
     ======================================================= */

  async function findVehicleDetails() {
    setError("");
    setAiResult(
      null
    );

    if (
      !make.trim() ||
      !model.trim() ||
      !year.trim()
    ) {
      setError(
        "Enter Make, Model and Year before searching for vehicle details."
      );

      return;
    }

    const yearNumber =
      Number(
        year
      );

    if (
      !Number.isFinite(
        yearNumber
      ) ||
      yearNumber <
        1900 ||
      yearNumber >
        2100
    ) {
      setError(
        "Please enter a valid model year."
      );

      return;
    }

    setResearching(
      true
    );

    try {
      const selected =
        templates.find(
          (
            template
          ) =>
            String(
              template.id
            ) ===
            String(
              selectedTemplate
            )
        );

      const templateItems =
        selected?.items.map(
          (
            item
          ) => ({
            category:
              item.category,

            specification:
              item.specification,

            defaultUnit:
              item.defaultUnit,

            required:
              item.required,
          })
        ) ??
        [];

      const response =
        await fetch(
          "/api/vehicle-lookup",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  make:
                    make.trim(),

                  model:
                    model.trim(),

                  year:
                    yearNumber,

                  asset_type:
                    assetType,

                  location:
                    location.trim(),

                  templateItems,
                }
              ),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result?.error ||
            "Unable to research vehicle."
        );
      }

      setAiResult(
        result as
          AiVehicleResult
      );
    } catch (
      err
    ) {
      console.error(
        "Vehicle research error:",
        err
      );

      setError(
        err instanceof
          Error
          ? err.message
          : "Unable to research vehicle."
      );
    } finally {
      setResearching(
        false
      );
    }
  }

  /* =======================================================
     APPLY AI RESULT
     ======================================================= */

  function applyAiResult() {
    if (
      !aiResult
    ) {
      return;
    }

    if (
      !aiResult.identified
    ) {
      setError(
        "The vehicle could not be identified confidently enough to apply the details."
      );

      return;
    }

    setMake(
      aiResult.make ||
        make
    );

    setModel(
      aiResult.model ||
        model
    );

    setVariant(
      aiResult.variant ||
        variant
    );

    setYear(
      aiResult.year
        ? String(
            aiResult.year
          )
        : year
    );

    setAssetType(
      aiResult.asset_type ||
        assetType
    );

    setEnginePlatform(
      aiResult.engine_platform ||
        enginePlatform
    );

    if (
      aiResult.engine_cc !==
        null &&
      aiResult.engine_cc !==
        undefined
    ) {
      setEngineCc(
        String(
          aiResult.engine_cc
        )
      );
    }

    if (
      Array.isArray(
        aiResult.specifications
      ) &&
      aiResult
        .specifications
        .length >
        0
    ) {
      setSpecifications(
        aiResult.specifications.map(
          (
            item,
            index
          ) => ({
            category:
              item.category ||
              "",

            specification:
              item.specification ||
              "",

            value:
              item.value ||
              "",

            unit:
              item.unit ||
              "",

            notes:
              item.confidence
                ? `AI confidence: ${item.confidence}`
                : "",

            sort:
              index +
              1,
          })
        )
      );
    }

    setError("");
    setAiResult(
      null
    );
  }

  /* =======================================================
     SAVE VEHICLE
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
        | null =
        null;

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
            "Vehicle"
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
            uploadResult
              ?.error ||
              "Unable to upload vehicle image"
          );
        }

        if (
          !uploadResult
            ?.id
        ) {
          throw new Error(
            "Vehicle image uploaded but no file ID was returned."
          );
        }

        coverImageId =
          String(
            uploadResult.id
          );
      }

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
          coverImageId,

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

      const response =
        await fetch(
          "/api/vehicles",
          {
            method:
              "POST",

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
          "Invalid response while creating vehicle."
        );
      }

      if (
        !response.ok
      ) {
        throw new Error(
          result?.error ||
            "Unable to create vehicle"
        );
      }

      if (
        !result?.id
      ) {
        throw new Error(
          "Vehicle was created but no vehicle ID was returned."
        );
      }

      router.push(
        `/vehicles/${result.id}`
      );

      router.refresh();
    } catch (
      err
    ) {
      console.error(
        "Add vehicle error:",
        err
      );

      setError(
        err instanceof
          Error
          ? err.message
          : "Unable to create vehicle"
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
  }

  /* =======================================================
     SPEC TEMPLATE
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

    setSpecifications(
      template.items.map(
        (
          item,
          index
        ) => ({
          category:
            item.category ||
            "",

          specification:
            item.specification ||
            "",

          value:
            "",

          unit:
            item.defaultUnit ??
            "",

          notes:
            "",

          sort:
            item.sort ??
            index +
              1,
        })
      )
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

  return (
    <form
      onSubmit={
        handleSubmit
      }
    >
      <div className="grid gap-5 xl:grid-cols-3">
        {/* VEHICLE IMAGE */}

        <FormCard title="Vehicle Image">
          <div className="overflow-hidden rounded-xl border border-[#e0e3e7] bg-[#f5f6f8]">
            {coverPreview ? (
              <img
                src={
                  coverPreview
                }
                alt="Vehicle preview"
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
              Select Image
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
          </div>

          {coverPreview && (
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

        {/* VEHICLE */}

        <FormCard title="Vehicle">
          <Field
            label="Vehicle Name"
            required
          >
            <input
              name="name"
              required
              placeholder="Street 750"
              className={
                inputClass
              }
            />
          </Field>

          <Field label="Asset Type">
            <select
              name="asset_type"
              value={
                assetType
              }
              onChange={(
                event
              ) =>
                setAssetType(
                  event
                    .target
                    .value
                )
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
                    {customer.name} — {formatCategory(
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
              value={
                make
              }
              onChange={(
                event
              ) =>
                setMake(
                  event
                    .target
                    .value
                )
              }
              placeholder="Harley Davidson"
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
              value={
                model
              }
              onChange={(
                event
              ) =>
                setModel(
                  event
                    .target
                    .value
                )
              }
              placeholder="Street 750"
              className={
                inputClass
              }
            />
          </Field>

          <Field label="Variant">
            <input
              name="variant"
              value={
                variant
              }
              onChange={(
                event
              ) =>
                setVariant(
                  event
                    .target
                    .value
                )
              }
              placeholder="Optional"
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
              value={
                year
              }
              onChange={(
                event
              ) =>
                setYear(
                  event
                    .target
                    .value
                )
              }
              placeholder="2018"
              className={
                inputClass
              }
            />
          </Field>

          <div className="rounded-xl border border-[#dfe2e6] bg-[#f7f8fa] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1d2228] text-sm text-white">
                ✦
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">
                  Vehicle Research
                </div>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Find factory information and specifications using AI and web research.
                </p>

                <button
                  type="button"
                  onClick={
                    findVehicleDetails
                  }
                  disabled={
                    researching ||
                    saving ||
                    !make.trim() ||
                    !model.trim() ||
                    !year.trim()
                  }
                  className="mt-3 rounded-lg bg-[#1d2228] px-4 py-2.5 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {researching
                    ? "Researching..."
                    : "✦ Find Vehicle Details"}
                </button>
              </div>
            </div>
          </div>
        </FormCard>

        {/* STATUS */}

        <FormCard title="Status & Location">
          <Field label="Status">
            <select
              name="status"
              defaultValue="Running"
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
              value={
                location
              }
              onChange={(
                event
              ) =>
                setLocation(
                  event
                    .target
                    .value
                )
              }
              placeholder="Ooty"
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
              className={
                inputClass
              }
            />
          </Field>

          <Field label="Odometer Unit">
            <select
              name="odometer_unit"
              defaultValue="km"
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
              className={
                inputClass
              }
            />
          </Field>

          <Field label="VIN">
            <input
              name="vin"
              className={
                inputClass
              }
            />
          </Field>
        </FormCard>

        {aiResult && (
          <div className="xl:col-span-3">
            <AiResearchCard
              result={
                aiResult
              }
              onApply={
                applyAiResult
              }
              onCancel={() =>
                setAiResult(
                  null
                )
              }
            />
          </div>
        )}

        {/* ENGINE */}

        <FormCard title="Engine">
          <Field label="Engine Platform">
            <input
              name="engine_platform"
              value={
                enginePlatform
              }
              onChange={(
                event
              ) =>
                setEnginePlatform(
                  event
                    .target
                    .value
                )
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
              value={
                engineCc
              }
              onChange={(
                event
              ) =>
                setEngineCc(
                  event
                    .target
                    .value
                )
              }
              className={
                inputClass
              }
            />
          </Field>

          <Field label="Engine Number">
            <input
              name="engine_number"
              className={
                inputClass
              }
            />
          </Field>
        </FormCard>

        {/* OWNERSHIP */}

        <FormCard title="Ownership Details">
          <Field label="Purchase Date">
            <input
              name="purchase_date"
              type="date"
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
              className={
                inputClass
              }
            />
          </Field>

          <Field label="Currency">
            <select
              name="currency"
              defaultValue="INR"
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

        {/* NOTES */}

        <div className="xl:col-span-2">
          <FormCard title="Notes">
            <textarea
              name="notes"
              rows={
                7
              }
              className={`${inputClass} resize-y`}
            />
          </FormCard>
        </div>

        {/* SPECIFICATIONS */}

        <div className="xl:col-span-2">
          <FormCard title="Specifications">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-72 flex-1">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Specification Template
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
                className="rounded-lg border border-[#d8dce1] bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40"
              >
                Apply Template
              </button>

              <button
                type="button"
                onClick={
                  addSpecification
                }
                disabled={
                  saving
                }
                className="rounded-lg border border-[#d8dce1] bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                + Add Specification
              </button>
            </div>

            {specifications.length >
            0 ? (
              <div className="mt-5 space-y-2">
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
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500">
                Select a template or add a specification manually.
              </div>
            )}
          </FormCard>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Link
          href="/vehicles"
          className="rounded-lg border border-[#d8dce1] bg-white px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={
            saving ||
            researching
          }
          className="rounded-lg bg-[#1d2228] px-5 py-2.5 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Add Vehicle"}
        </button>
      </div>
    </form>
  );
}

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

/* AI COMPONENTS */

function AiResearchCard({
  result,
  onApply,
  onCancel,
}: {
  result:
    AiVehicleResult;

  onApply:
    () => void;

  onCancel:
    () => void;
}) {
  const foundSpecifications =
    result.specifications.filter(
      (
        item
      ) =>
        item.value.trim() !==
        ""
    );

  return (
    <section className="rounded-xl border border-[#ccd1d7] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              ✦ AI Research Result
            </h2>

            <ConfidenceBadge
              confidence={
                result.confidence
              }
            />
          </div>

          <p className="mt-2 font-medium">
            {result.year}{" "}
            {result.make}{" "}
            {result.model}{" "}
            {result.variant}
          </p>

          {result.identification_notes && (
            <p className="mt-2 text-sm text-gray-500">
              {
                result.identification_notes
              }
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={
              onCancel
            }
            className="rounded-lg border px-4 py-2.5 text-sm"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={
              onApply
            }
            disabled={
              !result.identified
            }
            className="rounded-lg bg-[#1d2228] px-4 py-2.5 text-sm text-white disabled:opacity-40"
          >
            Apply Details
          </button>
        </div>
      </div>

      {foundSpecifications.length >
        0 && (
        <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {foundSpecifications.map(
            (
              item,
              index
            ) => (
              <div
                key={
                  index
                }
                className="rounded-lg border bg-[#fafafa] p-3"
              >
                <div className="text-xs text-gray-400">
                  {
                    item.category
                  }
                </div>

                <div className="mt-1 text-sm font-medium">
                  {
                    item.specification
                  }
                </div>

                <div className="mt-1 text-sm text-gray-600">
                  {item.value}{" "}
                  {item.unit}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}

function ConfidenceBadge({
  confidence,
}: {
  confidence:
    | "high"
    | "medium"
    | "low";
}) {
  return (
    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs">
      {confidence} confidence
    </span>
  );
}

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