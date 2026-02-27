import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "devops-blog-client",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
