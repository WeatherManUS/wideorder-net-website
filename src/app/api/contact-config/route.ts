import { NextResponse } from "next/server";

import { getRuntimeContactConfig } from "@/lib/managed-config/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getRuntimeContactConfig();

    return NextResponse.json(config, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json(
      { turnstileSiteKey: "" },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      },
    );
  }
}
