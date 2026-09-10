import { NextRequest, NextResponse } from "next/server";
import { authenticatedApiFetch } from "@/lib/api";

type Context = { params: Promise<{ path: string[] }> };

async function forward(
  request: NextRequest,
  context: Context,
  method: "PATCH" | "DELETE",
) {
  const { path } = await context.params;
  const body = method === "PATCH" ? await request.text() : undefined;
  const response = await authenticatedApiFetch(
    `/notifications/${path.map(encodeURIComponent).join("/")}`,
    {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body || undefined,
    },
  );
  if (!response)
    return NextResponse.json(
      { message: "Unable to connect to API" },
      { status: 503 },
    );
  return NextResponse.json(await response.json(), { status: response.status });
}

export function PATCH(request: NextRequest, context: Context) {
  return forward(request, context, "PATCH");
}

export function DELETE(request: NextRequest, context: Context) {
  return forward(request, context, "DELETE");
}
