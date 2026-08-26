import { NextResponse } from "next/server";
import OpenAI from "openai";

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY;

const OPENAI_MODEL =
  process.env.OPENAI_MODEL ||
  "gpt-5.6-terra";

type TemplateItem = {
  category?: string;
  specification?: string;
  defaultUnit?: string;
  required?: boolean;
};

type Source = {
  title: string;
  url: string;
};

const defaultMotorcycleSpecifications: TemplateItem[] = [
  {
    category: "Engine",
    specification: "Cooling Type",
  },
  {
    category: "Engine",
    specification: "Cylinders",
  },
  {
    category: "Engine",
    specification: "Engine Configuration",
  },
  {
    category: "Engine",
    specification: "Bore",
    defaultUnit: "mm",
  },
  {
    category: "Engine",
    specification: "Stroke",
    defaultUnit: "mm",
  },
  {
    category: "Engine",
    specification: "Compression Ratio",
  },
  {
    category: "Engine",
    specification: "Displacement",
    defaultUnit: "cc",
  },
  {
    category: "Engine",
    specification: "Max Power",
  },
  {
    category: "Engine",
    specification: "Max Torque",
  },
  {
    category: "Engine",
    specification: "Fuel System",
  },
  {
    category: "Transmission",
    specification: "Transmission",
  },
  {
    category: "Transmission",
    specification: "Gears",
  },
  {
    category: "Transmission",
    specification: "Final Drive",
  },
  {
    category: "Chassis",
    specification: "Frame Type",
  },
  {
    category: "Chassis",
    specification: "Wheelbase",
    defaultUnit: "mm",
  },
  {
    category: "Chassis",
    specification: "Rake",
    defaultUnit: "°",
  },
  {
    category: "Chassis",
    specification: "Trail",
    defaultUnit: "mm",
  },
  {
    category: "Suspension",
    specification: "Front Suspension",
  },
  {
    category: "Suspension",
    specification: "Rear Suspension",
  },
  {
    category: "Wheels & Tyres",
    specification: "Front Tyre",
  },
  {
    category: "Wheels & Tyres",
    specification: "Rear Tyre",
  },
  {
    category: "Brakes",
    specification: "Front Brake",
  },
  {
    category: "Brakes",
    specification: "Rear Brake",
  },
  {
    category: "Dimensions",
    specification: "Seat Height",
    defaultUnit: "mm",
  },
  {
    category: "Dimensions",
    specification: "Kerb Weight",
    defaultUnit: "kg",
  },
  {
    category: "Dimensions",
    specification: "Fuel Capacity",
    defaultUnit: "L",
  },
];

export async function POST(
  request: Request
) {
  try {
    /*
     * CONFIGURATION
     */

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    /*
     * REQUEST
     */

    const body =
      await request.json();

    const make =
      String(
        body.make || ""
      ).trim();

    const model =
      String(
        body.model || ""
      ).trim();

    const year =
      Number(body.year);

    const assetType =
      String(
        body.asset_type ||
          body.assetType ||
          "Motorcycle"
      ).trim();

    const location =
      String(
        body.location || ""
      ).trim();

    /*
     * VALIDATION
     */

    if (
      !make ||
      !model ||
      !year
    ) {
      return NextResponse.json(
        {
          error:
            "Make, model and year are required.",
        },
        { status: 400 }
      );
    }

    if (
      year < 1900 ||
      year > 2100
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid model year.",
        },
        { status: 400 }
      );
    }

    /*
     * SPECIFICATION TEMPLATE
     *
     * The Add Vehicle form will send the selected
     * Garage specification template.
     *
     * If no template is supplied yet, use the
     * standard motorcycle fields above.
     */

    const suppliedTemplate =
      Array.isArray(
        body.templateItems
      )
        ? (
            body.templateItems as TemplateItem[]
          )
        : [];

    const templateItems =
      suppliedTemplate.length > 0
        ? suppliedTemplate
        : assetType
              .toLowerCase()
              .includes(
                "motorcycle"
              )
          ? defaultMotorcycleSpecifications
          : [];

    const requestedSpecifications =
      templateItems
        .filter(
          (item) =>
            item.specification
        )
        .map(
          (item) => ({
            category:
              item.category ||
              "General",

            specification:
              item.specification!,

            unit:
              item.defaultUnit ||
              "",
          })
        );

    /*
     * PROMPT
     */

    const prompt = `
Research the following vehicle using current web sources.

Vehicle:
Make: ${make}
Model: ${model}
Year: ${year}
Asset type: ${assetType}
Location / market clue: ${
      location || "Not supplied"
    }

The purpose is to populate a private vehicle-management database.

IMPORTANT RESEARCH RULES:

1. Identify the exact model and model year before filling specifications.

2. Prefer sources in this order:
   - vehicle manufacturer / OEM
   - official owner's manual
   - official service manual
   - homologation or regulatory documentation
   - respected motorcycle/automotive publications
   - established specification databases

3. Do not guess values.

4. If a value cannot be reliably confirmed, return an empty string for the value.

5. Pay attention to differences between:
   - model years
   - countries / markets
   - trim or variant
   - ABS vs non-ABS
   - engine generations

6. Do not silently substitute specifications from a different model year.

7. Use the manufacturer's canonical make and model naming.

8. engine_cc should be the actual engine displacement in cc when reliably known.

9. engine_platform should be the manufacturer's engine family/platform name when one exists.
Examples include Revolution X, Milwaukee-Eight, CP2, LC8, etc.

10. Return specification values in a concise database-friendly format.

11. Do not put the unit inside "value" when the unit has its own unit field.
Example:
value: "749"
unit: "cc"

12. Preserve tyre-size notation such as:
120/70 ZR17

13. Preserve ratios such as:
11.0:1

14. The supplied specification list is the desired Garage schema.
Return one result for every requested specification.

REQUESTED SPECIFICATIONS:

${JSON.stringify(
  requestedSpecifications,
  null,
  2
)}
`;

    /*
     * OPENAI
     */

    const response =
      await openai.responses.create(
        {
          model:
            OPENAI_MODEL,

          reasoning: {
            effort: "low",
          },

          tools: [
            {
              type: "web_search",
            },
          ],

          tool_choice: "auto",

          include: [
            "web_search_call.action.sources",
          ],

          input: [
            {
              role: "system",

              content:
                "You are an expert motorcycle and vehicle specification researcher. Research carefully, distinguish model years and markets, and never invent specifications.",
            },

            {
              role: "user",
              content: prompt,
            },
          ],

          text: {
            format: {
              type: "json_schema",

              name:
                "vehicle_lookup",

              strict: true,

              schema: {
                type: "object",

                properties: {
                  identified: {
                    type: "boolean",
                  },

                  make: {
                    type: "string",
                  },

                  model: {
                    type: "string",
                  },

                  variant: {
                    type: "string",
                  },

                  year: {
                    type: "integer",
                  },

                  asset_type: {
                    type: "string",
                  },

                  engine_platform: {
                    type: "string",
                  },

                  engine_cc: {
                    anyOf: [
                      {
                        type: "number",
                      },
                      {
                        type: "null",
                      },
                    ],
                  },

                  confidence: {
                    type: "string",

                    enum: [
                      "high",
                      "medium",
                      "low",
                    ],
                  },

                  identification_notes: {
                    type: "string",
                  },

                  warnings: {
                    type: "array",

                    items: {
                      type: "string",
                    },
                  },

                  specifications: {
                    type: "array",

                    items: {
                      type: "object",

                      properties: {
                        category: {
                          type: "string",
                        },

                        specification: {
                          type: "string",
                        },

                        value: {
                          type: "string",
                        },

                        unit: {
                          type: "string",
                        },

                        confidence: {
                          type: "string",

                          enum: [
                            "high",
                            "medium",
                            "low",
                          ],
                        },
                      },

                      required: [
                        "category",
                        "specification",
                        "value",
                        "unit",
                        "confidence",
                      ],

                      additionalProperties:
                        false,
                    },
                  },
                },

                required: [
                  "identified",
                  "make",
                  "model",
                  "variant",
                  "year",
                  "asset_type",
                  "engine_platform",
                  "engine_cc",
                  "confidence",
                  "identification_notes",
                  "warnings",
                  "specifications",
                ],

                additionalProperties:
                  false,
              },
            },
          },
        }
      );

    /*
     * PARSE STRUCTURED RESULT
     */

    if (
      !response.output_text
    ) {
      return NextResponse.json(
        {
          error:
            "AI did not return vehicle details.",
        },
        { status: 502 }
      );
    }

    let vehicleDetails;

    try {
      vehicleDetails =
        JSON.parse(
          response.output_text
        );
    } catch (error) {
      console.error(
        "AI JSON parse error:",
        error
      );

      console.error(
        "Raw AI output:",
        response.output_text
      );

      return NextResponse.json(
        {
          error:
            "AI returned an invalid vehicle response.",
        },
        { status: 502 }
      );
    }

    /*
     * EXTRACT SEARCH SOURCES
     */

    const sourceMap =
      new Map<
        string,
        Source
      >();

    for (
      const item of response.output as any[]
    ) {
      if (
        item?.type !==
        "web_search_call"
      ) {
        continue;
      }

      const sources =
        item?.action?.sources;

      if (
        !Array.isArray(sources)
      ) {
        continue;
      }

      for (
        const source of sources
      ) {
        const url =
          String(
            source?.url ||
              ""
          ).trim();

        if (!url) {
          continue;
        }

        sourceMap.set(
          url,
          {
            title:
              String(
                source?.title ||
                  url
              ),

            url,
          }
        );
      }
    }

    const sources =
      Array.from(
        sourceMap.values()
      );

    /*
     * RESPONSE TO GARAGE
     */

    return NextResponse.json({
      ...vehicleDetails,

      sources,

      researched_at:
        new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(
      "Vehicle AI lookup error:",
      error
    );

    /*
     * Common API errors
     */

    if (
      error?.status === 401
    ) {
      return NextResponse.json(
        {
          error:
            "OpenAI API key is invalid.",
        },
        { status: 401 }
      );
    }

    if (
      error?.status === 429
    ) {
      return NextResponse.json(
        {
          error:
            "OpenAI API rate limit or billing limit reached.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unable to research vehicle.",
      },
      { status: 500 }
    );
  }
}