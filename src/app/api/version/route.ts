import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Shows which version of the site is live, e.g. {"version":"b7cf103"}. */
export function GET() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? "local";
  return NextResponse.json(
    { version: sha.slice(0, 7), message: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? "" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
