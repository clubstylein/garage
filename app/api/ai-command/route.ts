import { NextResponse } from "next/server";
import OpenAI from "openai";

import {
  GarageAICommand,
  GarageAIContext,
} from "@/lib/garage-ai";

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY;

const OPENAI_AI_COMMAND_MODEL =
  process.env.OPENAI_AI_COMMAND_MODEL ||
  process.env.OPENAI_MODEL ||
  "gpt-5.6-luna";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function numberFrom(
  input: string,
  labels: string[]
) {
  for (const label of labels) {
    const pattern = new RegExp(
      `(?:${label})\\s*[:=]?\\s*(\\d+(?:\\.\\d+)?)`,
      "i"
    );

    const match = input.match(pattern);

    if (match) {
      const value = Number(match[1]);

      if (Number.isFinite(value)) {
        return value;
      }
    }
  }

  return undefined;
}

function textAfter(
  input: string,
  label: string
) {
  const pattern = new RegExp(
    `${label}\\s*[:=]?\\s*([^,;]+)`,
    "i"
  );

  return input.match(pattern)?.[1]?.trim();
}

function findCustomer(
  input: string,
  context: GarageAIContext
) {
  const normalizedInput =
    normalize(input);

  const matches =
    context.customers
      .map((customer) => {
        const candidates = [
          customer.name,
          customer.customerCode,
        ]
          .filter(Boolean)
          .map((value) =>
            normalize(String(value))
          )
          .filter(Boolean);

        const best =
          candidates
            .filter((candidate) =>
              normalizedInput.includes(
                candidate
              )
            )
            .sort(
              (a, b) =>
                b.length -
                a.length
            )[0];

        return best
          ? {
              customer,
              score:
                best.length,
            }
          : null;
      })
      .filter(Boolean)
      .sort(
        (a: any, b: any) =>
          b.score -
          a.score
      );

  return matches[0]
    ? (matches[0] as any)
        .customer
    : undefined;
}

function findVehicle(
  input: string,
  context: GarageAIContext,
  customerId?: string
) {
  const normalizedInput =
    normalize(input);

  const pool =
    customerId
      ? context.vehicles.filter(
          (vehicle) =>
            String(
              vehicle.customerId ||
                ""
            ) ===
            String(customerId)
        )
      : context.vehicles;

  const matches =
    pool
      .map((vehicle) => {
        const candidates = [
          vehicle.name,
          vehicle.model,
          [
            vehicle.make,
            vehicle.model,
          ]
            .filter(Boolean)
            .join(" "),
          [
            vehicle.name,
            vehicle.year,
          ]
            .filter(Boolean)
            .join(" "),
        ]
          .map((value) =>
            normalize(
              String(value)
            )
          )
          .filter(
            (value) =>
              value.length >= 3
          );

        const best =
          candidates
            .filter((candidate) =>
              normalizedInput.includes(
                candidate
              )
            )
            .sort(
              (a, b) =>
                b.length -
                a.length
            )[0];

        return best
          ? {
              vehicle,
              score:
                best.length,
            }
          : null;
      })
      .filter(Boolean)
      .sort(
        (a: any, b: any) =>
          b.score -
          a.score
      );

  return matches[0]
    ? (matches[0] as any)
        .vehicle
    : undefined;
}

function removeKnownPhrases(
  input: string,
  phrases: string[]
) {
  let output = input;

  for (const phrase of phrases) {
    if (!phrase) continue;

    output =
      output.replace(
        new RegExp(
          phrase.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          ),
          "ig"
        ),
        " "
      );
  }

  return output
    .replace(/\s+/g, " ")
    .trim();
}

function standardParse(
  input: string,
  context: GarageAIContext
): GarageAICommand {
  const original =
    clean(input);

  const lower =
    original.toLowerCase();

  const customer =
    findCustomer(
      original,
      context
    );

  const vehicle =
    findVehicle(
      original,
      context,
      customer?.id
    );

  const warnings: string[] =
    [];

  let action:
    GarageAICommand["action"] =
    "unknown";

  if (
    /\b(invoice|invoicing)\b/i.test(
      original
    )
  ) {
    action =
      "create_invoice";
  } else if (
    /\b(estimate|quotation|quote)\b/i.test(
      original
    )
  ) {
    action =
      "create_estimate";
  } else if (
    /\b(customer|client)\b/i.test(
      original
    ) &&
    /\b(add|new|create)\b/i.test(
      original
    )
  ) {
    action =
      "create_customer";
  } else if (
    /\b(vehicle|motorcycle|bike)\b/i.test(
      original
    ) &&
    /\b(add|new|create)\b/i.test(
      original
    )
  ) {
    action =
      "create_vehicle";
  } else if (
    /\b(part|parts)\b/i.test(
      original
    )
  ) {
    action =
      "create_part";
  } else if (
    /\b(work|job|repair|service)\b/i.test(
      original
    )
  ) {
    action =
      "create_work";
  }

  const priority =
    numberFrom(
      original,
      [
        "priority",
        "p",
      ]
    );

  const yearMatch =
    original.match(
      /\b(19\d{2}|20\d{2})\b/
    );

  const year =
    yearMatch
      ? Number(
          yearMatch[1]
        )
      : undefined;

  const phone =
    original.match(
      /\b(?:\+?\d[\d -]{7,}\d)\b/
    )?.[0]
      ?.replace(/\s+/g, " ")
      .trim();

  const email =
    original.match(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
    )?.[0];

  const categoryMatch =
    lower.match(
      /\b(engine|electrical|brakes?|suspension|drivetrain|controls?|body|service|fabrication|accessories?|general)\b/
    );

  const statusMatch =
    lower.match(
      /\b(idea|planned|parts required|parts ordered|ready|in progress|on hold|completed|cancelled)\b/
    );

  const baseRemove = [
    customer?.name || "",
    customer?.customerCode || "",
    vehicle?.name || "",
    vehicle?.make || "",
    vehicle?.model || "",
    "create",
    "add",
    "new",
  ];

  if (
    action ===
    "create_work"
  ) {
    let title =
      removeKnownPhrases(
        original,
        [
          ...baseRemove,
          "work",
          "job",
          "repair",
          "service",
        ]
      );

    title =
      title.replace(
        /\bpriority\s*[=:]?\s*\d+\b/gi,
        " "
      );

    if (categoryMatch) {
      title =
        removeKnownPhrases(
          title,
          [
            categoryMatch[0],
          ]
        );
    }

    if (statusMatch) {
      title =
        removeKnownPhrases(
          title,
          [
            statusMatch[0],
          ]
        );
    }

    title =
      title
        .replace(/\s+/g, " ")
        .trim();

    if (!customer) {
      warnings.push(
        "No existing customer was confidently matched."
      );
    }

    if (!vehicle) {
      warnings.push(
        "No existing vehicle was confidently matched."
      );
    }

    return {
      action,
      confidence:
        customer &&
        vehicle &&
        title
          ? "high"
          : "medium",
      summary:
        "Create a new work item.",
      customer:
        customer?.customerCode ||
        customer?.name,
      vehicle:
        vehicle?.name,
      title:
        title || undefined,
      description:
        title || undefined,
      priority:
        priority &&
        priority >= 1 &&
        priority <= 4
          ? priority
          : 3,
      status:
        statusMatch
          ? statusMatch[0]
              .replace(/\b\w/g, (x) =>
                x.toUpperCase()
              )
          : "Planned",
      category:
        categoryMatch
          ? categoryMatch[0]
              .replace(/\b\w/g, (x) =>
                x.toUpperCase()
              )
          : undefined,
      warnings,
    };
  }

  if (
    action ===
    "create_part"
  ) {
    let partName =
      removeKnownPhrases(
        original,
        [
          ...baseRemove,
          "part",
          "parts",
          "order",
          "ordered",
          "to order",
        ]
      )
        .replace(
          /\b(?:cost|price|selling price)\s*[=:]?\s*\d+(?:\.\d+)?\b/gi,
          " "
        )
        .replace(/\s+/g, " ")
        .trim();

    return {
      action,
      confidence:
        partName
          ? "high"
          : "medium",
      summary:
        "Create a new part in the Parts master.",
      partName:
        partName ||
        undefined,
      description:
        partName ||
        undefined,
      costPrice:
        numberFrom(
          original,
          [
            "cost",
            "cost price",
          ]
        ),
      sellingPrice:
        numberFrom(
          original,
          [
            "selling price",
            "price",
          ]
        ),
      partNumber:
        textAfter(
          original,
          "part number|part no\\.?|pn"
        ),
      supplier:
        textAfter(
          original,
          "supplier"
        ),
      brand:
        textAfter(
          original,
          "brand"
        ),
      currency:
        /\bAED\b/i.test(
          original
        )
          ? "AED"
          : /\bUSD\b/i.test(
                original
              )
            ? "USD"
            : /\bINR\b/i.test(
                  original
                )
              ? "INR"
              : undefined,
      warnings,
    };
  }

  if (
    action ===
    "create_customer"
  ) {
    const customerCategory =
      /\bvip\b/i.test(original)
        ? "vip"
        : /\bself[- ]owned\b/i.test(
              original
            )
          ? "self-owned"
          : "general";

    let customerName =
      removeKnownPhrases(
        original,
        [
          "create",
          "add",
          "new",
          "customer",
          "client",
          "vip",
          "general",
          "self-owned",
          "self owned",
          phone || "",
          email || "",
        ]
      );

    customerName =
      customerName
        .replace(
          /\b(phone|mobile|email|city|state|pincode|pin|country)\b.*$/i,
          ""
        )
        .trim();

    return {
      action,
      confidence:
        customerName
          ? "high"
          : "medium",
      summary:
        "Create a new customer.",
      customerName:
        customerName ||
        undefined,
      customerCategory,
      phone,
      email,
      city:
        textAfter(
          original,
          "city"
        ),
      state:
        textAfter(
          original,
          "state"
        ),
      pincode:
        textAfter(
          original,
          "pincode|pin"
        ),
      country:
        textAfter(
          original,
          "country"
        ),
      warnings,
    };
  }

  if (
    action ===
    "create_vehicle"
  ) {
    if (!customer) {
      warnings.push(
        "No existing customer was confidently matched."
      );
    }

    let remainder =
      removeKnownPhrases(
        original,
        [
          ...baseRemove,
          "vehicle",
          "motorcycle",
          "bike",
          String(year || ""),
        ]
      );

    const knownMakes = [
      "Harley Davidson",
      "Harley-Davidson",
      "Royal Enfield",
      "BMW",
      "Yamaha",
      "Honda",
      "Kawasaki",
      "Suzuki",
      "Triumph",
      "Ducati",
      "KTM",
      "Bajaj",
      "TVS",
      "Yezdi",
    ];

    const make =
      knownMakes.find((candidate) =>
        lower.includes(
          candidate.toLowerCase()
        )
      );

    if (make) {
      remainder =
        removeKnownPhrases(
          remainder,
          [make]
        );
    }

    remainder =
      remainder
        .replace(/\s+/g, " ")
        .trim();

    return {
      action,
      confidence:
        year &&
        remainder
          ? "medium"
          : "low",
      summary:
        "Create a new vehicle.",
      customer:
        customer?.customerCode ||
        customer?.name,
      vehicleName:
        remainder ||
        undefined,
      make:
        make?.replace(
          "-",
          " "
        ),
      model:
        remainder ||
        undefined,
      year,
      status:
        "Running",
      odometer:
        numberFrom(
          original,
          [
            "odometer",
            "odo",
          ]
        ),
      odometerUnit:
        /\bmi\b|\bmiles?\b/i.test(
          original
        )
          ? "mi"
          : "km",
      location:
        textAfter(
          original,
          "location"
        ),
      warnings,
    };
  }

  if (
    action ===
      "create_estimate" ||
    action ===
      "create_invoice"
  ) {
    if (!customer) {
      warnings.push(
        "No existing customer was confidently matched."
      );
    }

    return {
      action,
      confidence:
        customer
          ? "high"
          : "medium",
      summary:
        action ===
        "create_estimate"
          ? "Create a new estimate."
          : "Create a new invoice.",
      customer:
        customer?.customerCode ||
        customer?.name,
      currency:
        /\bAED\b/i.test(
          original
        )
          ? "AED"
          : /\bUSD\b/i.test(
                original
              )
            ? "USD"
            : "INR",
      notes:
        removeKnownPhrases(
          original,
          [
            ...baseRemove,
            "estimate",
            "quotation",
            "quote",
            "invoice",
            "invoicing",
            "for",
          ]
        ) || undefined,
      warnings,
    };
  }

  return {
    action:
      "unknown",
    confidence:
      "low",
    summary:
      "The standard parser could not confidently determine an action.",
    warnings: [
      "Try a more explicit command or enable Use AI.",
    ],
  };
}

async function aiParse(
  input: string,
  context: GarageAIContext
): Promise<GarageAICommand> {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not configured."
    );
  }

  const openai =
    new OpenAI({
      apiKey:
        OPENAI_API_KEY,
    });

  const prompt = `
Interpret this command for the ClubStyle Garage application.

USER COMMAND:
${input}

AVAILABLE CUSTOMERS:
${JSON.stringify(
  context.customers.slice(0, 100),
  null,
  2
)}

AVAILABLE VEHICLES:
${JSON.stringify(
  context.vehicles.slice(0, 150),
  null,
  2
)}

Supported actions:
- create_work
- create_part
- create_customer
- create_vehicle
- create_estimate
- create_invoice
- unknown

Rules:
1. Never invent a customer or vehicle match. If uncertain, return the text the user supplied and add a warning.
2. For create_work, extract a concise work title and use the same wording as description when no richer description exists.
3. Priority is 1 urgent, 2 high, 3 normal, 4 low.
4. Default new work status to Planned unless another status is clearly requested.
5. For create_part, partName is the master part name.
6. For create_vehicle, separate vehicleName, make, model, variant and year when possible.
7. Use customer code/name and vehicle name exactly as represented in AVAILABLE CUSTOMERS / VEHICLES when a confident match exists.
8. Do not perform any action. Only interpret.
`;

  const response =
    await openai.responses.create(
      {
        model:
          OPENAI_AI_COMMAND_MODEL,

        reasoning: {
          effort: "low",
        },

        input: [
          {
            role: "system",
            content:
              "You convert natural-language Garage commands into a strict structured command for a private motorcycle garage management application.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],

        text: {
          format: {
            type:
              "json_schema",

            name:
              "garage_command",

            strict: true,

            schema: {
              type:
                "object",

              properties: {
                action: {
                  type:
                    "string",
                  enum: [
                    "create_work",
                    "create_part",
                    "create_customer",
                    "create_vehicle",
                    "create_estimate",
                    "create_invoice",
                    "unknown",
                  ],
                },

                confidence: {
                  type:
                    "string",
                  enum: [
                    "high",
                    "medium",
                    "low",
                  ],
                },

                summary: {
                  type:
                    "string",
                },

                customer: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                vehicle: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                title: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                category: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                description: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                priority: {
                  type: [
                    "integer",
                    "null",
                  ],
                },

                status: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                notes: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                partName: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                partNumber: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                brand: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                supplier: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                supplierPartNumber: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                costPrice: {
                  type: [
                    "number",
                    "null",
                  ],
                },

                sellingPrice: {
                  type: [
                    "number",
                    "null",
                  ],
                },

                currency: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                customerName: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                customerCategory: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                phone: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                email: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                address: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                city: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                state: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                pincode: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                country: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                vehicleName: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                make: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                model: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                variant: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                year: {
                  type: [
                    "integer",
                    "null",
                  ],
                },

                registrationNumber: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                vin: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                enginePlatform: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                engineCc: {
                  type: [
                    "number",
                    "null",
                  ],
                },

                odometer: {
                  type: [
                    "number",
                    "null",
                  ],
                },

                odometerUnit: {
                  type: [
                    "string",
                    "null",
                  ],
                  enum: [
                    "km",
                    "mi",
                    null
                  ],
                },

                location: {
                  type: [
                    "string",
                    "null",
                  ],
                },

                warnings: {
                  type:
                    "array",
                  items: {
                    type:
                      "string",
                  },
                },
              },

              required: [
                "action",
                "confidence",
                "summary",
                "customer",
                "vehicle",
                "title",
                "category",
                "description",
                "priority",
                "status",
                "notes",
                "partName",
                "partNumber",
                "brand",
                "supplier",
                "supplierPartNumber",
                "costPrice",
                "sellingPrice",
                "currency",
                "customerName",
                "customerCategory",
                "phone",
                "email",
                "address",
                "city",
                "state",
                "pincode",
                "country",
                "vehicleName",
                "make",
                "model",
                "variant",
                "year",
                "registrationNumber",
                "vin",
                "enginePlatform",
                "engineCc",
                "odometer",
                "odometerUnit",
                "location",
                "warnings",
              ],

              additionalProperties:
                false,
            },
          },
        },
      }
    );

  const parsed =
    JSON.parse(
      response.output_text
    );

  const compact =
    Object.fromEntries(
      Object.entries(
        parsed
      ).filter(
        ([, value]) =>
          value !== null &&
          value !== ""
      )
    );

  return compact as
    GarageAICommand;
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const input =
      clean(body.input);

    const useAI =
      Boolean(
        body.useAI
      );

    const context:
      GarageAIContext = {
      customers:
        Array.isArray(
          body.context?.customers
        )
          ? body.context
              .customers
          : [],

      vehicles:
        Array.isArray(
          body.context?.vehicles
        )
          ? body.context
              .vehicles
          : [],
    };

    if (!input) {
      return NextResponse.json(
        {
          error:
            "Enter a command first.",
        },
        {
          status: 400,
        }
      );
    }

    const command =
      useAI
        ? await aiParse(
            input,
            context
          )
        : standardParse(
            input,
            context
          );

    return NextResponse.json({
      parser:
        useAI
          ? "ai"
          : "standard",

      command,
    });
  } catch (error) {
    console.error(
      "Garage AI command error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to interpret command.",
      },
      {
        status: 500,
      }
    );
  }
}
