import { NextRequest, NextResponse } from "next/server";

import { authenticatedApiFetch } from "@/lib/api";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const response = await authenticatedApiFetch(`/movements/${id}`);

  if (!response) {
    return NextResponse.json(
      {
        message: "Unable to connect to API",
      },
      {
        status: 503,
      },
    );
  }

  const data = await response.json();

  return NextResponse.json(data, {
    status: response.status,
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const response = await authenticatedApiFetch(`/movements/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(await request.json()),
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
  const response = await authenticatedApiFetch(`/movements/${id}`, {
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
