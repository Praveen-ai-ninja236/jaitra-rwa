import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberIds } = body;
    if (!Array.isArray(memberIds)) {
      return NextResponse.json({ error: "memberIds array is required" }, { status: 400 });
    }
    const res = await db.bulkDeleteDLMembers(memberIds);
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
