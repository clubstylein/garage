const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
    return new Response("Directus is not configured", {
      status: 500,
    });
  }

  const { id } = await params;

  const response = await fetch(
    `${DIRECTUS_URL}/assets/${id}`,
    {
      headers: {
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return new Response("Image not found", {
      status: response.status,
    });
  }

  const file = await response.arrayBuffer();

  return new Response(file, {
    status: 200,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") ||
        "application/octet-stream",

      "Cache-Control": "private, max-age=3600",
    },
  });
}