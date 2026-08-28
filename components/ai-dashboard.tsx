"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  GaragePart,
  Vehicle,
  VehicleCustomer,
} from "@/lib/mock-data";

import {
  GarageAICommand,
  GarageAIInterpretation,
} from "@/lib/garage-ai";

import VehicleWorkModal from "@/components/vehicle-work-modal";
import PartFormModal from "@/components/part-form-modal";
import AddCustomerModal from "@/components/add-customer-modal";
import BillFormModal from "@/components/bill-form-modal";
import AIVehicleModal from "@/components/ai-vehicle-modal";

type OpenAction =
  | "work"
  | "part"
  | "customer"
  | "vehicle"
  | "billing"
  | null;

function normalize(
  value: unknown
) {
  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    );
}

const commandExamples = [
  "new part order crashbar",
  "clubstyle panamerica create work seating stitching",
  "add customer Rajesh Kumar vip phone 9876543210",
  "create vehicle for clubstyle 2021 Yamaha Tenere 700",
  "create estimate for Rajesh",
];

export default function AiDashboard({
  customers,
  vehicles,
}: {
  customers:
    VehicleCustomer[];

  vehicles:
    Vehicle[];
}) {
  const router =
    useRouter();

  const [
    input,
    setInput,
  ] =
    useState("");

  const [
    useAI,
    setUseAI,
  ] =
    useState(false);

  const [
    searchOnline,
    setSearchOnline,
  ] =
    useState(true);

  const [
    interpretation,
    setInterpretation,
  ] =
    useState<
      GarageAIInterpretation |
      null
    >(null);

  const [
    interpreting,
    setInterpreting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    openAction,
    setOpenAction,
  ] =
    useState<OpenAction>(
      null
    );

  const command =
    interpretation?.command;

  const matchedCustomer =
    useMemo(() => {
      if (
        !command?.customer
      ) {
        return undefined;
      }

      const needle =
        normalize(
          command.customer
        );

      return customers.find(
        (
          customer
        ) =>
          normalize(
            customer.customerCode
          ) ===
            needle ||
          normalize(
            customer.name
          ) ===
            needle ||
          normalize(
            customer.name
          ).includes(
            needle
          ) ||
          needle.includes(
            normalize(
              customer.name
            )
          )
      );
    }, [
      command?.customer,
      customers,
    ]);

  const matchedVehicle =
    useMemo(() => {
      if (
        !command?.vehicle
      ) {
        return undefined;
      }

      const needle =
        normalize(
          command.vehicle
        );

      const pool =
        matchedCustomer
          ? vehicles.filter(
              (
                vehicle
              ) =>
                String(
                  vehicle.customerId ||
                    vehicle.customer
                      ?.id ||
                    ""
                ) ===
                String(
                  matchedCustomer.id
                )
            )
          : vehicles;

      return pool.find(
        (
          vehicle
        ) =>
          normalize(
            vehicle.name
          ) ===
            needle ||
          normalize(
            vehicle.model
          ) ===
            needle ||
          normalize(
            vehicle.name
          ).includes(
            needle
          ) ||
          needle.includes(
            normalize(
              vehicle.name
            )
          )
      );
    }, [
      command?.vehicle,
      matchedCustomer,
      vehicles,
    ]);

  async function interpret() {
    if (!input.trim()) {
      setError(
        "Enter a command first."
      );

      return;
    }

    setInterpreting(
      true
    );

    setError("");

    setInterpretation(
      null
    );

    try {
      const response =
        await fetch(
          "/api/ai-command",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                input:
                  input.trim(),

                useAI,

                searchOnline:
                  useAI &&
                  searchOnline,

                context: {
                  customers:
                    customers.map(
                      (
                        customer
                      ) => ({
                        id:
                          String(
                            customer.id
                          ),

                        name:
                          customer.name,

                        customerCode:
                          customer.customerCode,
                      })
                    ),

                  vehicles:
                    vehicles.map(
                      (
                        vehicle
                      ) => ({
                        id:
                          String(
                            vehicle.id
                          ),

                        name:
                          vehicle.name,

                        make:
                          vehicle.make,

                        model:
                          vehicle.model,

                        variant:
                          vehicle.variant,

                        year:
                          vehicle.year,

                        customerId:
                          vehicle.customerId,

                        customerName:
                          vehicle.customerName,
                      })
                    ),
                },
              }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to interpret command"
        );
      }

      setInterpretation(
        result
      );
    } catch (err) {
      setError(
        err instanceof
          Error
          ? err.message
          : "Unable to interpret command"
      );
    } finally {
      setInterpreting(
        false
      );
    }
  }

  function openPopup() {
    if (!command) {
      return;
    }

    if (
      command.action ===
      "create_work"
    ) {
      setOpenAction(
        "work"
      );

      return;
    }

    if (
      command.action ===
      "create_part"
    ) {
      setOpenAction(
        "part"
      );

      return;
    }

    if (
      command.action ===
      "create_customer"
    ) {
      setOpenAction(
        "customer"
      );

      return;
    }

    if (
      command.action ===
      "create_vehicle"
    ) {
      setOpenAction(
        "vehicle"
      );

      return;
    }

    if (
      command.action ===
        "create_estimate" ||
      command.action ===
        "create_invoice"
    ) {
      setOpenAction(
        "billing"
      );
    }
  }

  const actionLabel =
    command
      ? {
          create_work:
            "Open Work Form",

          create_part:
            "Open Part Form",

          create_customer:
            "Open Customer Form",

          create_vehicle:
            "Open Vehicle Form",

          create_estimate:
            "Open Estimate",

          create_invoice:
            "Open Invoice",

          unknown:
            "No Action",
        }[
          command.action
        ]
      : "";

  const rows =
    command
      ? [
          [
            "Action",
            formatAction(
              command.action
            ),
          ],

          [
            "Customer",
            matchedCustomer
              ? `${matchedCustomer.name}${
                  matchedCustomer
                    .customerCode
                    ? ` (${matchedCustomer.customerCode})`
                    : ""
                }`
              : command.customer,
          ],

          [
            "Vehicle",
            matchedVehicle
              ? matchedVehicle.name
              : command.vehicle ||
                command.vehicleName,
          ],

          [
            "Work Title",
            command.title,
          ],

          [
            "Part",
            command.partName,
          ],

          [
            "Customer Name",
            command.customerName,
          ],

          [
            "Vehicle Name",
            command.vehicleName,
          ],

          [
            "Make / Model",
            [
              command.make,
              command.model,
            ]
              .filter(
                Boolean
              )
              .join(" "),
          ],

          [
            "Year",
            command.year,
          ],

          [
            "Category",
            command.category,
          ],

          [
            "Priority",
            command.priority,
          ],

          [
            "Status",
            command.status,
          ],

          [
            "Description",
            command.description,
          ],

          [
            "Notes",
            command.notes,
          ],
        ].filter(
          (
            [, value]
          ) =>
            value !==
              undefined &&
            value !==
              null &&
            value !==
              ""
        )
      : [];

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#1d2228]">
      <section className="border-b border-[#e1e4e8] bg-white">
        <div className="px-5 py-4 lg:px-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            AI Assistant
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Interpret a Garage command and open the normal form with fields pre-populated.
          </p>
        </div>
      </section>

      <div className="px-5 py-5 lg:px-8">
        <section className="rounded-xl border border-[#dfe2e6] bg-white p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={
                    useAI
                  }
                  onChange={(
                    event
                  ) => {
                    setUseAI(
                      event.target
                        .checked
                    );

                    if (
                      event.target
                        .checked
                    ) {
                      setSearchOnline(
                        true
                      );
                    }
                  }}
                  className="h-4 w-4"
                />

                Use AI
              </label>

              <label
                className={`flex items-center gap-2 text-sm ${
                  useAI
                    ? "text-gray-700"
                    : "text-gray-400"
                }`}
              >
                <input
                  type="checkbox"
                  checked={
                    useAI &&
                    searchOnline
                  }
                  disabled={
                    !useAI
                  }
                  onChange={(
                    event
                  ) =>
                    setSearchOnline(
                      event.target
                        .checked
                    )
                  }
                  className="h-4 w-4"
                />

                Search online for details & image
              </label>
            </div>

            <span className="text-xs text-gray-400">
              {useAI
                ? searchOnline
                  ? "AI + Web Research"
                  : "AI parser"
                : "Standard parser"}
            </span>
          </div>

          <div className="mb-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Examples
            </div>

            <div className="flex flex-wrap gap-2">
              {commandExamples.map(
                (
                  example
                ) => (
                  <button
                    key={
                      example
                    }
                    type="button"
                    onClick={() => {
                      setInput(
                        example
                      );

                      setInterpretation(
                        null
                      );

                      setError(
                        ""
                      );
                    }}
                    className="rounded-lg border border-[#d8dce1] bg-[#fafafa] px-3 py-2 text-left text-xs font-medium text-gray-600 transition hover:border-[#aeb4bb] hover:bg-white hover:text-[#1d2228]"
                    title="Copy example into command box"
                  >
                    {example}
                  </button>
                )
              )}
            </div>

            <p className="mt-2 text-xs text-gray-400">
              Click an example to copy it into the command box, then edit it as needed.
            </p>
          </div>

          <textarea
            rows={3}
            value={
              input
            }
            onChange={(
              event
            ) =>
              setInput(
                event.target
                  .value
              )
            }
            placeholder="Enter a Garage command..."
            className="w-full resize-y rounded-xl border border-[#d8dce1] bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]"
          />

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() =>
                void interpret()
              }
              disabled={
                interpreting
              }
              className="h-10 rounded-lg bg-[#1d2228] px-5 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
            >
              {interpreting
                ? "Interpreting..."
                : "Interpret"}
            </button>
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </section>

        {interpretation && (
          <section className="mt-5 overflow-hidden rounded-xl border border-[#dfe2e6] bg-white">
            <div className="flex flex-col gap-3 border-b border-[#e1e4e8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">
                    Interpretation
                  </h2>

                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    {interpretation.parser ===
                    "ai"
                      ? interpretation
                          .research
                          ?.searchedOnline
                        ? "AI + Web Research"
                        : "AI"
                      : "Standard Parser"}
                  </span>

                  <ConfidenceBadge
                    confidence={
                      interpretation
                        .command
                        .confidence
                    }
                  />
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  {
                    interpretation
                      .command
                      .summary
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={
                  openPopup
                }
                disabled={
                  command?.action ===
                  "unknown"
                }
                className="h-10 shrink-0 rounded-lg bg-[#1d2228] px-5 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {
                  actionLabel
                }
              </button>
            </div>

            <div className="grid gap-px bg-[#e7e8ea] sm:grid-cols-2">
              {rows.map(
                (
                  [
                    label,
                    value,
                  ]
                ) => (
                  <div
                    key={
                      label
                    }
                    className="bg-white px-4 py-3"
                  >
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                      {
                        label
                      }
                    </div>

                    <div className="mt-1 text-sm font-medium">
                      {
                        String(
                          value
                        )
                      }
                    </div>
                  </div>
                )
              )}
            </div>

            {interpretation.research?.searchedOnline && (
              <div className="border-t border-[#e1e4e8] bg-[#fafafa] px-4 py-4">
                <div className="flex flex-col gap-4 lg:flex-row">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Online Research
                    </div>

                    {interpretation.research.summary && (
                      <p className="mt-1 text-sm leading-6 text-gray-700">
                        {interpretation.research.summary}
                      </p>
                    )}

                    {interpretation.research.details &&
                      interpretation.research.details.length > 0 && (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {interpretation.research.details.map(
                            (
                              detail,
                              index
                            ) => (
                              <div
                                key={`${detail.label}-${index}`}
                                className="rounded-lg border border-[#e1e4e8] bg-white px-3 py-2"
                              >
                                <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                                  {detail.label}
                                </div>

                                <div className="mt-1 text-sm">
                                  {detail.value}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                    {interpretation.research.sources &&
                      interpretation.research.sources.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-medium text-gray-500">
                            Sources
                          </div>

                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            {interpretation.research.sources.map(
                              (
                                source,
                                index
                              ) => (
                                <a
                                  key={`${source.url}-${index}`}
                                  href={source.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  {source.title}
                                </a>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {interpretation.research.warnings &&
                      interpretation.research.warnings.length > 0 && (
                        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-amber-700">
                          {interpretation.research.warnings.map(
                            (
                              warning,
                              index
                            ) => (
                              <li key={index}>
                                {warning}
                              </li>
                            )
                          )}
                        </ul>
                      )}
                  </div>

                  {interpretation.research.imageUrl && (
                    <div className="w-full shrink-0 lg:w-64">
                      <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Suggested Image
                      </div>

                      <div className="mt-2 overflow-hidden rounded-lg border border-[#e1e4e8] bg-white">
                        <img
                          src={interpretation.research.imageUrl}
                          alt="Suggested online reference"
                          className="h-40 w-full object-contain"
                        />
                      </div>

                      {interpretation.research.imageSourceUrl && (
                        <a
                          href={interpretation.research.imageSourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                        >
                          Open image source
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {command?.warnings &&
              command.warnings
                .length >
                0 && (
                <div className="border-t border-[#e1e4e8] bg-amber-50 px-4 py-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-amber-700">
                    Check before opening
                  </div>

                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-amber-800">
                    {command.warnings.map(
                      (
                        warning,
                        index
                      ) => (
                        <li
                          key={
                            index
                          }
                        >
                          {
                            warning
                          }
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
          </section>
        )}
      </div>

      {openAction ===
        "work" &&
        command && (
          <VehicleWorkModal
            vehicles={
              vehicles
            }
            initialPrefill={{
              customerId:
                matchedCustomer?.id,

              vehicleId:
                matchedVehicle?.id,

              vehicleText:
                !matchedVehicle
                  ? command.vehicle
                  : undefined,

              title:
                command.title,

              category:
                command.category,

              priority:
                command.priority,

              status:
                command.status,

              description:
                command.description,

              notes:
                command.notes,
            }}
            onChanged={() => {
              router.refresh();
            }}
            onClose={() =>
              setOpenAction(
                null
              )
            }
          />
        )}

      {openAction ===
        "part" &&
        command && (
          <PartFormModal
            initialData={{
              name:
                command.partName ||
                command.description ||
                "",

              partNumber:
                command.partNumber,

              brand:
                command.brand,

              supplier:
                command.supplier,

              supplierPartNumber:
                command.supplierPartNumber,

              description:
                command.description,

              costPrice:
                command.costPrice,

              sellingPrice:
                command.sellingPrice,

              currency:
                command.currency ||
                "INR",

              notes:
                command.notes,
            }}
            onSaved={() => {
              setOpenAction(
                null
              );

              router.refresh();
            }}
            onClose={() =>
              setOpenAction(
                null
              )
            }
          />
        )}

      {openAction ===
        "customer" &&
        command && (
          <AddCustomerModal
            initialData={{
              name:
                command.customerName ||
                "",

              category:
                command.customerCategory ||
                "general",

              phone:
                command.phone,

              email:
                command.email,

              address:
                command.address,

              city:
                command.city,

              state:
                command.state,

              pincode:
                command.pincode,

              country:
                command.country ||
                "India",

              notes:
                command.notes,
            }}
            onCreated={() => {
              setOpenAction(
                null
              );

              router.refresh();
            }}
            onClose={() =>
              setOpenAction(
                null
              )
            }
          />
        )}

      {openAction ===
        "vehicle" &&
        command && (
          <AIVehicleModal
            customers={
              customers
            }
            initialData={{
              customerId:
                matchedCustomer?.id,

              name:
                command.vehicleName ||
                command.model,

              make:
                command.make,

              model:
                command.model,

              variant:
                command.variant,

              year:
                command.year,

              status:
                command.status,

              registrationNumber:
                command.registrationNumber,

              vin:
                command.vin,

              enginePlatform:
                command.enginePlatform,

              engineCc:
                command.engineCc,

              odometer:
                command.odometer,

              odometerUnit:
                command.odometerUnit,

              location:
                command.location,

              notes:
                command.notes,
            }}
            onSaved={() => {
              router.refresh();
            }}
            onClose={() =>
              setOpenAction(
                null
              )
            }
          />
        )}

      {openAction ===
        "billing" &&
        command && (
          <BillFormModal
            initialType={
              command.action ===
              "create_invoice"
                ? "Invoice"
                : "Estimate"
            }
            initialCustomerId={
              matchedCustomer?.id
            }
            initialNotes={
              command.notes
            }
            onSaved={() => {
              router.refresh();
            }}
            onClose={() =>
              setOpenAction(
                null
              )
            }
          />
        )}
    </main>
  );
}

function formatAction(
  action:
    GarageAICommand["action"]
) {
  return {
    create_work:
      "Create Work",

    create_part:
      "Create Part",

    create_customer:
      "Create Customer",

    create_vehicle:
      "Create Vehicle",

    create_estimate:
      "Create Estimate",

    create_invoice:
      "Create Invoice",

    unknown:
      "Unknown",
  }[action];
}

function ConfidenceBadge({
  confidence,
}: {
  confidence:
    "high" |
    "medium" |
    "low";
}) {
  const className =
    confidence ===
    "high"
      ? "bg-green-100 text-green-700"
      : confidence ===
          "medium"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${className}`}
    >
      {confidence}
    </span>
  );
}
