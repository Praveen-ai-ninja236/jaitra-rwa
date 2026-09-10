import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { updates } = body;
    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: "updates array is required" }, { status: 400 });
    }
    const res = await db.batchUpdateDLMembers(updates);
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
