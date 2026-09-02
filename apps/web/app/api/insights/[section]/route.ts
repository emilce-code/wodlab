import { NextRequest, NextResponse } from "next/server";

import { authenticatedApiFetch } from "@/lib/api";

const insightSections = new Set(["consistency", "performance", "balance"]);

type Context = {
  params: Promise<{
    section: string;
  }>;
};

export async function GET(request: NextRequest, context: Context) {
  const { section } = await context.params;

  if (!insightSections.has(section)) {
    return NextResponse.json(
      { message: "Insight section not found" },
      { status: 404 },
    );
  }

  const response = await authenticatedApiFetch(
    `/users/me/insights/${section}${request.nextUrl.search}`,
  );

  if (!response) {
    return NextResponse.json(
      { message: "Unable to connect to API" },
      { status: 503 },
    );
  }

  const data = (await response.json()) as unknown;

  return NextResponse.json(data, { status: response.status });
}
