import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberIds, targetGroupId, mode } = body;
    if (!Array.isArray(memberIds) || !targetGroupId) {
      return NextResponse.json({ error: "memberIds array and targetGroupId are required" }, { status: 400 });
    }
    const res = await db.bulkMoveDLMembers(memberIds, targetGroupId, mode || "move");
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
