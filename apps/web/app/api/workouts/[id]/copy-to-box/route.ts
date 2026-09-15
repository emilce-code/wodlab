import { NextResponse } from "next/server";

import { authenticatedApiFetch } from "@/lib/api";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const response = await authenticatedApiFetch(
    `/workouts/${encodeURIComponent(id)}/copy-to-box`,
    {
      method: "POST",
    },
  );

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
