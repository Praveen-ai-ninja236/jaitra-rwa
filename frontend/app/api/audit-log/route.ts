import { NextRequest, NextResponse } from "next/server";
import * as db from "../../../lib/db";

export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "200");
    const logs = await db.getAuditLogs(limit);
    return NextResponse.json(logs);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await db.insertAuditLog(body);
    return NextResponse.json({ message: "Audit log recorded" });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
