import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitStr = searchParams.get("limit");
    const limit = limitStr ? parseInt(limitStr, 10) : 100;
    const history = await db.getBroadcastNotifications(limit);
    return NextResponse.json(history);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
