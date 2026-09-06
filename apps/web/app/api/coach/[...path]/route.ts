import { NextRequest, NextResponse } from "next/server";

import { authenticatedApiFetch } from "@/lib/api";

type Context = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: Context, method: string) {
  const { path } = await context.params;
  const body = method === "GET" || method === "DELETE" ? undefined : await request.text();
  const response = await authenticatedApiFetch(`/coach/${path.join("/")}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body,
  });

  if (!response) {
    return NextResponse.json({ message: "Unable to connect to API" }, { status: 503 });
  }

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export function GET(request: NextRequest, context: Context) {
  return proxy(request, context, "GET");
}

export function POST(request: NextRequest, context: Context) {
  return proxy(request, context, "POST");
}

export function PATCH(request: NextRequest, context: Context) {
  return proxy(request, context, "PATCH");
}

export function DELETE(request: NextRequest, context: Context) {
  return proxy(request, context, "DELETE");
}
