import { NextResponse } from "next/server";
import { authenticatedApiFetch } from "@/lib/api";

export async function GET() {
  const response = await authenticatedApiFetch("/notifications");
  if (!response)
    return NextResponse.json(
      { message: "Unable to connect to API" },
      { status: 503 },
    );
  return NextResponse.json(await response.json(), { status: response.status });
}
