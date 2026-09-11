import { NextRequest, NextResponse } from "next/server";

import { authenticatedApiFetch } from "@/lib/api";

async function proxy(request: NextRequest, method: "GET" | "POST") {
  const body = method === "POST" ? await request.text() : undefined;
  const response = await authenticatedApiFetch("/boxes", {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body,
  });
  if (!response) {
    return NextResponse.json(
      { message: "Unable to connect to API" },
      { status: 503 },
    );
  }
  return NextResponse.json(await response.json(), { status: response.status });
}

export function GET(request: NextRequest) {
  return proxy(request, "GET");
}

export function POST(request: NextRequest) {
  return proxy(request, "POST");
}
