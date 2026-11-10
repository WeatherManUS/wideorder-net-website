import { NextResponse } from "next/server";
import { getTrackingConfig } from "@/config/marketing";

export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json(getTrackingConfig(), { headers: { "Cache-Control": "no-store" } });
}
