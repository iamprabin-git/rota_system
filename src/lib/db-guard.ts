import { NextResponse } from "next/server";
import { liveDatabaseMissing } from "./sql";

export function requireLiveDatabase() {
  if (!liveDatabaseMissing()) return null;
  return NextResponse.json(
    {
      error:
        "This live site is not connected to the database. Add DATABASE_URL or POSTGRES_URL in Vercel Project Settings → Environment Variables, then redeploy.",
      reason: "server",
    },
    { status: 503 },
  );
}
