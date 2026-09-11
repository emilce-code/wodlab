import { NextRequest, NextResponse } from "next/server";

import { authenticatedApiFetch } from "@/lib/api";

export async function POST(request: NextRequest) {
  const response = await authenticatedApiFetch("/workout-imports/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(await request.json()),
  });

  if (!response) {
    return NextResponse.json({ message: "Unable to connect to API" }, { status: 503 });
  }

  return NextResponse.json(await response.json(), { status: response.status });
}
