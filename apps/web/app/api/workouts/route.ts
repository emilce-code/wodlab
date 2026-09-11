import { NextRequest, NextResponse } from "next/server";

import { authenticatedApiFetch } from "@/lib/api";

export async function GET(request: NextRequest) {
  const query = new URLSearchParams();
  const view = request.nextUrl.searchParams.get("view");

  for (const parameter of ["search", "benchmark", "page", "pageSize"]) {
    const value = request.nextUrl.searchParams.get(parameter)?.trim();
    if (value) query.set(parameter, value);
  }

  const collection = view === "archived" ? "/workouts/archived" : "/workouts";
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  const response = await authenticatedApiFetch(`${collection}${suffix}`);

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

export async function POST(request: NextRequest) {
  const body = await request.json();

  const response = await authenticatedApiFetch("/workouts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

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
