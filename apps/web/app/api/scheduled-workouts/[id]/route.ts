import { NextRequest, NextResponse } from "next/server";

import { authenticatedApiFetch } from "@/lib/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const [{ id }, body] = await Promise.all([context.params, request.json()]);
  const response = await authenticatedApiFetch(`/scheduled-workouts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response) {
    return NextResponse.json(
      { message: "Unable to connect to API" },
      { status: 503 },
    );
  }

  return NextResponse.json(await response.json(), { status: response.status });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const response = await authenticatedApiFetch(`/scheduled-workouts/${id}`, {
    method: "DELETE",
  });

  if (!response) {
    return NextResponse.json(
      { message: "Unable to connect to API" },
      { status: 503 },
    );
  }

  return NextResponse.json(await response.json(), { status: response.status });
}
