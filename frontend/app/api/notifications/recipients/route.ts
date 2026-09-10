import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { groupIds, tower } = body;
    if (!Array.isArray(groupIds)) {
      return NextResponse.json({ error: "groupIds array is required" }, { status: 400 });
    }
    const summary = await db.getActiveDLRecipients(groupIds, tower);
    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
