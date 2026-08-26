import { NextResponse } from "next/server";

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

export async function POST(request: Request) {
  try {
    if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
      return NextResponse.json(
        { error: "Directus is not configured" },
        { status: 500 }
      );
    }

    const incomingForm = await request.formData();

    const file = incomingForm.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No image supplied" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be smaller than 10 MB" },
        { status: 400 }
      );
    }

    const directusForm = new FormData();

    directusForm.append("file", file);

    const title = incomingForm.get("title");

    if (title) {
      directusForm.append(
        "title",
        String(title)
      );
    }

    const response = await fetch(
      `${DIRECTUS_URL}/files`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${DIRECTUS_TOKEN}`,
        },

        body: directusForm,
      }
    );

    const text = await response.text();

    let result;

    try {
      result = JSON.parse(text);
    } catch {
      console.error(
        "Unexpected Directus file response:",
        text
      );

      return NextResponse.json(
        { error: "Invalid response from Directus file upload" },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error(
        "DIRECTUS FILE UPLOAD ERROR:",
        result
      );

      return NextResponse.json(
        {
          error:
            result?.errors?.[0]?.message ||
            "Unable to upload image",
        },
        { status: response.status }
      );
    }

    console.log(
      "Uploaded Directus file:",
      result.data.id
    );

    return NextResponse.json({
      id: result.data.id,
    });
  } catch (error) {
    console.error(
      "FILE UPLOAD ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Unable to upload image" },
      { status: 500 }
    );
  }
}